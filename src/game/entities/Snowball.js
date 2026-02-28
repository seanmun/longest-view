import { AudioSystem } from '../systems/AudioSystem.js'
import { COLORS, GAME_HEIGHT } from '../constants.js'

const SNOWBALL_SPEED = 200
const SNOWBALL_DAMAGE = 15

export class Snowball {
  constructor(scene, x, y, direction) {
    this.scene = scene
    this.alive = true
    this.direction = direction
    this.damage = SNOWBALL_DAMAGE

    // Create physics body — no gravity, straight line
    this.sprite = scene.physics.add.sprite(x, y, null)
    this.sprite.setCircle(4)
    this.sprite.setDepth(9)
    this.sprite.body.setAllowGravity(false)
    this.sprite.setVelocity(direction * SNOWBALL_SPEED, 0)

    // Graphics
    this.graphics = scene.add.graphics()
    this.graphics.setDepth(9)
  }

  update() {
    if (!this.alive || !this.sprite.active) return

    const x = this.sprite.x
    const y = this.sprite.y

    // Off screen check
    if (x < this.scene.cameras.main.scrollX - 50 ||
      x > this.scene.cameras.main.scrollX + 950) {
      this.destroy()
      return
    }

    this.draw()
  }

  draw() {
    this.graphics.clear()
    const x = this.sprite.x
    const y = this.sprite.y

    // Snowball body (white)
    this.graphics.fillStyle(COLORS.WHITE)
    this.graphics.fillCircle(x, y, 4)

    // Snow texture specks
    this.graphics.fillStyle(0xDDEEFF, 0.6)
    this.graphics.fillCircle(x - 1, y - 1, 1)
    this.graphics.fillCircle(x + 2, y + 1, 1)
  }

  // Shatter into white particles
  shatter() {
    if (!this.alive) return
    const x = this.sprite.x
    const y = this.sprite.y

    AudioSystem.playBounce()

    for (let i = 0; i < 6; i++) {
      const particle = this.scene.add.circle(
        x + (Math.random() - 0.5) * 10,
        y + (Math.random() - 0.5) * 10,
        2, COLORS.WHITE
      )
      particle.setDepth(50)
      this.scene.tweens.add({
        targets: particle,
        x: particle.x + (Math.random() - 0.5) * 40,
        y: particle.y + 10 + Math.random() * 20,
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
