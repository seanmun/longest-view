import Phaser from 'phaser'
import { AudioSystem } from '../systems/AudioSystem.js'
import { Snowball } from './Snowball.js'
import { COLORS, fontSize } from '../constants.js'

const ENEMY_WIDTH = 45
const ENEMY_HEIGHT = 81
const MOVE_SPEED = 60
const CONTACT_DAMAGE = 10

const SPEECH_BUBBLES = [
  "WHAT IS A PING PONG BALL",
  "JUST WIN GAMES BRO",
  "FIRE HIM NOW",
  "TANK JOB!",
  "WE WANT WINS"
]

export class FanEnemy {
  constructor(scene, x, y, variant = 'normal') {
    this.scene = scene
    this.hp = variant === 'fast' ? 2 : 3
    this.maxHp = this.hp
    this.alive = true
    this.variant = variant
    this.speed = variant === 'fast' ? MOVE_SPEED * 1.6 : MOVE_SPEED
    this.contactDamage = CONTACT_DAMAGE
    this.stunned = false
    this.stunTimer = null
    this.defeated = false
    this.walkFrame = 0
    this.walkTimer = 0
    this.speechTimer = 0
    this.currentSpeech = null
    this.jerseyNumber = Math.floor(Math.random() * 99) + 1

    // Create physics body
    this.sprite = scene.physics.add.sprite(x, y, null)
    this.sprite.setSize(ENEMY_WIDTH, ENEMY_HEIGHT)
    this.sprite.setCollideWorldBounds(false)
    this.sprite.setVisible(false)
    this.sprite.setDepth(8)
    this.sprite.body.setMaxVelocityY(600)

    // Graphics
    this.graphics = scene.add.graphics()
    this.graphics.setDepth(8)

    // Speech bubble text
    this.speechText = null

    // Random speech interval
    this.nextSpeechTime = scene.time.now + 2000 + Math.random() * 3000

    // Snowball throwing
    this.throwCooldown = variant === 'fast' ? 2000 : 3000
    this.nextThrowTime = scene.time.now + 1500 + Math.random() * 2000
    this.isThrowing = false
  }

  update(time, playerX) {
    if (!this.alive || !this.sprite.active) return

    if (this.stunned) {
      this.sprite.setVelocityX(0)
      this.draw(time)
      return
    }

    // Check if blocked by an obstacle — bounce back and jump
    const blocked = this.sprite.body.blocked
    if (blocked.left || blocked.right) {
      // Reverse direction and jump over
      const bounceDir = blocked.left ? 1 : -1
      this.sprite.setVelocityX(bounceDir * this.speed * 1.5)
      if (blocked.down || this.sprite.body.touching.down) {
        this.sprite.setVelocityY(-300)
      }
      this.facing = bounceDir
    } else {
      // Move toward player
      if (playerX < this.sprite.x) {
        this.sprite.setVelocityX(-this.speed)
        this.facing = -1
      } else {
        this.sprite.setVelocityX(this.speed)
        this.facing = 1
      }
    }

    // Walk animation
    this.walkTimer += 16
    if (this.walkTimer > 200) {
      this.walkFrame = (this.walkFrame + 1) % 4
      this.walkTimer = 0
    }

    // Snowball throwing — only when in range and facing player
    const distToPlayer = Math.abs(playerX - this.sprite.x)
    if (time > this.nextThrowTime && distToPlayer < 300 && distToPlayer > 60 && !this.isThrowing) {
      this.throwSnowball(playerX)
      this.nextThrowTime = time + this.throwCooldown + Math.random() * 1000
    }

    // Speech bubbles
    if (time > this.nextSpeechTime && !this.currentSpeech) {
      this.showSpeech()
      this.nextSpeechTime = time + 4000 + Math.random() * 3000
    }

    this.draw(time)
  }

  showSpeech() {
    const text = SPEECH_BUBBLES[Math.floor(Math.random() * SPEECH_BUBBLES.length)]

    if (this.speechText) this.speechText.destroy()

    this.speechText = this.scene.add.text(
      this.sprite.x, this.sprite.y - 52, text,
      {
        fontFamily: '"Press Start 2P"',
        fontSize: fontSize(6),
        color: '#FFFFFF',
        backgroundColor: '#000000',
        padding: { x: 3, y: 2 }
      }
    )
    this.speechText.setOrigin(0.5)
    this.speechText.setDepth(50)

    this.scene.tweens.add({
      targets: this.speechText,
      y: this.sprite.y - 82,
      alpha: 0,
      duration: 2500,
      onComplete: () => {
        if (this.speechText) {
          this.speechText.destroy()
          this.speechText = null
        }
      }
    })
  }

  throwSnowball(playerX) {
    this.isThrowing = true
    this.sprite.setVelocityX(0)

    // Brief wind-up pause, then throw
    this.scene.time.delayedCall(200, () => {
      if (!this.alive || !this.sprite.active) return

      const dir = playerX < this.sprite.x ? -1 : 1
      // Throw at Hinkie's standing head height — above ducking range
      const headHeight = this.sprite.y - 41
      const snowball = new Snowball(this.scene, this.sprite.x + dir * 23, headHeight, dir)

      // Add to scene's snowball tracking array
      if (this.scene.snowballs) {
        this.scene.snowballs.push(snowball)
      }

      AudioSystem.playThrow()
      this.isThrowing = false
    })
  }

  takeDamage(damage, ball) {
    if (!this.alive) return

    this.hp -= damage
    AudioSystem.playEnemyHit()

    // Flash red
    this.hitFlash = true
    this.scene.time.delayedCall(100, () => { this.hitFlash = false })

    // Scoring
    const isRicochet = ball && ball.isRicochet()

    if (this.hp <= 0) {
      this.defeat(ball)
    } else {
      // Knockback
      const knockDir = ball ? ball.direction : 1
      this.sprite.setVelocityX(knockDir * 200)
      this.scene.time.delayedCall(200, () => {
        if (this.sprite.active) this.sprite.setVelocityX(0)
      })
    }

    return { isRicochet, defeated: this.hp <= 0 }
  }

  defeat(ball) {
    this.alive = false
    this.defeated = true
    AudioSystem.playEnemyDefeated()

    const x = this.sprite.x
    const y = this.sprite.y
    const isRicochet = ball && ball.isRicochet()

    // Scoring
    if (this.scene.scoreSystem) {
      if (isRicochet) {
        const bounces = ball.getRicochetBounces()
        const pts = bounces >= 2 ? 500 : 300
        const color = COLORS.CYAN
        this.scene.scoreSystem.addPoints(pts, x, y - 20, color)
        this.scene.scoreSystem.showLabelText(
          bounces >= 2 ? 'ANALYTICS!' : 'RICOCHET!', x, y, COLORS.CYAN
        )
      } else {
        this.scene.scoreSystem.addPoints(150, x, y - 20, COLORS.WHITE)
      }
      // Defeat bonus
      this.scene.scoreSystem.addPoints(100, x, y - 40, COLORS.GOLD)
    }

    if (this.scene.comboSystem) {
      this.scene.comboSystem.addHit()
    }

    // Check for fully charged ball "PROCESSED!" effect
    if (ball && ball.tier === 2) {
      this.scene.scoreSystem.showLabelText('PROCESSED!', x, y - 10, COLORS.GOLD)
      // Gold particle burst
      for (let i = 0; i < 8; i++) {
        const particle = this.scene.add.circle(
          x + (Math.random() - 0.5) * 20,
          y + (Math.random() - 0.5) * 20,
          3, COLORS.GOLD
        )
        particle.setDepth(50)
        this.scene.tweens.add({
          targets: particle,
          x: particle.x + (Math.random() - 0.5) * 60,
          y: particle.y - 30 - Math.random() * 40,
          alpha: 0,
          duration: 600,
          onComplete: () => particle.destroy()
        })
      }
    }

    // Death animation — fly up and fade
    this.scene.tweens.add({
      targets: this.sprite,
      y: y - 30,
      alpha: 0,
      duration: 500,
      onComplete: () => this.destroy()
    })
  }

  stun(duration = 2000) {
    this.stunned = true
    if (this.stunTimer) this.stunTimer.remove()
    this.stunTimer = this.scene.time.delayedCall(duration, () => {
      this.stunned = false
    })
  }

  draw(time) {
    this.graphics.clear()
    const x = this.sprite.x
    const y = this.sprite.y

    if (this.hitFlash) {
      this.graphics.fillStyle(COLORS.RED)
      this.graphics.fillRect(x - 23, y - 41, 45, 81)
      return
    }

    if (this.stunned) {
      const starPhase = Math.floor(time / 200) % 3
      this.graphics.fillStyle(COLORS.GOLD)
      this.graphics.fillRect(x - 18 + starPhase * 9, y - 63, 8, 8)
      this.graphics.fillRect(x + 5 - starPhase * 5, y - 68, 8, 8)
    }

    const legOffset = this.walkFrame % 2 === 0 ? 5 : -5

    // Legs (jeans)
    this.graphics.fillStyle(0x3344AA)
    this.graphics.fillRect(x - 14, y + 9, 12, 27 + legOffset)
    this.graphics.fillRect(x + 3, y + 9, 12, 27 - legOffset)

    // Shoes
    this.graphics.fillStyle(0x888888)
    this.graphics.fillRect(x - 15, y + 32 + legOffset, 15, 8)
    this.graphics.fillRect(x, y + 32 - legOffset, 15, 8)

    // Body (jersey)
    const jerseyColor = this.variant === 'fast' ? COLORS.RED : 0x003DA5 // 76ers blue
    this.graphics.fillStyle(jerseyColor)
    this.graphics.fillRect(x - 18, y - 23, 36, 36)

    // Jersey number
    this.graphics.fillStyle(COLORS.WHITE)
    this.graphics.fillRect(x - 5, y - 14, 9, 12)

    // Arms
    const armSwing = this.walkFrame < 2 ? 5 : -5
    this.graphics.fillStyle(jerseyColor)
    this.graphics.fillRect(x - 27, y - 18 + armSwing, 12, 23)
    this.graphics.fillRect(x + 15, y - 18 - armSwing, 12, 23)

    // Hands
    this.graphics.fillStyle(0xE8B090)
    this.graphics.fillRect(x - 27, y + 3 + armSwing, 12, 8)
    this.graphics.fillRect(x + 15, y + 3 - armSwing, 12, 8)

    // Head
    this.graphics.fillStyle(0xE8B090)
    this.graphics.fillRect(x - 14, y - 45, 27, 26)

    // Hat (backwards cap)
    this.graphics.fillStyle(COLORS.RED)
    this.graphics.fillRect(x - 15, y - 53, 32, 12)

    // Angry eyes
    this.graphics.fillStyle(0x000000)
    this.graphics.fillRect(x - 9, y - 36, 8, 5)
    this.graphics.fillRect(x + 3, y - 36, 8, 5)

    // Angry mouth
    this.graphics.fillStyle(0x000000)
    this.graphics.fillRect(x - 8, y - 27, 14, 5)

    // Snowball in hand during wind-up
    if (this.isThrowing) {
      const throwDir = this.facing || 1
      this.graphics.fillStyle(COLORS.WHITE)
      this.graphics.fillCircle(x + throwDir * 32, y - 14, 8)
    }

    // HP bar
    if (this.hp < this.maxHp) {
      const barWidth = 45
      const barX = x - barWidth / 2
      const barY = y - 59
      this.graphics.fillStyle(0x333333)
      this.graphics.fillRect(barX, barY, barWidth, 5)
      this.graphics.fillStyle(COLORS.RED)
      this.graphics.fillRect(barX, barY, barWidth * (this.hp / this.maxHp), 5)
    }
  }

  destroy() {
    if (this.speechText) this.speechText.destroy()
    this.graphics.destroy()
    if (this.sprite.active) this.sprite.destroy()
  }
}
