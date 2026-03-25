import Phaser from 'phaser'
import { AudioSystem } from '../systems/AudioSystem.js'
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../constants.js'

const TANK_SPEED = 120
const TANK_DAMAGE = [25, 50, 100]
const DEPLOY_TIME = 600 // ms before tank starts moving

export class TankProjectile {
  constructor(scene, x, y, direction, chargeLevel) {
    this.scene = scene
    this.chargeLevel = chargeLevel
    this.alive = true
    this.direction = direction
    this.deploying = true
    this.deployStart = scene.time.now
    this.hitEnemies = new Set() // track which enemies we've already hit

    // Determine charge tier
    if (chargeLevel >= 0.67) {
      this.tier = 2
    } else if (chargeLevel >= 0.34) {
      this.tier = 1
    } else {
      this.tier = 0
    }

    this.damage = TANK_DAMAGE[this.tier]

    // Tank size scales with tier
    this.tankWidth = this.tier === 2 ? 60 : this.tier === 1 ? 50 : 40
    this.tankHeight = this.tier === 2 ? 32 : this.tier === 1 ? 28 : 24

    // Create physics body — tank sits on the ground
    this.sprite = scene.physics.add.sprite(x, y, null)
    this.sprite.setSize(this.tankWidth, this.tankHeight)
    this.sprite.setVisible(false)
    this.sprite.setDepth(9)
    this.sprite.body.setAllowGravity(true)
    this.sprite.body.setVelocity(0, 0)
    this.sprite.body.setBounce(0)
    this.sprite.body.setCollideWorldBounds(false)

    // Collide with ground
    if (scene.ground) {
      scene.physics.add.collider(this.sprite, scene.ground)
    }

    // Graphics
    this.graphics = scene.add.graphics()
    this.graphics.setDepth(9)

    // Smoke trail
    this.smokeParticles = []

    // Tread animation
    this.treadOffset = 0

    // Deploy sound
    AudioSystem.playThrow()

    // Screen shake for tier 2 deploy
    if (this.tier === 2) {
      scene.cameras.main.shake(300, 0.01)
      AudioSystem.playMaxProcess()
    }
  }

  update() {
    if (!this.alive || !this.sprite.active) return

    const now = this.scene.time.now
    const x = this.sprite.x
    const y = this.sprite.y

    // Deploy phase — tank drops to ground, pauses
    if (this.deploying) {
      if (now - this.deployStart > DEPLOY_TIME) {
        this.deploying = false
        this.sprite.setVelocityX(this.direction * TANK_SPEED)
        this.sprite.body.setAllowGravity(false)
      }
      this.draw()
      return
    }

    // Keep tank rolling at constant speed on the ground
    this.sprite.setVelocityX(this.direction * TANK_SPEED)

    // Animate treads
    this.treadOffset = (this.treadOffset + 0.5) % 6

    // Check enemies in path — crush them
    this.crushEnemies()

    // Add smoke behind tank
    if (Math.random() > 0.6) {
      this.smokeParticles.push({
        x: x - this.direction * (this.tankWidth / 2 + 5),
        y: y + this.tankHeight / 2 - 8,
        alpha: 0.6,
        size: 4 + Math.random() * 4,
        vy: -20 - Math.random() * 15
      })
    }

    // Update smoke
    this.smokeParticles = this.smokeParticles.filter(p => {
      p.y += p.vy * 0.016
      p.alpha -= 0.02
      p.size += 0.1
      return p.alpha > 0
    })

    // Off screen check
    if (x < this.scene.cameras.main.scrollX - 100 ||
        x > this.scene.cameras.main.scrollX + GAME_WIDTH + 100) {
      this.destroy()
      return
    }

    // Tank lifetime — destroy after traveling far enough
    if (Math.abs(x - this.sprite.body.position.x) > 800) {
      this.destroy()
      return
    }

    this.draw()
  }

  crushEnemies() {
    const tx = this.sprite.x
    const ty = this.sprite.y

    // Crush regular enemies
    if (this.scene.enemies) {
      this.scene.enemies.forEach(enemy => {
        if (!enemy.alive) return
        if (this.hitEnemies.has(enemy)) return

        const dist = Phaser.Math.Distance.Between(tx, ty, enemy.sprite.x, enemy.sprite.y)
        if (dist < this.tankWidth / 2 + 20) {
          this.hitEnemies.add(enemy)
          const result = enemy.takeDamage(this.damage, this)
          if (result && result.defeated && this.scene.enemiesDefeated !== undefined) {
            this.scene.enemiesDefeated++
          }
          // Screen shake on crush
          this.scene.cameras.main.shake(100, 0.008)
          AudioSystem.playBossHit()
        }
      })
    }

    // Crush boss
    if (this.scene.boss && this.scene.boss.alive) {
      if (!this.hitEnemies.has(this.scene.boss)) {
        const dist = Phaser.Math.Distance.Between(tx, ty, this.scene.boss.sprite.x, this.scene.boss.sprite.y)
        if (dist < this.tankWidth / 2 + 20) {
          this.hitEnemies.add(this.scene.boss)
          const result = this.scene.boss.takeDamage(this.damage, this)
          if (result && result.defeated && this.scene.enemiesDefeated !== undefined) {
            this.scene.enemiesDefeated++
          }
          this.scene.cameras.main.shake(200, 0.012)
          AudioSystem.playBossHit()
        }
      }
    }

    // Destroy incoming projectiles in path
    const crushProjectiles = (list) => {
      if (!list) return
      list.forEach(proj => {
        if (!proj.alive) return
        const dist = Phaser.Math.Distance.Between(tx, ty, proj.sprite.x, proj.sprite.y)
        if (dist < this.tankWidth / 2 + 10) {
          proj.shatter ? proj.shatter() : proj.destroy ? proj.destroy() : null
        }
      })
    }

    crushProjectiles(this.scene.snowballs)
    crushProjectiles(this.scene.megaphones)
    crushProjectiles(this.scene.collarBoomerangs)
  }

  draw() {
    this.graphics.clear()
    const x = this.sprite.x
    const y = this.sprite.y
    const g = this.graphics
    const dir = this.direction
    const deploying = this.deploying
    const rumble = deploying ? 0 : Math.sin(this.scene.time.now / 80) * 1

    // Smoke trail
    this.smokeParticles.forEach(p => {
      g.fillStyle(0x555555, p.alpha)
      g.fillCircle(p.x, p.y, p.size)
    })

    // Deploy flash
    if (deploying) {
      const progress = (this.scene.time.now - this.deployStart) / DEPLOY_TIME
      if (progress < 0.3) {
        g.fillStyle(COLORS.WHITE, 0.3 - progress)
        g.fillCircle(x, y, 30)
      }
    }

    // === TANK BODY (based on CharacterDesignPage) ===

    // Treads
    g.fillStyle(0x333333)
    g.fillRect(x - this.tankWidth / 2, y + 4 + rumble, this.tankWidth, 10)

    // Tread details
    g.fillStyle(0x222222)
    const treadCount = Math.floor(this.tankWidth / 8)
    for (let t = 0; t < treadCount; t++) {
      const treadX = x - this.tankWidth / 2 + 3 + (t * 8 + this.treadOffset) % this.tankWidth
      if (treadX < x + this.tankWidth / 2 - 3) {
        g.fillRect(treadX, y + 6 + rumble, 5, 7)
      }
    }

    // Tread edges
    g.fillStyle(0x444444)
    g.fillRect(x - this.tankWidth / 2, y + 4 + rumble, this.tankWidth, 1)
    g.fillRect(x - this.tankWidth / 2, y + 13 + rumble, this.tankWidth, 1)

    // Hull (76ers blue)
    const hullH = this.tankHeight * 0.45
    g.fillStyle(0x003DA5)
    g.fillRect(x - this.tankWidth / 2 + 3, y - hullH + 4 + rumble, this.tankWidth - 6, hullH)

    // Red stripe
    g.fillStyle(COLORS.RED)
    g.fillRect(x - this.tankWidth / 2 + 3, y - 2 + rumble, this.tankWidth - 6, 3)

    // Hull darker bottom
    g.fillStyle(0x002277)
    g.fillRect(x - this.tankWidth / 2 + 3, y + 3 + rumble, this.tankWidth - 6, 1)

    // Turret
    const turretW = this.tankWidth * 0.45
    const turretH = hullH * 0.8
    g.fillStyle(0x003DA5)
    g.fillRect(x - turretW / 2, y - hullH - turretH + 6 + rumble, turretW, turretH)

    // Turret rim
    g.fillStyle(0x002277)
    g.fillRect(x - turretW / 2, y - hullH - turretH + 6 + rumble, turretW, 2)

    // Barrel
    const barrelLen = this.tier === 2 ? 28 : this.tier === 1 ? 22 : 18
    g.fillStyle(0x444444)
    g.fillRect(x + dir * turretW / 2, y - hullH - turretH / 2 + 4 + rumble, dir * barrelLen, 5)
    g.fillStyle(0x555555)
    g.fillRect(x + dir * (turretW / 2 + barrelLen), y - hullH - turretH / 2 + 3 + rumble, dir * 4, 7)

    // 76ers star on hull
    g.fillStyle(COLORS.GOLD)
    const starX = x - 8
    const starY = y - hullH / 2 + 2 + rumble
    g.fillRect(starX, starY, 5, 5)
    g.fillRect(starX + 1, starY - 1, 3, 1)
    g.fillRect(starX + 1, starY + 5, 3, 1)
    g.fillRect(starX - 1, starY + 1, 1, 3)
    g.fillRect(starX + 5, starY + 1, 1, 3)

    // "TTP" text on hull
    g.fillStyle(COLORS.WHITE)
    g.fillRect(x + 4, y - hullH / 2 + 2 + rumble, 7, 1)
    g.fillRect(x + 7, y - hullH / 2 + 3 + rumble, 1, 4)

    // Tier glow effect
    if (this.tier >= 1 && !deploying) {
      const glowColor = this.tier === 2 ? COLORS.GOLD : COLORS.CYAN
      g.fillStyle(glowColor, 0.08)
      g.fillRect(x - this.tankWidth / 2 - 4, y - hullH - turretH + 2, this.tankWidth + 8, this.tankHeight + turretH + 8)
    }
  }

  // Compatibility methods
  isRicochet() {
    return false
  }

  getRicochetBounces() {
    return 0
  }

  destroy() {
    this.alive = false
    this.graphics.clear()
    this.graphics.destroy()
    if (this.sprite.active) this.sprite.destroy()
  }
}
