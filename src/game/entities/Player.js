import Phaser from 'phaser'
import { Ball } from './Ball.js'
import { AudioSystem } from '../systems/AudioSystem.js'
import { COLORS, GAME_HEIGHT } from '../constants.js'

const PLAYER_WIDTH = 36
const PLAYER_HEIGHT = 60
const MOVE_SPEED = 160
const JUMP_VELOCITY = -350
const INVINCIBILITY_FRAMES = 750 // ms
const MAX_CHARGE_TIME = 1500 // ms

export class Player {
  constructor(scene, x, y) {
    this.scene = scene
    this.hp = 100
    this.maxHp = 100
    this.lives = 3
    this.facing = 1 // 1 = right, -1 = left
    this.isCharging = false
    this.chargeStart = 0
    this.chargeLevel = 0
    this.invincible = false
    this.invincibleUntil = 0
    this.isDodging = false
    this.isDucking = false
    this.walkFrame = 0
    this.walkTimer = 0
    this.onHealthChange = null
    this.onLivesChange = null
    this.onChargeChange = null
    this.onDeath = null
    this.onDamageTaken = null

    // Create physics body
    this.sprite = scene.physics.add.sprite(x, y, null)
    this.sprite.setSize(PLAYER_WIDTH, PLAYER_HEIGHT)
    this.sprite.setOffset(0, 0)
    this.sprite.setCollideWorldBounds(false)
    this.sprite.setVisible(false)
    this.sprite.setDepth(10)
    this.sprite.body.setMaxVelocityY(600)

    // Graphics for drawing the character
    this.graphics = scene.add.graphics()
    this.graphics.setDepth(10)

    // Charge bar graphics
    this.chargeBar = scene.add.graphics()
    this.chargeBar.setDepth(11)

    // Input
    this.cursors = scene.input.keyboard.createCursorKeys()
    this.wasd = {
      up: scene.input.keyboard.addKey('W'),
      down: scene.input.keyboard.addKey('S'),
      left: scene.input.keyboard.addKey('A'),
      right: scene.input.keyboard.addKey('D')
    }
    this.spaceKey = scene.input.keyboard.addKey('SPACE')

    // Dodge tracking
    this.lastLeftTap = 0
    this.lastRightTap = 0
    this.doubleTapThreshold = 250

    // Track previous key states for tap detection
    this.prevLeftDown = false
    this.prevRightDown = false

    // Space key: tap = jump, hold = charge, release = fire
    this.spaceDownTime = 0
    this.spaceWasDown = false
    this.HOLD_THRESHOLD = 120 // ms — hold longer than this = charge
  }

  update(time) {
    if (!this.sprite.active) return

    const onGround = this.sprite.body.blocked.down

    // Movement
    let moving = false
    const vi = window.__virtualInput
    const leftDown = this.cursors.left.isDown || this.wasd.left.isDown || (vi && vi.left)
    const rightDown = this.cursors.right.isDown || this.wasd.right.isDown || (vi && vi.right)

    // Double-tap dodge detection
    if (leftDown && !this.prevLeftDown) {
      if (time - this.lastLeftTap < this.doubleTapThreshold) {
        this.dodge(-1)
      }
      this.lastLeftTap = time
    }
    if (rightDown && !this.prevRightDown) {
      if (time - this.lastRightTap < this.doubleTapThreshold) {
        this.dodge(1)
      }
      this.lastRightTap = time
    }
    this.prevLeftDown = leftDown
    this.prevRightDown = rightDown

    if (this.isDodging) {
      // Let dodge play out
    } else if (leftDown) {
      this.sprite.setVelocityX(-MOVE_SPEED)
      this.facing = -1
      moving = true
    } else if (rightDown) {
      this.sprite.setVelocityX(MOVE_SPEED)
      this.facing = 1
      moving = true
    } else {
      this.sprite.setVelocityX(0)
    }

    // Jump (Up / W only — space is reserved for charge/throw)
    const jumpPressed = this.cursors.up.isDown || this.wasd.up.isDown || (vi && vi.actionB) || (vi && vi.up)
    if (jumpPressed && onGround) {
      this.sprite.setVelocityY(JUMP_VELOCITY)
    }

    // Duck (Down / S / D-pad down)
    const downDown = this.cursors.down.isDown || this.wasd.down.isDown || (vi && vi.down)
    if (downDown && onGround && !this.isDodging) {
      if (!this.isDucking) {
        this.isDucking = true
        this.sprite.setSize(PLAYER_WIDTH, 36)
        this.sprite.setOffset(0, 24)
      }
      this.sprite.setVelocityX(0)
    } else if (this.isDucking) {
      this.isDucking = false
      this.sprite.setSize(PLAYER_WIDTH, PLAYER_HEIGHT)
      this.sprite.setOffset(0, 0)
    }

    // Space key: hold = charge, release = fire, quick tap = small throw
    const spaceDown = this.spaceKey.isDown || (vi && vi.actionA)

    if (spaceDown && !this.spaceWasDown) {
      // Space just pressed — record time
      this.spaceDownTime = time
    }

    if (spaceDown) {
      const held = time - this.spaceDownTime
      if (held >= this.HOLD_THRESHOLD) {
        // Holding — charge up
        if (!this.isCharging) {
          this.isCharging = true
          this.chargeStart = time
        }
        this.chargeLevel = Math.min((time - this.chargeStart) / MAX_CHARGE_TIME, 1)
        if (this.onChargeChange) this.onChargeChange(this.chargeLevel)

        // Play sound when fully charged
        const prevLevel = Math.min((time - 16 - this.chargeStart) / MAX_CHARGE_TIME, 1)
        if (this.chargeLevel >= 1 && prevLevel < 1) {
          AudioSystem.playChargeReady()
        }
      }
    }

    if (!spaceDown && this.spaceWasDown) {
      // Space just released
      if (this.isCharging) {
        // Was charging — fire with current charge level
        this.fire()
        this.isCharging = false
        this.chargeLevel = 0
        if (this.onChargeChange) this.onChargeChange(0)
      } else {
        // Quick tap — fire a minimum-charge shot
        this.chargeLevel = 0
        this.fire()
      }
    }

    this.spaceWasDown = spaceDown

    // Walk animation
    if (moving && onGround) {
      this.walkTimer += 16
      if (this.walkTimer > 150) {
        this.walkFrame = (this.walkFrame + 1) % 4
        this.walkTimer = 0
      }
    } else {
      this.walkFrame = 0
      this.walkTimer = 0
    }

    // Check invincibility
    if (this.invincible && time > this.invincibleUntil) {
      this.invincible = false
    }

    // Draw character
    this.draw(time)
  }

  fire() {
    AudioSystem.playThrow()
    const x = this.sprite.x + (this.facing * 30)
    const y = this.sprite.y - 8
    const ball = new Ball(this.scene, x, y, this.facing, this.chargeLevel)
    this.scene.balls.push(ball)
  }

  dodge(direction) {
    if (this.isDodging) return
    this.isDodging = true
    this.invincible = true
    this.invincibleUntil = this.scene.time.now + 400

    this.sprite.setVelocityX(direction * 350)
    this.scene.time.delayedCall(300, () => {
      this.isDodging = false
    })
  }

  takeDamage(amount) {
    if (this.invincible) return

    this.hp -= amount
    this.invincible = true
    this.invincibleUntil = this.scene.time.now + INVINCIBILITY_FRAMES
    AudioSystem.playHealthLost()
    if (this.onDamageTaken) this.onDamageTaken(amount)

    if (this.scene.comboSystem) {
      this.scene.comboSystem.breakCombo()
    }

    // Screen shake
    this.scene.cameras.main.shake(200, 0.01)

    if (this.onHealthChange) this.onHealthChange(this.hp, this.maxHp)

    if (this.hp <= 0) {
      this.lives--
      if (this.onLivesChange) this.onLivesChange(this.lives)
      if (this.lives <= 0) {
        if (this.onDeath) this.onDeath()
      } else {
        // Respawn
        this.hp = this.maxHp
        if (this.onHealthChange) this.onHealthChange(this.hp, this.maxHp)
        this.invincible = true
        this.invincibleUntil = this.scene.time.now + 2000
      }
    }
  }

  draw(time) {
    this.graphics.clear()
    this.chargeBar.clear()

    const x = this.sprite.x
    const y = this.sprite.y
    const flip = this.facing

    // Flicker when invincible
    if (this.invincible && Math.floor(time / 80) % 2 === 0) return

    if (this.isDucking) {
      // --- DUCKING POSE (compressed, knees bent) ---
      // Legs (bent, shorter)
      this.graphics.fillStyle(0x1a1a3a)
      this.graphics.fillRect(x - 12, y + 15, 9, 9)
      this.graphics.fillRect(x + 3, y + 15, 9, 9)

      // Shoes (dark brown dress shoes)
      this.graphics.fillStyle(0x3B2314)
      this.graphics.fillRect(x - 14, y + 23, 12, 5)
      this.graphics.fillRect(x + 2, y + 23, 12, 5)

      // Body (suit jacket — squished)
      this.graphics.fillStyle(0x1a1a4a)
      this.graphics.fillRect(x - 14, y - 3, 27, 21)

      // White dress shirt collar
      this.graphics.fillStyle(0xF0F0F0)
      this.graphics.fillRect(x - 6, y - 3, 12, 5)

      // Tie (shorter)
      this.graphics.fillStyle(COLORS.RED)
      this.graphics.fillRect(x - 2, y - 3, 3, 15)

      // Arms (tucked)
      this.graphics.fillStyle(0x1a1a4a)
      this.graphics.fillRect(x - 20, y, 8, 12)
      this.graphics.fillRect(x + 12, y, 8, 12)

      // Hands
      this.graphics.fillStyle(0xE8B090)
      this.graphics.fillRect(x - 20, y + 11, 8, 5)
      this.graphics.fillRect(x + 12, y + 11, 8, 5)

      // Head (lowered)
      this.graphics.fillStyle(0xE8B090)
      this.graphics.fillRect(x - 10, y - 21, 21, 20)

      // Hair (receding hairline — sides fuller, top thinning at front)
      this.graphics.fillStyle(0x3D2517)
      this.graphics.fillRect(x - 12, y - 24, 3, 12)
      this.graphics.fillRect(x + 9, y - 24, 3, 12)
      this.graphics.fillRect(x - 9, y - 26, 18, 3)
      this.graphics.fillRect(x - 5, y - 23, 9, 2)

      // Glasses (regular frames with visible eyes)
      this.graphics.fillStyle(0x666666)
      this.graphics.fillRect(x - 8, y - 15, 6, 5)
      this.graphics.fillRect(x + 2, y - 15, 6, 5)
      this.graphics.fillStyle(0xFFFFFF)
      this.graphics.fillRect(x - 6, y - 14, 3, 2)
      this.graphics.fillRect(x + 3, y - 14, 3, 2)
      this.graphics.fillStyle(0x111111)
      this.graphics.fillRect(x - 5, y - 14, 2, 2)
      this.graphics.fillRect(x + 4, y - 14, 2, 2)

      // Mouth
      this.graphics.fillStyle(0x333333)
      this.graphics.fillRect(x - 3, y - 6, 6, 2)
    } else {
      // --- NORMAL STANDING POSE ---
      // Legs
      const legOffset = this.walkFrame % 2 === 0 ? 3 : -3
      this.graphics.fillStyle(0x1a1a3a) // dark suit pants
      this.graphics.fillRect(x - 10, y + 9, 8, 21 + legOffset)
      this.graphics.fillRect(x + 3, y + 9, 8, 21 - legOffset)

      // Shoes (dark brown dress shoes)
      this.graphics.fillStyle(0x3B2314)
      this.graphics.fillRect(x - 12, y + 27 + legOffset, 10, 5)
      this.graphics.fillRect(x + 2, y + 27 - legOffset, 10, 5)

      // Body (suit jacket)
      this.graphics.fillStyle(0x1a1a4a) // navy suit
      this.graphics.fillRect(x - 14, y - 15, 27, 27)

      // White dress shirt collar
      this.graphics.fillStyle(0xF0F0F0)
      this.graphics.fillRect(x - 6, y - 15, 12, 5)

      // Tie
      this.graphics.fillStyle(COLORS.RED)
      this.graphics.fillRect(x - 2, y - 15, 3, 21)

      // Arms
      const armSwing = this.walkFrame < 2 ? 5 : -5
      this.graphics.fillStyle(0x1a1a4a)
      this.graphics.fillRect(x - 20, y - 12 + armSwing, 8, 18)
      this.graphics.fillRect(x + 12, y - 12 - armSwing, 8, 18)

      // Hands (skin tone)
      this.graphics.fillStyle(0xE8B090)
      this.graphics.fillRect(x - 20, y + 5 + armSwing, 8, 5)
      this.graphics.fillRect(x + 12, y + 5 - armSwing, 8, 5)

      // Head
      this.graphics.fillStyle(0xE8B090) // skin
      this.graphics.fillRect(x - 10, y - 33, 21, 20)

      // Hair (receding hairline — sides fuller, top thinning at front)
      this.graphics.fillStyle(0x3D2517)
      this.graphics.fillRect(x - 12, y - 36, 3, 12)
      this.graphics.fillRect(x + 9, y - 36, 3, 12)
      this.graphics.fillRect(x - 9, y - 38, 18, 3)
      this.graphics.fillRect(x - 5, y - 35, 9, 2)

      // Glasses (regular frames with visible eyes)
      this.graphics.fillStyle(0x666666)
      this.graphics.fillRect(x - 8, y - 27, 6, 5)
      this.graphics.fillRect(x + 2, y - 27, 6, 5)
      this.graphics.fillStyle(0xFFFFFF)
      this.graphics.fillRect(x - 6, y - 25, 3, 2)
      this.graphics.fillRect(x + 3, y - 25, 3, 2)
      this.graphics.fillStyle(0x111111)
      this.graphics.fillRect(x - 5, y - 25, 2, 2)
      this.graphics.fillRect(x + 4, y - 25, 2, 2)

      // Mouth (small line)
      this.graphics.fillStyle(0x333333)
      this.graphics.fillRect(x - 3, y - 18, 6, 2)
    }

    // Charge bar
    if (this.isCharging) {
      const barWidth = 45
      const barHeight = 6
      const barX = x - barWidth / 2
      const barY = y - 45

      // Background
      this.chargeBar.fillStyle(0x333333)
      this.chargeBar.fillRect(barX, barY, barWidth, barHeight)

      // Fill
      const fillColor = this.chargeLevel < 0.33 ? 0x00D4FF :
        this.chargeLevel < 0.67 ? 0x00D4FF : COLORS.GOLD
      this.chargeBar.fillStyle(fillColor)
      this.chargeBar.fillRect(barX, barY, barWidth * this.chargeLevel, barHeight)

      // Border
      this.chargeBar.lineStyle(1, COLORS.WHITE)
      this.chargeBar.strokeRect(barX, barY, barWidth, barHeight)
    }
  }

  destroy() {
    this.graphics.destroy()
    this.chargeBar.destroy()
    this.sprite.destroy()
  }
}
