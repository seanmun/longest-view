import Phaser from 'phaser'
import { Ball } from './Ball.js'
import { PoisonPill } from './PoisonPill.js'
import { TankProjectile } from './TankProjectile.js'
import { AudioSystem } from '../systems/AudioSystem.js'
import { COLORS, GAME_HEIGHT } from '../constants.js'

const PLAYER_WIDTH = 54
const PLAYER_HEIGHT = 90
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

    // Weapon selection — read from registry or default to lotto_ball
    this.weapon = (scene.game && scene.game.registry) ?
      (scene.game.registry.get('selectedWeapon') || 'lotto_ball') : 'lotto_ball'

    // Tank cooldown
    this.tankCooldown = 0
    this.TANK_COOLDOWN_TIME = 3500 // ms between tank deploys
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
        this.sprite.setSize(PLAYER_WIDTH, 54)
        this.sprite.setOffset(0, 36)
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
    const x = this.sprite.x + (this.facing * 45)
    const y = this.sprite.y - 12

    if (this.weapon === 'poison_pill') {
      AudioSystem.playThrow()
      const pill = new PoisonPill(this.scene, x, y, this.facing, this.chargeLevel)
      this.scene.balls.push(pill)
    } else if (this.weapon === 'tank') {
      // Tank has a cooldown
      const now = this.scene.time.now
      if (now < this.tankCooldown) return // still on cooldown
      this.tankCooldown = now + this.TANK_COOLDOWN_TIME
      AudioSystem.playThrow()
      const tank = new TankProjectile(this.scene, x, y + 20, this.facing, this.chargeLevel)
      this.scene.balls.push(tank)
    } else {
      // Default: lotto ball
      AudioSystem.playThrow()
      const ball = new Ball(this.scene, x, y, this.facing, this.chargeLevel)
      this.scene.balls.push(ball)
    }
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
      this.graphics.fillRect(x - 18, y + 23, 14, 14)
      this.graphics.fillRect(x + 5, y + 23, 14, 14)

      // Shoes (dark brown dress shoes)
      this.graphics.fillStyle(0x3B2314)
      this.graphics.fillRect(x - 21, y + 35, 18, 8)
      this.graphics.fillRect(x + 3, y + 35, 18, 8)

      // Body (suit jacket — squished)
      this.graphics.fillStyle(0x1a1a4a)
      this.graphics.fillRect(x - 21, y - 5, 41, 32)

      // White dress shirt collar
      this.graphics.fillStyle(0xF0F0F0)
      this.graphics.fillRect(x - 9, y - 5, 18, 8)

      // Tie (shorter)
      this.graphics.fillStyle(COLORS.RED)
      this.graphics.fillRect(x - 3, y - 5, 5, 23)

      // Arms (tucked)
      this.graphics.fillStyle(0x1a1a4a)
      this.graphics.fillRect(x - 30, y, 12, 18)
      this.graphics.fillRect(x + 18, y, 12, 18)

      // Hands
      this.graphics.fillStyle(0xE8B090)
      this.graphics.fillRect(x - 30, y + 17, 12, 8)
      this.graphics.fillRect(x + 18, y + 17, 12, 8)

      // Head (lowered)
      this.graphics.fillStyle(0xE8B090)
      this.graphics.fillRect(x - 15, y - 32, 32, 30)

      // Hair (receding hairline — sides fuller, top thinning at front)
      this.graphics.fillStyle(0x3D2517)
      this.graphics.fillRect(x - 18, y - 36, 5, 18)
      this.graphics.fillRect(x + 14, y - 36, 5, 18)
      this.graphics.fillRect(x - 14, y - 39, 27, 5)
      this.graphics.fillRect(x - 8, y - 35, 14, 3)

      // Glasses (regular frames with visible eyes)
      this.graphics.fillStyle(0x666666)
      this.graphics.fillRect(x - 12, y - 23, 9, 8)
      this.graphics.fillRect(x + 3, y - 23, 9, 8)
      this.graphics.fillStyle(0xFFFFFF)
      this.graphics.fillRect(x - 9, y - 21, 5, 3)
      this.graphics.fillRect(x + 5, y - 21, 5, 3)
      this.graphics.fillStyle(0x111111)
      this.graphics.fillRect(x - 8, y - 21, 3, 3)
      this.graphics.fillRect(x + 6, y - 21, 3, 3)

      // Mouth
      this.graphics.fillStyle(0x333333)
      this.graphics.fillRect(x - 5, y - 9, 9, 3)
    } else {
      // --- NORMAL STANDING POSE ---
      // Legs
      const legOffset = this.walkFrame % 2 === 0 ? 5 : -5
      this.graphics.fillStyle(0x1a1a3a) // dark suit pants
      this.graphics.fillRect(x - 15, y + 14, 12, 32 + legOffset)
      this.graphics.fillRect(x + 5, y + 14, 12, 32 - legOffset)

      // Shoes (dark brown dress shoes)
      this.graphics.fillStyle(0x3B2314)
      this.graphics.fillRect(x - 18, y + 41 + legOffset, 15, 8)
      this.graphics.fillRect(x + 3, y + 41 - legOffset, 15, 8)

      // Body (suit jacket)
      this.graphics.fillStyle(0x1a1a4a) // navy suit
      this.graphics.fillRect(x - 21, y - 23, 41, 41)

      // White dress shirt collar
      this.graphics.fillStyle(0xF0F0F0)
      this.graphics.fillRect(x - 9, y - 23, 18, 8)

      // Tie
      this.graphics.fillStyle(COLORS.RED)
      this.graphics.fillRect(x - 3, y - 23, 5, 32)

      // Arms
      const armSwing = this.walkFrame < 2 ? 8 : -8
      this.graphics.fillStyle(0x1a1a4a)
      this.graphics.fillRect(x - 30, y - 18 + armSwing, 12, 27)
      this.graphics.fillRect(x + 18, y - 18 - armSwing, 12, 27)

      // Hands (skin tone)
      this.graphics.fillStyle(0xE8B090)
      this.graphics.fillRect(x - 30, y + 8 + armSwing, 12, 8)
      this.graphics.fillRect(x + 18, y + 8 - armSwing, 12, 8)

      // Head
      this.graphics.fillStyle(0xE8B090) // skin
      this.graphics.fillRect(x - 15, y - 50, 32, 30)

      // Hair (receding hairline — sides fuller, top thinning at front)
      this.graphics.fillStyle(0x3D2517)
      this.graphics.fillRect(x - 18, y - 54, 5, 18)
      this.graphics.fillRect(x + 14, y - 54, 5, 18)
      this.graphics.fillRect(x - 14, y - 57, 27, 5)
      this.graphics.fillRect(x - 8, y - 53, 14, 3)

      // Glasses (regular frames with visible eyes)
      this.graphics.fillStyle(0x666666)
      this.graphics.fillRect(x - 12, y - 41, 9, 8)
      this.graphics.fillRect(x + 3, y - 41, 9, 8)
      this.graphics.fillStyle(0xFFFFFF)
      this.graphics.fillRect(x - 9, y - 38, 5, 3)
      this.graphics.fillRect(x + 5, y - 38, 5, 3)
      this.graphics.fillStyle(0x111111)
      this.graphics.fillRect(x - 8, y - 38, 3, 3)
      this.graphics.fillRect(x + 6, y - 38, 3, 3)

      // Mouth (small line)
      this.graphics.fillStyle(0x333333)
      this.graphics.fillRect(x - 5, y - 27, 9, 3)
    }

    // Charge bar
    if (this.isCharging) {
      const barWidth = 68
      const barHeight = 6
      const barX = x - barWidth / 2
      const barY = y - 68

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
