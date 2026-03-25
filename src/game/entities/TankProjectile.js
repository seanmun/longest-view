import Phaser from 'phaser'
import { AudioSystem } from '../systems/AudioSystem.js'
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../constants.js'

const CANNONBALL_SPEED = 350
const GRAVITY = 250
const DAMAGE_BY_CHARGE = [30, 60, 120]
const BLAST_RADIUS_BY_CHARGE = [60, 90, 140]

export class TankProjectile {
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
    this.blastRadius = BLAST_RADIUS_BY_CHARGE[this.tier]

    // Cannonball size based on charge
    this.radius = this.tier === 2 ? 10 : this.tier === 1 ? 8 : 6

    // Create physics body
    this.sprite = scene.physics.add.sprite(x, y, null)
    this.sprite.setCircle(this.radius)
    this.sprite.setVisible(false)
    this.sprite.setDepth(9)
    this.sprite.body.setAllowGravity(true)
    this.sprite.body.gravity.y = GRAVITY

    // Cannonball arc — fast horizontal, slight upward launch
    const speed = CANNONBALL_SPEED + (chargeLevel * 150)
    this.sprite.setVelocity(
      direction * speed,
      -120 - (chargeLevel * 60)
    )

    this.sprite.body.setBounce(0)
    this.sprite.body.setCollideWorldBounds(false)

    // Collide with ground so cannonball explodes on impact
    if (scene.ground) {
      scene.physics.add.collider(this.sprite, scene.ground)
    }

    // Graphics
    this.graphics = scene.add.graphics()
    this.graphics.setDepth(9)

    // Explosion graphics (separate so it persists)
    this.explosionGraphics = scene.add.graphics()
    this.explosionGraphics.setDepth(15)

    // Trail
    this.trail = []

    // Rotation for spin effect
    this.rotation = 0

    if (this.tier === 2) {
      AudioSystem.playMaxProcess()
    }
  }

  update() {
    if (!this.alive) return

    if (this.exploded) return

    if (!this.sprite.active) {
      this.destroy()
      return
    }

    // Spin while flying
    this.rotation += 0.2 * this.direction

    // Explode on ground/wall contact
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

    // Trail
    if (this.tier >= 1) {
      this.trail.push({ x, y, alpha: 1 })
      if (this.trail.length > 10) this.trail.shift()
    }

    this.draw()
  }

  draw() {
    this.graphics.clear()
    const x = this.sprite.x
    const y = this.sprite.y
    const g = this.graphics

    // Draw trail
    this.trail.forEach((point) => {
      point.alpha -= 0.1
      if (point.alpha > 0) {
        g.fillStyle(0x555555, point.alpha * 0.4)
        g.fillCircle(point.x, point.y, this.radius * 0.5)
      }
    })

    // Glow for charged shots
    if (this.tier >= 1) {
      const glowColor = this.tier === 2 ? COLORS.GOLD : 0xFF6600
      g.fillStyle(glowColor, 0.25)
      g.fillCircle(x, y, this.radius + 5)
    }

    // Cannonball body — dark iron sphere
    g.fillStyle(0x2A2A2A)
    g.fillCircle(x, y, this.radius)

    // Highlight (gives it a 3D look)
    g.fillStyle(0x555555)
    g.fillCircle(x - this.radius * 0.3, y - this.radius * 0.3, this.radius * 0.4)

    // Hot glow on tier 2
    if (this.tier === 2) {
      g.fillStyle(0xFF4400, 0.3)
      g.fillCircle(x, y, this.radius * 0.7)
    }

    // Smoke wisp behind
    g.fillStyle(0x777777, 0.2)
    g.fillCircle(x - this.direction * (this.radius + 4), y + 2, 3)
  }

  explode() {
    if (this.exploded) return
    this.exploded = true

    const x = this.sprite.x
    const y = this.sprite.y

    AudioSystem.playBossHit()

    // Screen shake scales with tier
    if (this.tier >= 1) {
      this.scene.cameras.main.shake(250, this.tier === 2 ? 0.02 : 0.01)
    } else {
      this.scene.cameras.main.shake(150, 0.006)
    }

    // AOE damage
    this.dealAOEDamage(x, y)

    // Visual explosion
    this.showExplosion(x, y)

    // Clean up projectile
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
    const duration = 600
    const startTime = this.scene.time.now

    // Explosion debris particles
    const particles = []
    const numParticles = this.tier === 2 ? 20 : this.tier === 1 ? 14 : 10
    for (let i = 0; i < numParticles; i++) {
      const angle = (Math.PI * 2 * i) / numParticles
      const speed = 100 + Math.random() * 80
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        size: 3 + Math.random() * 5,
        color: Math.random() > 0.4 ? 0xFF6600 : (Math.random() > 0.5 ? COLORS.GOLD : 0xFF2200)
      })
    }

    // Debris chunks (dark metal shards)
    const chunks = []
    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2
      chunks.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * (50 + Math.random() * 50),
        vy: -100 - Math.random() * 80,
        size: 3 + Math.random() * 3
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

        // Expanding shockwave ring
        const ringRadius = radius * progress
        const ringAlpha = 1 - progress
        g.lineStyle(4 - progress * 3, 0xFF4400, ringAlpha * 0.5)
        g.strokeCircle(x, y, ringRadius)

        // Inner fireball
        if (progress < 0.4) {
          const fireAlpha = (0.4 - progress) * 2.5
          g.fillStyle(COLORS.GOLD, fireAlpha)
          g.fillCircle(x, y, radius * 0.35 * (1 - progress * 0.5))
          g.fillStyle(0xFF6600, fireAlpha * 0.7)
          g.fillCircle(x, y, radius * 0.2 * (1 - progress * 0.3))
        }

        // Smoke cloud
        if (progress > 0.2) {
          const smokeAlpha = Math.min(ringAlpha * 0.3, 0.15)
          g.fillStyle(0x444444, smokeAlpha)
          g.fillCircle(x, y - progress * 20, radius * 0.4 * (1 + progress))
        }

        // Fire particles
        particles.forEach(p => {
          p.x += p.vx * 0.016
          p.y += p.vy * 0.016
          p.vy += 120 * 0.016
          p.size *= 0.96

          if (p.size > 0.5) {
            g.fillStyle(p.color, ringAlpha)
            g.fillCircle(p.x, p.y, p.size)
          }
        })

        // Metal chunks
        chunks.forEach(p => {
          p.x += p.vx * 0.016
          p.y += p.vy * 0.016
          p.vy += 200 * 0.016

          if (ringAlpha > 0.2) {
            g.fillStyle(0x333333, ringAlpha)
            g.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size)
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
    return false // Cannonballs don't ricochet, they explode
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
