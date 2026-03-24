import { AudioSystem } from '../systems/AudioSystem.js'
import { COLORS, GAME_WIDTH } from '../constants.js'

const COLLAR_SPEED = 180
const COLLAR_DAMAGE = 15
const BOOMERANG_DISTANCE = 250

export class CollarBoomerang {
  constructor(scene, x, y, direction) {
    this.scene = scene
    this.alive = true
    this.direction = direction
    this.damage = COLLAR_DAMAGE
    this.startX = x
    this.returning = false
    this.spinAngle = 0

    // Create physics body
    this.sprite = scene.physics.add.sprite(x, y, null)
    this.sprite.setCircle(8)
    this.sprite.setVisible(false)
    this.sprite.setDepth(9)
    this.sprite.body.setAllowGravity(false)
    this.sprite.setVelocity(direction * COLLAR_SPEED, 0)

    // Graphics
    this.graphics = scene.add.graphics()
    this.graphics.setDepth(9)
  }

  update() {
    if (!this.alive || !this.sprite.active) return

    const x = this.sprite.x

    // Boomerang: reverse after traveling BOOMERANG_DISTANCE
    if (!this.returning && Math.abs(x - this.startX) >= BOOMERANG_DISTANCE) {
      this.returning = true
      this.sprite.setVelocityX(-this.direction * COLLAR_SPEED * 0.7)
    }

    // Off screen check
    if (x < this.scene.cameras.main.scrollX - 100 ||
      x > this.scene.cameras.main.scrollX + GAME_WIDTH + 100) {
      this.destroy()
      return
    }

    // Destroy if returned past start point
    if (this.returning && Math.abs(x - this.startX) < 20) {
      this.destroy()
      return
    }

    this.spinAngle += 0.3
    this.draw()
  }

  draw() {
    this.graphics.clear()
    const x = this.sprite.x
    const y = this.sprite.y

    // Spinning V-shaped collar
    const spin = Math.sin(this.spinAngle)
    const scaleX = Math.abs(spin) * 0.5 + 0.5 // oscillate between 0.5 and 1.0

    // Collar body (white V-shape)
    this.graphics.fillStyle(0xFFFFFF)
    // Left wing
    const lw = Math.round(5 * scaleX)
    this.graphics.fillRect(x - 8, y - 3, lw + 2, 6)
    this.graphics.fillRect(x - 9, y - 2, 2, 4)
    // Right wing
    this.graphics.fillRect(x + 3, y - 3, lw + 2, 6)
    this.graphics.fillRect(x + 7, y - 2, 2, 4)
    // Center
    this.graphics.fillRect(x - 3, y, 6, 3)

    // Shadow tips
    this.graphics.fillStyle(0xE8E0E0)
    this.graphics.fillRect(x - 9, y - 2, 2, 2)
    this.graphics.fillRect(x + 7, y - 2, 2, 2)

    // Spin trail
    if (this.returning) {
      this.graphics.fillStyle(0xFFFFFF, 0.3)
      this.graphics.fillCircle(x - this.direction * 8, y, 4)
    }
  }

  shatter() {
    if (!this.alive) return
    const x = this.sprite.x
    const y = this.sprite.y

    AudioSystem.playBounce()

    for (let i = 0; i < 8; i++) {
      const particle = this.scene.add.circle(
        x + (Math.random() - 0.5) * 16,
        y + (Math.random() - 0.5) * 12,
        2, 0xFFFFFF
      )
      particle.setDepth(50)
      this.scene.tweens.add({
        targets: particle,
        x: particle.x + (Math.random() - 0.5) * 50,
        y: particle.y + (Math.random() - 0.5) * 30,
        alpha: 0,
        scale: 0.3,
        duration: 400,
        onComplete: () => particle.destroy()
      })
    }

    this.destroy()
  }

  destroy() {
    this.alive = false
    this.graphics.destroy()
    if (this.sprite.active) this.sprite.destroy()
  }
}
