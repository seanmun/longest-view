import { AudioSystem } from '../systems/AudioSystem.js'
import { COLORS, GAME_WIDTH, GAME_HEIGHT, fontSize } from '../constants.js'

const EMBIID_WIDTH = 75
const EMBIID_HEIGHT = 165
const MOVE_SPEED = 120
const SLAM_RANGE = 75
const SLAM_COOLDOWN = 800
const ALLY_DURATION = 30000 // 30 seconds

export class EmbiidAlly {
  constructor(scene, x, y) {
    this.scene = scene
    this.alive = true
    this.walkFrame = 0
    this.walkTimer = 0
    this.facing = 1
    this.slamCooldown = 0
    this.spawnTime = scene.time.now

    // Create physics body (Embiid is big)
    this.sprite = scene.physics.add.sprite(x, y, null)
    this.sprite.setSize(EMBIID_WIDTH, EMBIID_HEIGHT)
    this.sprite.setCollideWorldBounds(true)
    this.sprite.setVisible(false)
    this.sprite.setDepth(7) // Behind player slightly
    this.sprite.body.setMaxVelocityY(600)

    // Graphics
    this.graphics = scene.add.graphics()
    this.graphics.setDepth(7)

    // Entrance effect
    scene.cameras.main.shake(500, 0.02)
    AudioSystem.playMaxProcess()

    const entryText = scene.add.text(x, y - 120, 'EMBIID!', {
      fontFamily: '"Press Start 2P"',
      fontSize: fontSize(14),
      color: '#003DA5'
    })
    entryText.setOrigin(0.5).setDepth(100)
    scene.tweens.add({
      targets: entryText,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 1500,
      onComplete: () => entryText.destroy()
    })
  }

  update(time, enemies) {
    if (!this.alive || !this.sprite.active) return

    // Check duration — leave after 30 seconds
    const elapsed = time - this.spawnTime
    if (elapsed >= ALLY_DURATION) {
      this.leave()
      return
    }

    // Find nearest enemy
    let nearestEnemy = null
    let nearestDist = Infinity
    for (const enemy of enemies) {
      if (!enemy.alive || !enemy.sprite.active) continue
      const dist = Math.abs(enemy.sprite.x - this.sprite.x)
      if (dist < nearestDist) {
        nearestDist = dist
        nearestEnemy = enemy
      }
    }

    // Move toward nearest enemy
    if (nearestEnemy) {
      const dx = nearestEnemy.sprite.x - this.sprite.x
      if (Math.abs(dx) > SLAM_RANGE) {
        this.sprite.setVelocityX(dx > 0 ? MOVE_SPEED : -MOVE_SPEED)
        this.facing = dx > 0 ? 1 : -1
      } else {
        this.sprite.setVelocityX(0)
        // Body slam!
        if (time > this.slamCooldown) {
          this.bodySlam(nearestEnemy, time)
        }
      }
    } else {
      // No enemies — idle
      this.sprite.setVelocityX(0)
    }

    // Walk animation
    this.walkTimer += 16
    if (this.walkTimer > 180) {
      this.walkFrame = (this.walkFrame + 1) % 4
      this.walkTimer = 0
    }

    this.draw(time)
  }

  bodySlam(enemy, time) {
    this.slamCooldown = time + SLAM_COOLDOWN

    // Camera shake
    this.scene.cameras.main.shake(200, 0.015)
    AudioSystem.playBossHit()

    // Damage — one-hit KO on fan grunts, 10 damage on others
    const isGrunt = enemy.constructor.name === 'FanEnemy'
    if (isGrunt) {
      enemy.defeat(null)
    } else {
      enemy.takeDamage(10, null)
    }

    // Visual slam effect
    const slamX = enemy.sprite.x
    const slamY = enemy.sprite.y
    const slamText = this.scene.add.text(slamX, slamY - 45, 'SLAM!', {
      fontFamily: '"Press Start 2P"',
      fontSize: fontSize(10),
      color: '#003DA5'
    })
    slamText.setOrigin(0.5).setDepth(100)
    this.scene.tweens.add({
      targets: slamText,
      y: slamY - 90,
      alpha: 0,
      duration: 800,
      onComplete: () => slamText.destroy()
    })

    // Impact particles
    for (let i = 0; i < 6; i++) {
      const p = this.scene.add.circle(
        slamX + (Math.random() - 0.5) * 45,
        slamY + (Math.random() - 0.5) * 30,
        6, 0x003DA5
      )
      p.setDepth(50)
      this.scene.tweens.add({
        targets: p,
        x: p.x + (Math.random() - 0.5) * 90,
        y: p.y - 30 - Math.random() * 45,
        alpha: 0,
        duration: 500,
        onComplete: () => p.destroy()
      })
    }
  }

  // Block projectile (snowball/megaphone hits Embiid and shatters)
  blockProjectile(projectile) {
    if (projectile.shatter) {
      projectile.shatter()
    } else {
      projectile.destroy()
    }
    AudioSystem.playBounce()
  }

  leave() {
    this.alive = false

    // Show exit speech
    const exitText = this.scene.add.text(
      this.sprite.x, this.sprite.y - 105,
      'MEDIA OBLIGATIONS!', {
        fontFamily: '"Press Start 2P"',
        fontSize: fontSize(7),
        color: '#003DA5',
        backgroundColor: '#000000',
        padding: { x: 4, y: 3 }
      }
    )
    exitText.setOrigin(0.5).setDepth(100)

    this.scene.tweens.add({
      targets: exitText,
      y: this.sprite.y - 150,
      alpha: 0,
      duration: 2000,
      onComplete: () => exitText.destroy()
    })

    // Run off to the right
    this.sprite.setVelocityX(250)
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      duration: 2000,
      onComplete: () => this.destroy()
    })

    // Fade graphics too
    this.scene.time.delayedCall(2000, () => {
      this.destroy()
    })
  }

  draw(time) {
    this.graphics.clear()
    const x = this.sprite.x
    const y = this.sprite.y

    const legOffset = this.walkFrame % 2 === 0 ? 5 : -5
    const armSwing = this.walkFrame < 2 ? 6 : -6

    // Shorts (76ers blue)
    this.graphics.fillStyle(0x003DA5)
    this.graphics.fillRect(x - 15, y + 12, 12, 18)
    this.graphics.fillRect(x + 3, y + 12, 12, 18)

    // Shorts waistband
    this.graphics.fillStyle(0xFFFFFF)
    this.graphics.fillRect(x - 15, y + 12, 12, 3)
    this.graphics.fillRect(x + 3, y + 12, 12, 3)

    // Bare legs
    this.graphics.fillStyle(0x6B4226)
    this.graphics.fillRect(x - 14, y + 30, 11, 24 + legOffset)
    this.graphics.fillRect(x + 5, y + 30, 11, 24 - legOffset)

    // Knee detail
    this.graphics.fillStyle(0x5A3620)
    this.graphics.fillRect(x - 11, y + 39, 5, 3)
    this.graphics.fillRect(x + 8, y + 39, 5, 3)

    // Shoes
    this.graphics.fillStyle(0xFFFFFF)
    this.graphics.fillRect(x - 17, y + 51 + legOffset, 15, 8)
    this.graphics.fillRect(x + 3, y + 51 - legOffset, 15, 8)
    // Sole
    this.graphics.fillStyle(0x222222)
    this.graphics.fillRect(x - 17, y + 57 + legOffset, 15, 3)
    this.graphics.fillRect(x + 3, y + 57 - legOffset, 15, 3)
    // Swoosh
    this.graphics.fillStyle(0x003DA5)
    this.graphics.fillRect(x - 14, y + 54 + legOffset, 8, 2)
    this.graphics.fillRect(x + 6, y + 54 - legOffset, 8, 2)

    // Body (76ers jersey)
    this.graphics.fillStyle(0x003DA5)
    this.graphics.fillRect(x - 18, y - 30, 36, 45)

    // Side panels (red trim)
    this.graphics.fillStyle(0xCC2200)
    this.graphics.fillRect(x - 18, y - 30, 3, 42)
    this.graphics.fillRect(x + 15, y - 30, 3, 42)

    // Number 21
    this.graphics.fillStyle(0xFFFFFF)
    // "2"
    this.graphics.fillRect(x - 11, y - 18, 8, 2)
    this.graphics.fillRect(x - 5, y - 17, 2, 5)
    this.graphics.fillRect(x - 11, y - 12, 8, 2)
    this.graphics.fillRect(x - 11, y - 11, 2, 5)
    this.graphics.fillRect(x - 11, y - 6, 8, 2)
    // "1"
    this.graphics.fillRect(x + 5, y - 18, 3, 14)
    this.graphics.fillRect(x + 3, y - 17, 2, 2)

    // Collar
    this.graphics.fillStyle(0xFFFFFF)
    this.graphics.fillRect(x - 8, y - 32, 15, 3)

    // Arms
    this.graphics.fillStyle(0x6B4226)
    this.graphics.fillRect(x - 26, y - 27 + armSwing, 9, 30)
    this.graphics.fillRect(x + 17, y - 27 - armSwing, 9, 30)

    // Bicep detail
    this.graphics.fillStyle(0x5A3620)
    this.graphics.fillRect(x - 24, y - 21 + armSwing, 2, 6)
    this.graphics.fillRect(x + 24, y - 21 - armSwing, 2, 6)

    // Hands
    this.graphics.fillStyle(0x6B4226)
    this.graphics.fillRect(x - 26, y + 2 + armSwing, 9, 8)
    this.graphics.fillRect(x + 17, y + 2 - armSwing, 9, 8)

    // Wristbands
    this.graphics.fillStyle(0xFFFFFF)
    this.graphics.fillRect(x - 26, y - 2 + armSwing, 9, 3)
    this.graphics.fillRect(x + 17, y - 2 - armSwing, 9, 3)

    // Neck
    this.graphics.fillStyle(0x6B4226)
    this.graphics.fillRect(x - 6, y - 42, 12, 12)

    // Head
    this.graphics.fillStyle(0x6B4226)
    this.graphics.fillRect(x - 15, y - 69, 30, 29)

    // Hair (flat top)
    this.graphics.fillStyle(0x1A1A1A)
    this.graphics.fillRect(x - 15, y - 74, 30, 6)
    this.graphics.fillRect(x - 12, y - 75, 24, 2)
    this.graphics.fillRect(x - 17, y - 69, 2, 15)
    this.graphics.fillRect(x + 15, y - 69, 2, 15)

    // Beard
    this.graphics.fillStyle(0x1A1A1A)
    this.graphics.fillRect(x - 14, y - 54, 27, 15)
    this.graphics.fillRect(x - 11, y - 39, 21, 3)
    this.graphics.fillRect(x - 8, y - 36, 15, 2)
    this.graphics.fillRect(x - 15, y - 57, 3, 9)
    this.graphics.fillRect(x + 12, y - 57, 3, 9)
    this.graphics.fillRect(x - 14, y - 60, 2, 6)
    this.graphics.fillRect(x + 12, y - 60, 2, 6)

    // Beard texture
    this.graphics.fillStyle(0x2A2A2A)
    this.graphics.fillRect(x - 9, y - 51, 2, 2)
    this.graphics.fillRect(x + 5, y - 50, 2, 2)
    this.graphics.fillRect(x - 5, y - 47, 2, 2)
    this.graphics.fillRect(x + 8, y - 45, 2, 2)

    // Eyes
    this.graphics.fillStyle(0xFFFFFF)
    this.graphics.fillRect(x - 11, y - 63, 8, 5)
    this.graphics.fillRect(x + 3, y - 63, 8, 5)
    // Iris
    this.graphics.fillStyle(0x3D2517)
    this.graphics.fillRect(x - 8, y - 63, 5, 5)
    this.graphics.fillRect(x + 5, y - 63, 5, 5)
    // Pupil
    this.graphics.fillStyle(0x111111)
    this.graphics.fillRect(x - 6, y - 62, 2, 2)
    this.graphics.fillRect(x + 6, y - 62, 2, 2)

    // Eyebrows
    this.graphics.fillStyle(0x1A1A1A)
    this.graphics.fillRect(x - 11, y - 66, 8, 2)
    this.graphics.fillRect(x + 3, y - 66, 8, 2)

    // Nose
    this.graphics.fillStyle(0x5A3620)
    this.graphics.fillRect(x - 3, y - 59, 6, 5)
    this.graphics.fillRect(x - 5, y - 56, 9, 2)

    // Mouth (grin)
    this.graphics.fillStyle(0xFFFFFF)
    this.graphics.fillRect(x - 6, y - 53, 12, 3)
    this.graphics.fillStyle(0x4A2A16)
    this.graphics.fillRect(x - 8, y - 53, 2, 2)
    this.graphics.fillRect(x + 6, y - 53, 2, 2)

    // Ears
    this.graphics.fillStyle(0x5A3620)
    this.graphics.fillRect(x - 17, y - 63, 3, 6)
    this.graphics.fillRect(x + 14, y - 63, 3, 6)

    // Duration indicator — blue aura fading as time runs out
    const remaining = Math.max(0, ALLY_DURATION - (this.scene.time.now - this.spawnTime))
    const pct = remaining / ALLY_DURATION
    if (pct < 0.3) {
      // Flashing when almost leaving
      const flash = Math.sin(this.scene.time.now * 0.01) > 0
      if (flash) {
        this.graphics.fillStyle(0x003DA5, 0.15)
        this.graphics.fillCircle(x, y, 83)
      }
    }
  }

  destroy() {
    this.alive = false
    this.graphics.destroy()
    if (this.sprite && this.sprite.active) this.sprite.destroy()
  }
}
