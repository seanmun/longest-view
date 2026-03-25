import { AudioSystem } from '../systems/AudioSystem.js'
import { Megaphone } from './Megaphone.js'
import { COLORS, fontSize } from '../constants.js'

const AE_WIDTH = 68
const AE_HEIGHT = 120
const MOVE_SPEED = 40
const CONTACT_DAMAGE = 15

const SPEECH_BUBBLES = [
  "HOT TAKE!",
  "HINKIE IS A BUM!",
  "TRUST THE WHAT?!",
  "RATINGS ARE DOWN!",
  "WORST GM EVER!",
  "FIRE EVERYBODY!"
]

export class AngeloEskin {
  constructor(scene, x, y) {
    this.scene = scene
    this.hp = 15
    this.maxHp = 15
    this.alive = true
    this.speed = MOVE_SPEED
    this.contactDamage = CONTACT_DAMAGE
    this.stunned = false
    this.stunTimer = null
    this.defeated = false
    this.walkFrame = 0
    this.walkTimer = 0
    this.facing = -1

    // Create physics body
    this.sprite = scene.physics.add.sprite(x, y, null)
    this.sprite.setSize(AE_WIDTH, AE_HEIGHT)
    this.sprite.setCollideWorldBounds(false)
    this.sprite.setVisible(false)
    this.sprite.setDepth(8)
    this.sprite.body.setMaxVelocityY(600)

    // Graphics
    this.graphics = scene.add.graphics()
    this.graphics.setDepth(8)

    // Speech
    this.speechText = null
    this.nextSpeechTime = scene.time.now + 1500 + Math.random() * 2000

    // Megaphone throwing
    this.throwCooldown = 3500
    this.nextThrowTime = scene.time.now + 2000 + Math.random() * 1500
    this.isThrowing = false
  }

  update(time, playerX) {
    if (!this.alive || !this.sprite.active) return

    if (this.stunned) {
      this.sprite.setVelocityX(0)
      this.draw(time)
      return
    }

    // Obstacle bounce
    const blocked = this.sprite.body.blocked
    if (blocked.left || blocked.right) {
      const bounceDir = blocked.left ? 1 : -1
      this.sprite.setVelocityX(bounceDir * this.speed * 1.5)
      if (blocked.down || this.sprite.body.touching.down) {
        this.sprite.setVelocityY(-280)
      }
      this.facing = bounceDir
    } else {
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
    if (this.walkTimer > 250) {
      this.walkFrame = (this.walkFrame + 1) % 4
      this.walkTimer = 0
    }

    // Megaphone throwing
    const distToPlayer = Math.abs(playerX - this.sprite.x)
    if (time > this.nextThrowTime && distToPlayer < 350 && distToPlayer > 60 && !this.isThrowing) {
      this.throwMegaphone(playerX)
      this.nextThrowTime = time + this.throwCooldown + Math.random() * 1000
    }

    // Speech
    if (time > this.nextSpeechTime && !this.speechText) {
      this.showSpeech()
      this.nextSpeechTime = time + 4000 + Math.random() * 3000
    }

    this.draw(time)
  }

  showSpeech() {
    const text = SPEECH_BUBBLES[Math.floor(Math.random() * SPEECH_BUBBLES.length)]
    if (this.speechText) this.speechText.destroy()

    this.speechText = this.scene.add.text(
      this.sprite.x, this.sprite.y - 98, text,
      {
        fontFamily: '"Press Start 2P"',
        fontSize: fontSize(6),
        color: '#FF4444',
        backgroundColor: '#000000',
        padding: { x: 3, y: 2 }
      }
    )
    this.speechText.setOrigin(0.5)
    this.speechText.setDepth(50)

    this.scene.tweens.add({
      targets: this.speechText,
      y: this.sprite.y - 143,
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

  throwMegaphone(playerX) {
    this.isThrowing = true
    this.sprite.setVelocityX(0)

    this.scene.time.delayedCall(300, () => {
      if (!this.alive || !this.sprite.active) return

      const dir = playerX < this.sprite.x ? -1 : 1
      const megaphone = new Megaphone(this.scene, this.sprite.x + dir * 30, this.sprite.y - 23, dir)

      if (this.scene.megaphones) {
        this.scene.megaphones.push(megaphone)
      }

      AudioSystem.playThrow()
      this.isThrowing = false
    })
  }

  takeDamage(damage, ball) {
    if (!this.alive) return

    this.hp -= damage
    AudioSystem.playEnemyHit()

    this.hitFlash = true
    this.scene.time.delayedCall(100, () => { this.hitFlash = false })

    const isRicochet = ball && ball.isRicochet()

    if (this.hp <= 0) {
      this.defeat(ball)
    } else {
      const knockDir = ball ? ball.direction : 1
      this.sprite.setVelocityX(knockDir * 150)
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

    if (this.scene.scoreSystem) {
      if (isRicochet) {
        const bounces = ball.getRicochetBounces()
        const pts = bounces >= 2 ? 800 : 500
        this.scene.scoreSystem.addPoints(pts, x, y - 20, COLORS.CYAN)
        this.scene.scoreSystem.showLabelText(
          bounces >= 2 ? 'ANALYTICS!' : 'RICOCHET!', x, y, COLORS.CYAN
        )
      } else {
        this.scene.scoreSystem.addPoints(200, x, y - 20, COLORS.WHITE)
      }
      this.scene.scoreSystem.addPoints(500, x, y - 40, COLORS.GOLD)
      this.scene.scoreSystem.showLabelText('SILENCED!', x, y - 10, COLORS.GOLD)
    }

    if (this.scene.comboSystem) {
      this.scene.comboSystem.addHit()
    }

    // Gold + red particle burst
    for (let i = 0; i < 10; i++) {
      const color = i % 2 === 0 ? COLORS.GOLD : 0xCC2200
      const particle = this.scene.add.circle(
        x + (Math.random() - 0.5) * 30,
        y + (Math.random() - 0.5) * 30,
        3, color
      )
      particle.setDepth(50)
      this.scene.tweens.add({
        targets: particle,
        x: particle.x + (Math.random() - 0.5) * 60,
        y: particle.y - 30 - Math.random() * 40,
        alpha: 0,
        duration: 700,
        onComplete: () => particle.destroy()
      })
    }

    this.scene.tweens.add({
      targets: this.sprite,
      y: y - 40,
      alpha: 0,
      duration: 600,
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
      this.graphics.fillRect(x - 33, y - 60, 68, 120)
      return
    }

    if (this.stunned) {
      const starPhase = Math.floor(time / 200) % 3
      this.graphics.fillStyle(COLORS.GOLD)
      this.graphics.fillRect(x - 23 + starPhase * 12, y - 83, 9, 9)
      this.graphics.fillRect(x + 8 - starPhase * 6, y - 87, 9, 9)
    }

    const legOffset = this.walkFrame % 2 === 0 ? 5 : -5
    const armSwing = this.walkFrame < 2 ? 6 : -6

    // Legs (wide stance)
    this.graphics.fillStyle(0x2A2A3A)
    this.graphics.fillRect(x - 21, y + 14, 14, 27 + legOffset)
    this.graphics.fillRect(x + 6, y + 14, 14, 27 - legOffset)

    // Shoes
    this.graphics.fillStyle(0x333333)
    this.graphics.fillRect(x - 23, y + 36 + legOffset, 18, 8)
    this.graphics.fillRect(x + 5, y + 36 - legOffset, 18, 8)

    // Body (wide shared torso)
    this.graphics.fillStyle(0x2A2A3A)
    this.graphics.fillRect(x - 27, y - 23, 54, 41)

    // Lapels
    this.graphics.fillStyle(0x1E1E2E)
    this.graphics.fillRect(x - 27, y - 23, 5, 36)
    this.graphics.fillRect(x + 23, y - 23, 5, 36)

    // Shirt (muted red)
    this.graphics.fillStyle(0x993333)
    this.graphics.fillRect(x - 14, y - 23, 27, 32)

    // Dividing line (two personalities)
    this.graphics.fillStyle(0x772222)
    this.graphics.fillRect(x, y - 23, 3, 32)

    // Arms
    this.graphics.fillStyle(0x2A2A3A)
    this.graphics.fillRect(x - 36, y - 18 + armSwing, 12, 27)
    this.graphics.fillRect(x + 24, y - 18 - armSwing, 12, 27)

    // Hands
    this.graphics.fillStyle(0xE8B090)
    this.graphics.fillRect(x - 36, y + 8 + armSwing, 12, 9)
    this.graphics.fillRect(x + 24, y + 8 - armSwing, 12, 9)

    // Left neck (Angelo)
    this.graphics.fillStyle(0xE0B090)
    this.graphics.fillRect(x - 18, y - 36, 12, 15)
    // Right neck (Eskin)
    this.graphics.fillStyle(0xE8B090)
    this.graphics.fillRect(x + 6, y - 36, 12, 15)

    // === LEFT HEAD — ANGELO (older, grey hair, yelling) ===
    this.graphics.fillStyle(0xE0B090)
    this.graphics.fillRect(x - 32, y - 63, 32, 30)

    // Grey hair
    this.graphics.fillStyle(0xAAAAAA)
    this.graphics.fillRect(x - 27, y - 71, 23, 3)
    this.graphics.fillRect(x - 32, y - 68, 32, 3)
    this.graphics.fillRect(x - 33, y - 65, 36, 3)
    this.graphics.fillRect(x - 33, y - 63, 5, 14)

    // Angelo eyes
    this.graphics.fillStyle(0xFFFFFF)
    this.graphics.fillRect(x - 26, y - 53, 8, 5)
    this.graphics.fillRect(x - 12, y - 53, 8, 5)
    this.graphics.fillStyle(0x443322)
    this.graphics.fillRect(x - 23, y - 53, 5, 5)
    this.graphics.fillRect(x - 9, y - 53, 5, 5)

    // Angelo bushy eyebrows
    this.graphics.fillStyle(0x888888)
    this.graphics.fillRect(x - 27, y - 54, 9, 2)
    this.graphics.fillRect(x - 12, y - 54, 9, 2)

    // Angelo mouth (open, yelling)
    this.graphics.fillStyle(0x111111)
    this.graphics.fillRect(x - 23, y - 39, 14, 5)
    this.graphics.fillStyle(0xFFFFFF)
    this.graphics.fillRect(x - 21, y - 39, 3, 2)
    this.graphics.fillRect(x - 14, y - 39, 3, 2)

    // === RIGHT HEAD — ESKIN (beard, brown hair) ===
    this.graphics.fillStyle(0xE8B090)
    this.graphics.fillRect(x + 0, y - 63, 32, 30)

    // Brown hair
    this.graphics.fillStyle(0x8B6842)
    this.graphics.fillRect(x + 5, y - 71, 23, 3)
    this.graphics.fillRect(x + 0, y - 68, 32, 3)
    this.graphics.fillRect(x - 2, y - 65, 36, 3)
    this.graphics.fillRect(x + 32, y - 63, 3, 14)
    // Hair volume
    this.graphics.fillRect(x + 0, y - 72, 32, 3)
    this.graphics.fillRect(x + 5, y - 75, 23, 3)

    // Eskin eyes
    this.graphics.fillStyle(0xFFFFFF)
    this.graphics.fillRect(x + 6, y - 53, 8, 5)
    this.graphics.fillRect(x + 20, y - 53, 8, 5)
    this.graphics.fillStyle(0x443322)
    this.graphics.fillRect(x + 9, y - 53, 5, 5)
    this.graphics.fillRect(x + 23, y - 53, 5, 5)

    // Eskin eyebrows
    this.graphics.fillStyle(0x6B4822)
    this.graphics.fillRect(x + 5, y - 54, 9, 2)
    this.graphics.fillRect(x + 18, y - 54, 9, 2)

    // Eskin beard
    this.graphics.fillStyle(0x6B4822)
    this.graphics.fillRect(x + 2, y - 39, 27, 8)
    this.graphics.fillRect(x + 5, y - 32, 23, 5)
    this.graphics.fillRect(x + 8, y - 27, 18, 3)
    this.graphics.fillRect(x + 0, y - 41, 5, 9)
    this.graphics.fillRect(x + 27, y - 41, 5, 9)

    // Eskin mouth (smirk, visible above beard)
    this.graphics.fillStyle(0x995533)
    this.graphics.fillRect(x + 9, y - 41, 14, 3)

    // Megaphone in hand during throw
    if (this.isThrowing) {
      const throwDir = this.facing || 1
      this.graphics.fillStyle(0xCC2200)
      this.graphics.fillRect(x + throwDir * 39, y - 12, 12, 15)
      this.graphics.fillStyle(0xE8B800)
      this.graphics.fillRect(x + throwDir * 39, y - 5, 12, 2)
    }

    // HP bar (always visible since mini-boss)
    const barWidth = 68
    const barX = x - barWidth / 2
    const barY = y - 83
    this.graphics.fillStyle(0x333333)
    this.graphics.fillRect(barX, barY, barWidth, 6)
    this.graphics.fillStyle(COLORS.RED)
    this.graphics.fillRect(barX, barY, barWidth * (this.hp / this.maxHp), 6)
  }

  destroy() {
    if (this.speechText) this.speechText.destroy()
    this.graphics.destroy()
    if (this.sprite.active) this.sprite.destroy()
  }
}
