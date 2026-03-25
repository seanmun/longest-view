import Phaser from 'phaser'
import { Ball } from './Ball.js'
import { PoisonPill } from './PoisonPill.js'
import { TankProjectile } from './TankProjectile.js'
import { AudioSystem } from '../systems/AudioSystem.js'
import { COLORS, GAME_HEIGHT } from '../constants.js'

const PLAYER_WIDTH = 54
const PLAYER_HEIGHT = 90
const MOVE_SPEED = 160
const TANK_MOVE_SPEED = 100
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
    this.sprite.setCollideWorldBounds(true)
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

    // Tank cannon cooldown
    this.tankCooldown = 0
    this.TANK_COOLDOWN_TIME = 1500 // ms between cannon shots
  }

  update(time) {
    if (!this.sprite.active) return

    const onGround = this.sprite.body.blocked.down

    // Movement
    let moving = false
    const vi = window.__virtualInput
    const leftDown = this.cursors.left.isDown || this.wasd.left.isDown || (vi && vi.left)
    const rightDown = this.cursors.right.isDown || this.wasd.right.isDown || (vi && vi.right)
    const isTank = this.weapon === 'tank'
    const moveSpeed = isTank ? TANK_MOVE_SPEED : MOVE_SPEED

    // Double-tap dodge detection (not available in tank)
    if (!isTank) {
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
    }
    this.prevLeftDown = leftDown
    this.prevRightDown = rightDown

    if (this.isDodging) {
      // Let dodge play out
    } else if (leftDown) {
      this.sprite.setVelocityX(-moveSpeed)
      this.facing = -1
      moving = true
    } else if (rightDown) {
      this.sprite.setVelocityX(moveSpeed)
      this.facing = 1
      moving = true
    } else {
      this.sprite.setVelocityX(0)
    }

    // Jump (tank gets a heavier, lower jump)
    const jumpPressed = this.cursors.up.isDown || this.wasd.up.isDown || (vi && vi.actionB) || (vi && vi.up)
    if (jumpPressed && onGround) {
      this.sprite.setVelocityY(isTank ? JUMP_VELOCITY * 0.7 : JUMP_VELOCITY)
    }

    // Duck (not available in tank)
    if (!isTank) {
      const downDown = this.cursors.down.isDown || this.wasd.down.isDown || (vi && vi.down)
      if (downDown && onGround && !this.isDodging) {
        if (!this.isDucking) {
          this.isDucking = true
          this.sprite.setSize(PLAYER_WIDTH, 54)
          this.sprite.setOffset(-27, -9)
        }
        this.sprite.setVelocityX(0)
      } else if (this.isDucking) {
        this.isDucking = false
        this.sprite.setSize(PLAYER_WIDTH, PLAYER_HEIGHT)
      }
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
    if (this.weapon === 'poison_pill') {
      const x = this.sprite.x + (this.facing * 45)
      const y = this.sprite.y - 12
      AudioSystem.playThrow()
      const pill = new PoisonPill(this.scene, x, y, this.facing, this.chargeLevel)
      this.scene.balls.push(pill)
    } else if (this.weapon === 'tank') {
      // Cannon fires from barrel tip
      const now = this.scene.time.now
      if (now < this.tankCooldown) return
      this.tankCooldown = now + this.TANK_COOLDOWN_TIME
      const x = this.sprite.x + (this.facing * 55)
      const y = this.sprite.y - 18
      AudioSystem.playBossHit() // deep boom for cannon
      this.scene.cameras.main.shake(80, 0.006)
      const cannonball = new TankProjectile(this.scene, x, y, this.facing, this.chargeLevel)
      this.scene.balls.push(cannonball)
    } else {
      const x = this.sprite.x + (this.facing * 45)
      const y = this.sprite.y - 12
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

    // Tank armor reduces damage by half
    const dmg = this.weapon === 'tank' ? Math.ceil(amount / 2) : amount
    this.hp -= dmg
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
    const g = this.graphics

    // Flicker when invincible
    if (this.invincible && Math.floor(time / 80) % 2 === 0) return

    if (this.weapon === 'tank') {
      this.drawTankMode(g, x, y, time)
    } else if (this.isDucking) {
      this.drawDucking(g, x, y)
    } else {
      this.drawStanding(g, x, y)
    }

    // Charge bar
    if (this.isCharging) {
      const barWidth = 68
      const barHeight = 6
      const barX = x - barWidth / 2
      const barY = this.weapon === 'tank' ? y - 55 : y - 68

      this.chargeBar.fillStyle(0x333333)
      this.chargeBar.fillRect(barX, barY, barWidth, barHeight)

      const fillColor = this.chargeLevel < 0.33 ? 0x00D4FF :
        this.chargeLevel < 0.67 ? 0x00D4FF : COLORS.GOLD
      this.chargeBar.fillStyle(fillColor)
      this.chargeBar.fillRect(barX, barY, barWidth * this.chargeLevel, barHeight)

      this.chargeBar.lineStyle(1, COLORS.WHITE)
      this.chargeBar.strokeRect(barX, barY, barWidth, barHeight)
    }
  }

  drawTankMode(g, x, y, time) {
    const dir = this.facing
    const rumble = this.sprite.body.velocity.x !== 0 ? Math.sin(time / 80) * 1.5 : 0

    // === TANK BODY ===

    // Treads
    g.fillStyle(0x333333)
    g.fillRect(x - 35, y + 25 + rumble, 70, 14)
    g.fillStyle(0x222222)
    const treadAnim = Math.floor(time / 100) % 6
    for (let t = 0; t < 8; t++) {
      g.fillRect(x - 33 + ((t * 9 + treadAnim) % 70), y + 27 + rumble, 6, 9)
    }
    g.fillStyle(0x444444)
    g.fillRect(x - 35, y + 25 + rumble, 70, 2)
    g.fillRect(x - 35, y + 37 + rumble, 70, 2)

    // Hull (76ers blue)
    g.fillStyle(0x003DA5)
    g.fillRect(x - 32, y + 2 + rumble, 64, 25)

    // Red stripe on hull
    g.fillStyle(COLORS.RED)
    g.fillRect(x - 32, y + 12 + rumble, 64, 3)

    // Hull darker bottom edge
    g.fillStyle(0x002277)
    g.fillRect(x - 32, y + 24 + rumble, 64, 2)

    // 76ers star on hull
    g.fillStyle(COLORS.GOLD)
    const starX = x + dir * 12
    g.fillRect(starX - 3, y + 6 + rumble, 6, 6)
    g.fillRect(starX - 2, y + 5 + rumble, 4, 1)
    g.fillRect(starX - 2, y + 12 + rumble, 4, 1)
    g.fillRect(starX - 5, y + 8 + rumble, 2, 3)
    g.fillRect(starX + 3, y + 8 + rumble, 2, 3)

    // TTP text on hull
    g.fillStyle(COLORS.WHITE)
    g.fillRect(x - dir * 12, y + 6 + rumble, 8, 2)
    g.fillRect(x - dir * 12 + 3, y + 8 + rumble, 2, 5)

    // === HINKIE IN HATCH (upper body only) ===

    // Turret hatch ring
    g.fillStyle(0x002277)
    g.fillRect(x - 14, y - 2 + rumble, 28, 6)
    g.fillStyle(0x003DA5)
    g.fillRect(x - 12, y - 1 + rumble, 24, 4)

    // Suit jacket (just shoulders visible)
    g.fillStyle(0x1a1a4a)
    g.fillRect(x - 18, y - 18 + rumble, 36, 18)

    // White collar
    g.fillStyle(0xF0F0F0)
    g.fillRect(x - 7, y - 18 + rumble, 14, 6)

    // Tie
    g.fillStyle(COLORS.RED)
    g.fillRect(x - 2, y - 18 + rumble, 4, 14)

    // Arms resting on hatch
    g.fillStyle(0x1a1a4a)
    g.fillRect(x - 22, y - 8 + rumble, 8, 10)
    g.fillRect(x + 14, y - 8 + rumble, 8, 10)
    // Hands
    g.fillStyle(0xE8B090)
    g.fillRect(x - 22, y + 1 + rumble, 8, 5)
    g.fillRect(x + 14, y + 1 + rumble, 8, 5)

    // Head
    g.fillStyle(0xE8B090)
    g.fillRect(x - 12, y - 42 + rumble, 26, 26)

    // Hair
    g.fillStyle(0x3D2517)
    g.fillRect(x - 14, y - 46 + rumble, 4, 16)
    g.fillRect(x + 11, y - 46 + rumble, 4, 16)
    g.fillRect(x - 11, y - 48 + rumble, 22, 4)
    g.fillRect(x - 6, y - 45 + rumble, 12, 3)

    // Glasses
    g.fillStyle(0x666666)
    g.fillRect(x - 9, y - 35 + rumble, 8, 7)
    g.fillRect(x + 2, y - 35 + rumble, 8, 7)
    g.fillStyle(0xFFFFFF)
    g.fillRect(x - 7, y - 33 + rumble, 4, 3)
    g.fillRect(x + 4, y - 33 + rumble, 4, 3)
    g.fillStyle(0x111111)
    g.fillRect(x - 6, y - 33 + rumble, 3, 3)
    g.fillRect(x + 5, y - 33 + rumble, 3, 3)

    // Mouth
    g.fillStyle(0x333333)
    g.fillRect(x - 4, y - 22 + rumble, 8, 2)

    // === CANNON BARREL ===
    g.fillStyle(0x444444)
    g.fillRect(x + dir * 14, y - 10 + rumble, dir * 30, 7)
    g.fillStyle(0x555555)
    g.fillRect(x + dir * 42, y - 11 + rumble, dir * 6, 9)

    // Muzzle flash when recently fired
    if (this.scene.time.now - this.tankCooldown + this.TANK_COOLDOWN_TIME < 150) {
      g.fillStyle(COLORS.GOLD, 0.7)
      g.fillCircle(x + dir * 50, y - 7 + rumble, 6)
      g.fillStyle(COLORS.WHITE, 0.5)
      g.fillCircle(x + dir * 50, y - 7 + rumble, 3)
    }
  }

  drawDucking(g, x, y) {
    // Legs (bent, shorter)
    g.fillStyle(0x1a1a3a)
    g.fillRect(x - 18, y + 23, 14, 14)
    g.fillRect(x + 5, y + 23, 14, 14)

    // Shoes
    g.fillStyle(0x3B2314)
    g.fillRect(x - 21, y + 35, 18, 8)
    g.fillRect(x + 3, y + 35, 18, 8)

    // Body
    g.fillStyle(0x1a1a4a)
    g.fillRect(x - 21, y - 5, 41, 32)

    // Collar
    g.fillStyle(0xF0F0F0)
    g.fillRect(x - 9, y - 5, 18, 8)

    // Tie
    g.fillStyle(COLORS.RED)
    g.fillRect(x - 3, y - 5, 5, 23)

    // Arms
    g.fillStyle(0x1a1a4a)
    g.fillRect(x - 30, y, 12, 18)
    g.fillRect(x + 18, y, 12, 18)
    g.fillStyle(0xE8B090)
    g.fillRect(x - 30, y + 17, 12, 8)
    g.fillRect(x + 18, y + 17, 12, 8)

    // Head
    g.fillStyle(0xE8B090)
    g.fillRect(x - 15, y - 32, 32, 30)

    // Hair
    g.fillStyle(0x3D2517)
    g.fillRect(x - 18, y - 36, 5, 18)
    g.fillRect(x + 14, y - 36, 5, 18)
    g.fillRect(x - 14, y - 39, 27, 5)
    g.fillRect(x - 8, y - 35, 14, 3)

    // Glasses
    g.fillStyle(0x666666)
    g.fillRect(x - 12, y - 23, 9, 8)
    g.fillRect(x + 3, y - 23, 9, 8)
    g.fillStyle(0xFFFFFF)
    g.fillRect(x - 9, y - 21, 5, 3)
    g.fillRect(x + 5, y - 21, 5, 3)
    g.fillStyle(0x111111)
    g.fillRect(x - 8, y - 21, 3, 3)
    g.fillRect(x + 6, y - 21, 3, 3)

    // Mouth
    g.fillStyle(0x333333)
    g.fillRect(x - 5, y - 9, 9, 3)
  }

  drawStanding(g, x, y) {
    const legOffset = this.walkFrame % 2 === 0 ? 5 : -5

    // Legs
    g.fillStyle(0x1a1a3a)
    g.fillRect(x - 15, y + 14, 12, 32 + legOffset)
    g.fillRect(x + 5, y + 14, 12, 32 - legOffset)

    // Shoes
    g.fillStyle(0x3B2314)
    g.fillRect(x - 18, y + 41 + legOffset, 15, 8)
    g.fillRect(x + 3, y + 41 - legOffset, 15, 8)

    // Body
    g.fillStyle(0x1a1a4a)
    g.fillRect(x - 21, y - 23, 41, 41)

    // Collar
    g.fillStyle(0xF0F0F0)
    g.fillRect(x - 9, y - 23, 18, 8)

    // Tie
    g.fillStyle(COLORS.RED)
    g.fillRect(x - 3, y - 23, 5, 32)

    // Arms
    const armSwing = this.walkFrame < 2 ? 8 : -8
    g.fillStyle(0x1a1a4a)
    g.fillRect(x - 30, y - 18 + armSwing, 12, 27)
    g.fillRect(x + 18, y - 18 - armSwing, 12, 27)
    g.fillStyle(0xE8B090)
    g.fillRect(x - 30, y + 8 + armSwing, 12, 8)
    g.fillRect(x + 18, y + 8 - armSwing, 12, 8)

    // Head
    g.fillStyle(0xE8B090)
    g.fillRect(x - 15, y - 50, 32, 30)

    // Hair
    g.fillStyle(0x3D2517)
    g.fillRect(x - 18, y - 54, 5, 18)
    g.fillRect(x + 14, y - 54, 5, 18)
    g.fillRect(x - 14, y - 57, 27, 5)
    g.fillRect(x - 8, y - 53, 14, 3)

    // Glasses
    g.fillStyle(0x666666)
    g.fillRect(x - 12, y - 41, 9, 8)
    g.fillRect(x + 3, y - 41, 9, 8)
    g.fillStyle(0xFFFFFF)
    g.fillRect(x - 9, y - 38, 5, 3)
    g.fillRect(x + 5, y - 38, 5, 3)
    g.fillStyle(0x111111)
    g.fillRect(x - 8, y - 38, 3, 3)
    g.fillRect(x + 6, y - 38, 3, 3)

    // Mouth
    g.fillStyle(0x333333)
    g.fillRect(x - 5, y - 27, 9, 3)
  }

  destroy() {
    this.graphics.destroy()
    this.chargeBar.destroy()
    this.sprite.destroy()
  }
}
