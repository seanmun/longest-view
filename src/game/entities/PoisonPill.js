import Phaser from 'phaser'
import { AudioSystem } from '../systems/AudioSystem.js'
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../constants.js'

const BASE_SPEED = 250
const GRAVITY = 350
const DAMAGE_BY_CHARGE = [15, 30, 50]
const DAMAGE_MULTIPLIER_FULL = 2
const BLAST_RADIUS_BY_CHARGE = [50, 75, 120]

export class PoisonPill {
  constructor(scene, x, y, direction, chargeLevel) {
    this.scene = scene
    this.chargeLevel = chargeLevel
    this.alive = true
    this.exploded = false
    this.direction = direction

    // Determine charge tier
    if (chargeLevel >= 0.67) {
      this.tier = 2
    } else if (chargeLevel >= 0.34) {
      this.tier = 1
    } else {
      this.tier = 0
    }

    this.damage = DAMAGE_BY_CHARGE[this.tier]
    if (this.tier === 2) this.damage *= DAMAGE_MULTIPLIER_FULL
    this.blastRadius = BLAST_RADIUS_BY_CHARGE[this.tier]

    // Size based on charge
    this.width = this.tier === 2 ? 18 : this.tier === 1 ? 14 : 10
    this.height = this.tier === 2 ? 12 : this.tier === 1 ? 10 : 8

    // Create physics body
    this.sprite = scene.physics.add.sprite(x, y, null)
    this.sprite.setSize(this.width, this.height)
    this.sprite.setVisible(false)
    this.sprite.setDepth(9)
    this.sprite.body.setAllowGravity(true)
    this.sprite.body.gravity.y = GRAVITY

    // Set velocity — shorter arc, faster drop
    const speed = BASE_SPEED + (chargeLevel * 100)
    this.sprite.setVelocity(
      direction * speed,
      -200 - (chargeLevel * 80)
    )

    this.sprite.body.setBounce(0)
    this.sprite.body.setCollideWorldBounds(false)

    // Collide with ground so pills explode on contact
    if (scene.ground) {
      scene.physics.add.collider(this.sprite, scene.ground)
    }

    // Graphics
    this.graphics = scene.add.graphics()
    this.graphics.setDepth(9)

    // Explosion graphics (separate so it persists briefly)
    this.explosionGraphics = scene.add.graphics()
    this.explosionGraphics.setDepth(15)

    // Rotation
    this.rotation = 0

    if (this.tier === 2) {
      AudioSystem.playMaxProcess()
    }
  }

  update() {
    if (!this.alive) return

    if (this.exploded) {
      // Explosion is handled, just clean up
      return
    }

    if (!this.sprite.active) {
      this.destroy()
      return
    }

    // Rotate while flying
    this.rotation += 0.15 * this.direction

    // Check ground/wall hit — explode on contact
    if (this.sprite.body.blocked.down || this.sprite.body.blocked.left || this.sprite.body.blocked.right) {
      this.explode()
      return
    }

    // Check direct enemy hit — also explodes
    if (this.checkEnemyContact()) {
      this.explode()
      return
    }

    // Off screen check
    const x = this.sprite.x
    const y = this.sprite.y
    if (y > GAME_HEIGHT + 50 || x < this.scene.cameras.main.scrollX - 50 ||
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

    // Danger glow
    const glowColor = this.tier === 2 ? COLORS.GOLD : this.tier === 1 ? COLORS.RED : 0xFF6644
    this.graphics.fillStyle(glowColor, 0.2)
    this.graphics.fillCircle(x, y, this.width + 3)

    // Contract roll body (parchment)
    const cos = Math.cos(this.rotation)
    const sin = Math.sin(this.rotation)

    // Simplified rotated rectangle using a stretched shape
    this.graphics.fillStyle(0xF5E6C8)
    this.graphics.fillRect(x - this.width / 2, y - this.height / 2, this.width, this.height)

    // Text lines on contract
    this.graphics.fillStyle(0x333333, 0.6)
    this.graphics.fillRect(x - this.width / 2 + 2, y - 2, this.width - 4, 1)
    this.graphics.fillRect(x - this.width / 2 + 2, y, this.width - 6, 1)
    this.graphics.fillRect(x - this.width / 2 + 2, y + 2, this.width - 5, 1)

    // Poison mark (red X)
    this.graphics.lineStyle(2, COLORS.RED)
    this.graphics.lineBetween(x - 3, y - 3, x + 3, y + 3)
    this.graphics.lineBetween(x + 3, y - 3, x - 3, y + 3)

    // Smoke trail
    if (this.tier >= 1) {
      this.graphics.fillStyle(0xFF4400, 0.15)
      this.graphics.fillCircle(x - this.direction * 8, y + 4, 5)
      this.graphics.fillCircle(x - this.direction * 14, y + 6, 4)
    }
  }

  explode() {
    if (this.exploded) return
    this.exploded = true

    const x = this.sprite.x
    const y = this.sprite.y

    // Play explosion sound
    AudioSystem.playBossHit()

    // Screen shake for tier 2
    if (this.tier >= 1) {
      this.scene.cameras.main.shake(200, this.tier === 2 ? 0.015 : 0.008)
    }

    // AOE damage — check all enemies in blast radius
    this.dealAOEDamage(x, y)

    // Visual explosion
    this.showExplosion(x, y)

    // Clean up the projectile sprite
    this.graphics.clear()
    this.graphics.destroy()
    if (this.sprite.active) this.sprite.destroy()
  }

  dealAOEDamage(x, y) {
    // Damage enemies in blast radius
    if (this.scene.enemies) {
      this.scene.enemies.forEach(enemy => {
        if (!enemy.alive) return
        const dist = Phaser.Math.Distance.Between(x, y, enemy.sprite.x, enemy.sprite.y)
        if (dist < this.blastRadius) {
          // Damage falls off with distance
          const falloff = 1 - (dist / this.blastRadius) * 0.5
          const dmg = Math.floor(this.damage * falloff)
          const result = enemy.takeDamage(dmg, this)
          if (result && result.defeated && this.scene.enemiesDefeated !== undefined) {
            this.scene.enemiesDefeated++
          }
        }
      })
    }

    // Damage boss in blast radius
    if (this.scene.boss && this.scene.boss.alive) {
      const dist = Phaser.Math.Distance.Between(x, y, this.scene.boss.sprite.x, this.scene.boss.sprite.y)
      if (dist < this.blastRadius) {
        const falloff = 1 - (dist / this.blastRadius) * 0.5
        const dmg = Math.floor(this.damage * falloff)
        const result = this.scene.boss.takeDamage(dmg, this)
        if (result && result.defeated && this.scene.enemiesDefeated !== undefined) {
          this.scene.enemiesDefeated++
        }
      }
    }
  }

  showExplosion(x, y) {
    const g = this.explosionGraphics
    const radius = this.blastRadius
    const duration = 500
    const startTime = this.scene.time.now

    // Explosion particles
    const particles = []
    const numParticles = this.tier === 2 ? 16 : this.tier === 1 ? 12 : 8
    for (let i = 0; i < numParticles; i++) {
      const angle = (Math.PI * 2 * i) / numParticles
      const speed = 80 + Math.random() * 60
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 50,
        size: 3 + Math.random() * 4,
        color: Math.random() > 0.5 ? 0xFF4400 : COLORS.GOLD
      })
    }

    // Paper shred particles
    const papers = []
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2
      papers.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * (40 + Math.random() * 40),
        vy: -80 - Math.random() * 60,
        rotation: Math.random() * Math.PI,
        size: 4 + Math.random() * 4
      })
    }

    const explosionTimer = this.scene.time.addEvent({
      delay: 16,
      callback: () => {
        const elapsed = this.scene.time.now - startTime
        const progress = elapsed / duration

        if (progress >= 1) {
          explosionTimer.remove()
          g.clear()
          g.destroy()
          this.alive = false
          return
        }

        g.clear()

        // Expanding ring
        const ringRadius = radius * progress
        const ringAlpha = 1 - progress
        g.lineStyle(3 - progress * 2, COLORS.RED, ringAlpha * 0.6)
        g.strokeCircle(x, y, ringRadius)

        // Inner flash
        if (progress < 0.3) {
          g.fillStyle(COLORS.GOLD, (0.3 - progress) * 2)
          g.fillCircle(x, y, radius * 0.3 * (1 - progress))
        }

        // Fire particles
        particles.forEach(p => {
          p.x += p.vx * 0.016
          p.y += p.vy * 0.016
          p.vy += 100 * 0.016 // gravity on particles
          p.size *= 0.97

          if (p.size > 0.5) {
            g.fillStyle(p.color, ringAlpha)
            g.fillCircle(p.x, p.y, p.size)
          }
        })

        // Paper shreds
        papers.forEach(p => {
          p.x += p.vx * 0.016
          p.y += p.vy * 0.016
          p.vy += 150 * 0.016
          p.rotation += 0.1

          if (ringAlpha > 0.2) {
            g.fillStyle(0xF5E6C8, ringAlpha)
            g.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size * 0.6)
          }
        })
      },
      loop: true
    })
  }

  checkEnemyContact() {
    const x = this.sprite.x
    const y = this.sprite.y

    // Check regular enemies
    if (this.scene.enemies) {
      for (const enemy of this.scene.enemies) {
        if (!enemy.alive) continue
        const dist = Phaser.Math.Distance.Between(x, y, enemy.sprite.x, enemy.sprite.y)
        if (dist < 35) return true
      }
    }

    // Check boss
    if (this.scene.boss && this.scene.boss.alive) {
      const dist = Phaser.Math.Distance.Between(x, y, this.scene.boss.sprite.x, this.scene.boss.sprite.y)
      if (dist < 40) return true
    }

    return false
  }

  // Compatibility methods for collision detection in Level1Scene
  isRicochet() {
    return false // Poison pills don't ricochet
  }

  getRicochetBounces() {
    return 0
  }

  destroy() {
    this.alive = false
    this.graphics.clear()
    this.graphics.destroy()
    if (!this.exploded) {
      this.explosionGraphics.destroy()
    }
    if (this.sprite.active) this.sprite.destroy()
  }
}
