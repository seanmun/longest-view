import Phaser from 'phaser'
import { AudioSystem } from '../systems/AudioSystem.js'
import { COLORS, GAME_HEIGHT } from '../constants.js'

const BALL_BASE_SPEED = 300
const GRAVITY = 300
const MAX_BOUNCES_BY_CHARGE = [1, 2, 4] // low, mid, full
const DAMAGE_BY_CHARGE = [10, 20, 30]
const DAMAGE_MULTIPLIER_FULL = 3

export class Ball {
  constructor(scene, x, y, direction, chargeLevel) {
    this.scene = scene
    this.chargeLevel = chargeLevel
    this.bounceCount = 0
    this.hasHitGround = false
    this.alive = true
    this.direction = direction

    // Determine charge tier
    if (chargeLevel >= 0.67) {
      this.tier = 2
    } else if (chargeLevel >= 0.34) {
      this.tier = 1
    } else {
      this.tier = 0
    }

    this.maxBounces = MAX_BOUNCES_BY_CHARGE[this.tier]
    this.damage = DAMAGE_BY_CHARGE[this.tier]
    if (this.tier === 2) this.damage *= DAMAGE_MULTIPLIER_FULL

    // Size based on charge
    this.radius = this.tier === 2 ? 6 : this.tier === 1 ? 5 : 4

    // Create physics body
    this.sprite = scene.physics.add.sprite(x, y, null)
    this.sprite.setCircle(this.radius)
    this.sprite.setDepth(9)
    this.sprite.body.setAllowGravity(true)
    this.sprite.body.gravity.y = GRAVITY

    // Set velocity based on charge
    const speed = BALL_BASE_SPEED + (chargeLevel * 200)
    this.sprite.setVelocity(
      direction * speed,
      -150 - (chargeLevel * 100)
    )

    this.sprite.body.setBounce(0.7)
    this.sprite.body.setCollideWorldBounds(false)

    // Graphics
    this.graphics = scene.add.graphics()
    this.graphics.setDepth(9)

    // Trail particles
    this.trail = []

    // Full charge screen shake
    if (this.tier === 2) {
      AudioSystem.playMaxProcess()
    }
  }

  update() {
    if (!this.alive || !this.sprite.active) return

    const x = this.sprite.x
    const y = this.sprite.y

    // Check ground bounce
    if (this.sprite.body.blocked.down) {
      this.bounceCount++
      this.hasHitGround = true
      AudioSystem.playBounce()

      if (this.bounceCount > this.maxBounces) {
        this.destroy()
        return
      }
    }

    // Check wall bounce
    if (this.sprite.body.blocked.left || this.sprite.body.blocked.right) {
      this.bounceCount++
      this.hasHitGround = true
      AudioSystem.playRicochet()

      if (this.bounceCount > this.maxBounces) {
        this.destroy()
        return
      }
    }

    // Off screen check
    if (y > GAME_HEIGHT + 50 || x < this.scene.cameras.main.scrollX - 50 ||
      x > this.scene.cameras.main.scrollX + 950) {
      this.destroy()
      return
    }

    // Add trail point
    if (this.tier >= 1) {
      this.trail.push({ x, y, alpha: 1 })
      if (this.trail.length > 8) this.trail.shift()
    }

    this.draw()
  }

  draw() {
    this.graphics.clear()
    const x = this.sprite.x
    const y = this.sprite.y

    // Draw trail
    this.trail.forEach((point, i) => {
      point.alpha -= 0.12
      if (point.alpha > 0) {
        const trailColor = this.tier === 2 ? COLORS.GOLD : COLORS.WHITE
        this.graphics.fillStyle(trailColor, point.alpha * 0.5)
        this.graphics.fillCircle(point.x, point.y, this.radius * 0.6)
      }
    })

    // Glow for charged shots
    if (this.tier >= 1) {
      const glowColor = this.tier === 2 ? COLORS.GOLD : COLORS.CYAN
      this.graphics.fillStyle(glowColor, 0.3)
      this.graphics.fillCircle(x, y, this.radius + 3)
    }

    // Ball body
    this.graphics.fillStyle(COLORS.WHITE)
    this.graphics.fillCircle(x, y, this.radius)

    // Seam line (NBA feel)
    this.graphics.lineStyle(1, 0xCCCCCC)
    this.graphics.beginPath()
    this.graphics.arc(x, y, this.radius * 0.6, 0, Math.PI)
    this.graphics.strokePath()
  }

  isRicochet() {
    return this.hasHitGround && this.bounceCount >= 1
  }

  getRicochetBounces() {
    return this.bounceCount
  }

  destroy() {
    this.alive = false
    this.graphics.destroy()
    if (this.sprite.active) this.sprite.destroy()
  }
}
