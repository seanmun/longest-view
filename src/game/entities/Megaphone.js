import { AudioSystem } from '../systems/AudioSystem.js'
import { COLORS, GAME_WIDTH } from '../constants.js'

const MEGAPHONE_SPEED = 150
const MEGAPHONE_DAMAGE = 20

export class Megaphone {
  constructor(scene, x, y, direction) {
    this.scene = scene
    this.alive = true
    this.direction = direction
    this.damage = MEGAPHONE_DAMAGE

    // Create physics body
    this.sprite = scene.physics.add.sprite(x, y, null)
    this.sprite.setCircle(8)
    this.sprite.setVisible(false)
    this.sprite.setDepth(9)
    this.sprite.body.setAllowGravity(false)
    this.sprite.setVelocity(direction * MEGAPHONE_SPEED, 0)

    // Graphics
    this.graphics = scene.add.graphics()
    this.graphics.setDepth(9)
  }

  update() {
    if (!this.alive || !this.sprite.active) return

    const x = this.sprite.x

    // Off screen check
    if (x < this.scene.cameras.main.scrollX - 50 ||
      x > this.scene.cameras.main.scrollX + GAME_WIDTH + 50) {
      this.destroy()
      return
    }

    this.draw()
  }

  draw() {
    this.graphics.clear()
    const x = this.sprite.x
    const y = this.sprite.y
    const dir = this.direction

    // Handle (dark grey)
    this.graphics.fillStyle(0x333333)
    this.graphics.fillRect(x - dir * 12, y - 2, 6, 4)

    // Body cone (red) — widens in direction of travel
    this.graphics.fillStyle(0xCC2200)
    this.graphics.fillRect(x - dir * 6, y - 3, 5, 6)
    this.graphics.fillRect(x - dir * 1, y - 5, 5, 10)
    this.graphics.fillRect(x + dir * 4, y - 7, 4, 14)

    // Bell opening
    this.graphics.fillStyle(0x111111)
    this.graphics.fillRect(x + dir * 8, y - 7, 2, 14)

    // Gold stripe
    this.graphics.fillStyle(0xE8B800)
    this.graphics.fillRect(x - dir * 6, y, 16, 1)

    // Sound waves (gold, fading)
    this.graphics.fillStyle(0xE8B800, 0.7)
    this.graphics.fillRect(x + dir * 12, y - 4, 2, 8)
    this.graphics.fillStyle(0xE8B800, 0.4)
    this.graphics.fillRect(x + dir * 16, y - 6, 2, 12)
  }

  shatter() {
    if (!this.alive) return
    const x = this.sprite.x
    const y = this.sprite.y

    AudioSystem.playBounce()

    for (let i = 0; i < 6; i++) {
      const particle = this.scene.add.circle(
        x + (Math.random() - 0.5) * 14,
        y + (Math.random() - 0.5) * 14,
        2, 0xCC2200
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
