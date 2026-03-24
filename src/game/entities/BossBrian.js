import { AudioSystem } from '../systems/AudioSystem.js'
import { CollarBoomerang } from './CollarBoomerang.js'
import { COLORS, GAME_WIDTH } from '../constants.js'

const BOSS_WIDTH = 36
const BOSS_HEIGHT = 80
const MAX_HP = 30

const PHASE_THRESHOLDS = { phase2: 0.5, phase3: 0.25 }

const TWEETS = [
  "@Philly_Hoops_Truth: Hinkie never watches film",
  "@Philly_Hoops_Truth: Stats people never played",
  "@Philly_Hoops_Truth: TRADE THE PICKS",
  "@Philly_Hoops_Truth: Embiid is a bust",
  "@Philly_Hoops_Truth: MNS.COM is suspicious"
]

export class BossBrian {
  constructor(scene, x, y) {
    this.scene = scene
    this.hp = MAX_HP
    this.maxHp = MAX_HP
    this.alive = true
    this.phase = 1
    this.prevPhase = 1
    this.speed = 50
    this.contactDamage = 10
    this.stunned = false
    this.stunTimer = null
    this.walkFrame = 0
    this.walkTimer = 0
    this.facing = -1
    this.hitFlash = false

    // Pacing boundaries — boss paces within a zone
    this.paceLeft = x - 150
    this.paceRight = x + 150
    this.paceDir = -1

    // Create physics body
    this.sprite = scene.physics.add.sprite(x, y, null)
    this.sprite.setSize(BOSS_WIDTH, BOSS_HEIGHT)
    this.sprite.setCollideWorldBounds(false)
    this.sprite.setVisible(false)
    this.sprite.setDepth(8)
    this.sprite.body.setMaxVelocityY(600)

    // Graphics
    this.graphics = scene.add.graphics()
    this.graphics.setDepth(8)

    // Name label
    this.nameText = scene.add.text(x, y - 65, 'BRIAN COLANGELO', {
      fontFamily: '"Press Start 2P"',
      fontSize: '6px',
      color: '#E8B800'
    })
    this.nameText.setOrigin(0.5)
    this.nameText.setDepth(50)

    // Attack timers
    this.nextCollarTime = scene.time.now + 2000
    this.nextTweetTime = scene.time.now + 5000
    this.collarCooldown = 2500
    this.tweetCooldown = 4000

    // Tweet text objects (flying across screen)
    this.activeTweets = []

    // Boss intro
    this.introActive = true
    this.introTimer = scene.time.delayedCall(2000, () => {
      this.introActive = false
    })

    // Show boss intro text
    const introText = scene.add.text(x, y - 100, 'BOSS: BRIAN COLANGELO', {
      fontFamily: '"Press Start 2P"',
      fontSize: '10px',
      color: '#E8B800'
    })
    introText.setOrigin(0.5)
    introText.setDepth(100)
    scene.tweens.add({
      targets: introText,
      alpha: 0,
      y: y - 140,
      duration: 2500,
      onComplete: () => introText.destroy()
    })

    AudioSystem.playBossHit()
    scene.cameras.main.shake(300, 0.01)
  }

  update(time, playerX) {
    if (!this.alive || !this.sprite.active) return

    // Update name position
    this.nameText.setPosition(this.sprite.x, this.sprite.y - 65)

    if (this.introActive) {
      this.sprite.setVelocityX(0)
      this.draw(time)
      return
    }

    if (this.stunned) {
      this.sprite.setVelocityX(0)
      this.draw(time)
      return
    }

    // Determine phase
    const hpPct = this.hp / this.maxHp
    if (hpPct <= PHASE_THRESHOLDS.phase3) {
      this.phase = 3
    } else if (hpPct <= PHASE_THRESHOLDS.phase2) {
      this.phase = 2
    } else {
      this.phase = 1
    }

    // Phase transition effects
    if (this.phase !== this.prevPhase) {
      this.onPhaseChange()
      this.prevPhase = this.phase
    }

    // Update speed/cooldowns per phase
    this.speed = this.phase === 3 ? 100 : this.phase === 2 ? 80 : 50
    this.collarCooldown = this.phase === 3 ? 1500 : this.phase === 2 ? 2000 : 2500
    this.tweetCooldown = this.phase === 3 ? 2500 : 4000

    // Pace back and forth
    if (this.sprite.x <= this.paceLeft) {
      this.paceDir = 1
    } else if (this.sprite.x >= this.paceRight) {
      this.paceDir = -1
    }
    this.sprite.setVelocityX(this.paceDir * this.speed)
    this.facing = playerX < this.sprite.x ? -1 : 1

    // Walk animation
    this.walkTimer += 16
    if (this.walkTimer > 200) {
      this.walkFrame = (this.walkFrame + 1) % 4
      this.walkTimer = 0
    }

    // Collar boomerang attack
    if (time > this.nextCollarTime) {
      this.throwCollar(playerX)
      this.nextCollarTime = time + this.collarCooldown + Math.random() * 500
    }

    // Tweet attacks (phase 2+)
    if (this.phase >= 2 && time > this.nextTweetTime) {
      this.launchTweet()
      this.nextTweetTime = time + this.tweetCooldown + Math.random() * 1000
    }

    // Update active tweets
    this.activeTweets = this.activeTweets.filter(t => {
      if (t.active) return true
      return false
    })

    this.draw(time)
  }

  onPhaseChange() {
    this.scene.cameras.main.shake(400, 0.015)

    if (this.phase === 2) {
      AudioSystem.playBossHit()
      if (this.scene.scoreSystem) {
        this.scene.scoreSystem.addPoints(1000, this.sprite.x, this.sprite.y - 40, COLORS.GOLD)
        this.scene.scoreSystem.showLabelText('PHASE 2!', this.sprite.x, this.sprite.y - 20, COLORS.GOLD)
      }
      // Show burner phone text
      const txt = this.scene.add.text(this.sprite.x, this.sprite.y - 90,
        '@Philly_Hoops_Truth HAS ENTERED THE CHAT', {
          fontFamily: '"Press Start 2P"', fontSize: '7px', color: '#00D4FF'
        })
      txt.setOrigin(0.5).setDepth(100)
      this.scene.tweens.add({
        targets: txt, alpha: 0, y: txt.y - 30, duration: 3000,
        onComplete: () => txt.destroy()
      })
    }

    if (this.phase === 3) {
      AudioSystem.playMaxProcess()
      if (this.scene.scoreSystem) {
        this.scene.scoreSystem.addPoints(1000, this.sprite.x, this.sprite.y - 40, COLORS.GOLD)
        this.scene.scoreSystem.showLabelText('MELTDOWN!', this.sprite.x, this.sprite.y - 20, 0xFF4444)
      }
    }
  }

  throwCollar(playerX) {
    const dir = playerX < this.sprite.x ? -1 : 1
    const collar = new CollarBoomerang(
      this.scene,
      this.sprite.x + dir * 20,
      this.sprite.y - 10,
      dir
    )
    if (this.scene.collarBoomerangs) {
      this.scene.collarBoomerangs.push(collar)
    }
    AudioSystem.playThrow()
  }

  launchTweet() {
    const tweet = TWEETS[Math.floor(Math.random() * TWEETS.length)]
    const yPos = this.sprite.y - 60 - Math.random() * 40
    const fromLeft = Math.random() > 0.5

    const tweetText = this.scene.add.text(
      fromLeft ? this.scene.cameras.main.scrollX - 50 : this.scene.cameras.main.scrollX + GAME_WIDTH + 50,
      yPos,
      tweet,
      {
        fontFamily: '"Press Start 2P"',
        fontSize: '5px',
        color: '#00D4FF',
        backgroundColor: '#111133',
        padding: { x: 3, y: 2 }
      }
    )
    tweetText.setDepth(45)
    this.activeTweets.push(tweetText)

    const targetX = fromLeft
      ? this.scene.cameras.main.scrollX + GAME_WIDTH + 100
      : this.scene.cameras.main.scrollX - 100

    this.scene.tweens.add({
      targets: tweetText,
      x: targetX,
      duration: 4000,
      onComplete: () => {
        tweetText.destroy()
      }
    })
  }

  takeDamage(damage, ball) {
    if (!this.alive || this.introActive) return

    this.hp -= damage
    AudioSystem.playBossHit()

    this.hitFlash = true
    this.scene.time.delayedCall(120, () => { this.hitFlash = false })

    // Screen shake on hit
    this.scene.cameras.main.shake(150, 0.008)

    const isRicochet = ball && ball.isRicochet()

    if (this.scene.scoreSystem) {
      const pts = isRicochet ? 400 : 200
      const color = isRicochet ? COLORS.CYAN : COLORS.GOLD
      this.scene.scoreSystem.addPoints(pts, this.sprite.x, this.sprite.y - 30, color)
    }

    if (this.scene.comboSystem) {
      this.scene.comboSystem.addHit()
    }

    if (this.hp <= 0) {
      this.defeat(ball)
    } else {
      // Knockback (smaller than regular enemies)
      const knockDir = ball ? ball.direction : 1
      this.sprite.setVelocityX(knockDir * 100)
      this.scene.time.delayedCall(150, () => {
        if (this.sprite.active) this.sprite.setVelocityX(0)
      })
    }

    return { isRicochet, defeated: this.hp <= 0 }
  }

  defeat(ball) {
    this.alive = false
    AudioSystem.playLevelComplete()

    const x = this.sprite.x
    const y = this.sprite.y

    if (this.scene.scoreSystem) {
      this.scene.scoreSystem.addPoints(2000, x, y - 40, COLORS.GOLD)
      this.scene.scoreSystem.showLabelText('BOSS DEFEATED!', x, y - 20, COLORS.GOLD)
    }

    // Clean up tweets
    this.activeTweets.forEach(t => {
      if (t.active) t.destroy()
    })
    this.activeTweets = []

    // Gold particle explosion
    for (let i = 0; i < 15; i++) {
      const particle = this.scene.add.circle(
        x + (Math.random() - 0.5) * 40,
        y + (Math.random() - 0.5) * 40,
        4, COLORS.GOLD
      )
      particle.setDepth(50)
      this.scene.tweens.add({
        targets: particle,
        x: particle.x + (Math.random() - 0.5) * 80,
        y: particle.y - 40 - Math.random() * 60,
        alpha: 0,
        scale: 0.2,
        duration: 800,
        onComplete: () => particle.destroy()
      })
    }

    this.scene.cameras.main.shake(500, 0.02)

    // Defeat animation — drop to knees
    this.scene.tweens.add({
      targets: this.sprite,
      y: y + 20,
      duration: 800,
      ease: 'Bounce.easeOut',
      onComplete: () => {
        // Burner phone slides away
        const phone = this.scene.add.graphics()
        phone.setDepth(50)
        phone.fillStyle(0x222222)
        phone.fillRect(0, 0, 8, 14)
        phone.fillStyle(0x44AA66)
        phone.fillRect(1, 2, 6, 5)
        phone.setPosition(x, y + 20)

        this.scene.tweens.add({
          targets: phone,
          x: x + 80,
          y: y + 30,
          angle: 360,
          duration: 1000,
          onComplete: () => {
            this.scene.time.delayedCall(1500, () => {
              phone.destroy()
              this.destroy()
            })
          }
        })
      }
    })
  }

  stun(duration = 1500) {
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
      this.graphics.fillRect(x - 18, y - 40, 36, 80)
      return
    }

    if (this.stunned) {
      const starPhase = Math.floor(time / 200) % 3
      this.graphics.fillStyle(COLORS.GOLD)
      this.graphics.fillRect(x - 12 + starPhase * 6, y - 55, 6, 6)
      this.graphics.fillRect(x + 5 - starPhase * 3, y - 58, 6, 6)
    }

    const legOffset = this.walkFrame % 2 === 0 ? 3 : -3
    const armSwing = this.walkFrame < 2 ? 4 : -4

    // Phase 3: disheveled — offset some parts
    const dishevel = this.phase === 3 ? 2 : 0

    // Legs
    this.graphics.fillStyle(0x2A2A3A)
    this.graphics.fillRect(x - 10, y + 12, 8, 15 + legOffset)
    this.graphics.fillRect(x + 3, y + 12, 8, 15 - legOffset)

    // Shoes
    this.graphics.fillStyle(0x1A1A1A)
    this.graphics.fillRect(x - 12, y + 27 + legOffset, 10, 4)
    this.graphics.fillRect(x + 2, y + 27 - legOffset, 10, 4)

    // Body suit
    this.graphics.fillStyle(0x2A2A3A)
    this.graphics.fillRect(x - 10, y - 14, 5, 20)
    this.graphics.fillRect(x + 6, y - 14, 5, 20)
    this.graphics.fillRect(x - 10, y + 6, 21, 3)
    this.graphics.fillRect(x - 12, y + 9, 25, 3)

    // Lapels
    this.graphics.fillStyle(0x1E1E2E)
    this.graphics.fillRect(x - 13, y - 15, 3, 8)
    this.graphics.fillRect(x + 10, y - 15, 2, 21)
    this.graphics.fillRect(x - 12, y - 8, 2, 17)

    // Shirt (white)
    this.graphics.fillStyle(0xFFFFFF)
    this.graphics.fillRect(x - 6, y - 12, 5, 6)
    this.graphics.fillRect(x + 1, y - 12, 5, 9)
    this.graphics.fillRect(x - 6, y - 6, 6, 3)
    this.graphics.fillRect(x - 6, y - 3, 5, 3)
    this.graphics.fillRect(x + 0, y - 3, 6, 2)
    this.graphics.fillRect(x + 1, y - 1, 5, 4)
    this.graphics.fillRect(x - 6, y + 0, 6, 2)
    this.graphics.fillRect(x - 6, y + 2, 5, 4)

    // Buttons
    this.graphics.fillStyle(0xE8E0E0)
    this.graphics.fillRect(x - 2, y - 8, 3, 1)
    this.graphics.fillRect(x - 1, y - 5, 2, 1)
    this.graphics.fillRect(x - 2, y - 2, 3, 1)
    this.graphics.fillRect(x - 1, y + 1, 2, 1)
    this.graphics.fillRect(x - 2, y + 4, 3, 1)

    // Neck skin
    this.graphics.fillStyle(0xD8A080)
    this.graphics.fillRect(x - 2, y - 15, 3, 8)

    // Arms
    this.graphics.fillStyle(0x2A2A3A)
    this.graphics.fillRect(x - 20, y - 12 + armSwing, 8, 17)
    this.graphics.fillRect(x + 12, y - 12 - armSwing, 8, 17)

    // Hands
    this.graphics.fillStyle(0xE8B090)
    this.graphics.fillRect(x - 20, y + 4 + armSwing, 8, 6)
    this.graphics.fillRect(x + 12, y + 4 - armSwing, 8, 6)

    // Phase 2+: Burner phone in left hand
    if (this.phase >= 2) {
      this.graphics.fillStyle(0x222222)
      this.graphics.fillRect(x - 22, y + 2 + armSwing, 5, 8)
      this.graphics.fillStyle(0x44AA66)
      this.graphics.fillRect(x - 21, y + 3 + armSwing, 3, 3)
    }

    // Head/face
    this.graphics.fillStyle(0xE8B090)
    this.graphics.fillRect(x - 9, y - 35, 18, 6)
    this.graphics.fillRect(x - 10, y - 27, 5, 3)
    this.graphics.fillRect(x + 6, y - 27, 5, 3)
    this.graphics.fillRect(x - 9, y - 24, 8, 2)
    this.graphics.fillRect(x + 1, y - 24, 8, 2)
    this.graphics.fillRect(x - 8, y - 22, 5, 1)
    this.graphics.fillRect(x + 1, y - 22, 5, 1)
    this.graphics.fillRect(x - 6, y - 21, 12, 2)
    this.graphics.fillRect(x - 5, y - 19, 1, 1)
    this.graphics.fillRect(x + 3, y - 19, 1, 1)
    this.graphics.fillRect(x - 3, y - 18, 5, 1)
    this.graphics.fillRect(x - 2, y - 17, 3, 1)

    // Hair
    this.graphics.fillStyle(0x5C4633)
    this.graphics.fillRect(x - 6, y - 39 + dishevel, 12, 2)
    this.graphics.fillRect(x - 9, y - 37 + dishevel, 18, 1)
    this.graphics.fillRect(x - 10, y - 36 + dishevel, 21, 1)
    this.graphics.fillRect(x - 10, y - 35, 2, 8)
    this.graphics.fillRect(x + 9, y - 35, 2, 8)

    // Eyebrows + mouth
    this.graphics.fillStyle(0x996655)
    this.graphics.fillRect(x - 6, y - 29, 5, 1)
    this.graphics.fillRect(x + 1, y - 29, 5, 1)
    // Mouth (angry in phase 3)
    if (this.phase === 3) {
      this.graphics.fillStyle(0x111111)
      this.graphics.fillRect(x - 4, y - 20, 7, 2)
    } else {
      this.graphics.fillStyle(0x996655)
      this.graphics.fillRect(x - 3, y - 20, 6, 1)
    }

    // Eyes
    this.graphics.fillStyle(0xFFFFFF)
    this.graphics.fillRect(x - 3, y - 28, 2, 2)
    this.graphics.fillRect(x + 1, y - 28, 2, 2)
    this.graphics.fillRect(x - 6, y - 26, 5, 2)
    this.graphics.fillRect(x + 1, y - 26, 5, 2)
    // Pupils
    this.graphics.fillStyle(0x333333)
    this.graphics.fillRect(x - 5, y - 28, 2, 2)
    this.graphics.fillRect(x + 3, y - 28, 2, 2)

    // Nose
    this.graphics.fillStyle(0xD8A080)
    this.graphics.fillRect(x - 2, y - 24, 3, 3)

    // THE BIG COLLAR — drawn over face (1.5x scale)
    this.graphics.fillStyle(0xFFFFFF)
    this.graphics.fillRect(x - 12, y - 24, 3, 2)
    this.graphics.fillRect(x + 9, y - 24, 3, 2)
    this.graphics.fillRect(x - 12, y - 22, 5, 1)
    this.graphics.fillRect(x + 7, y - 22, 5, 1)
    this.graphics.fillRect(x - 12, y - 21, 6, 2)
    this.graphics.fillRect(x + 6, y - 21, 6, 2)
    this.graphics.fillRect(x - 12, y - 19, 8, 1)
    this.graphics.fillRect(x + 4, y - 19, 8, 1)
    this.graphics.fillRect(x - 11, y - 18, 8, 1)
    this.graphics.fillRect(x + 3, y - 18, 8, 1)
    this.graphics.fillRect(x - 10, y - 17, 9, 1)
    this.graphics.fillRect(x + 1, y - 17, 9, 1)
    this.graphics.fillRect(x - 6, y - 15, 5, 1)
    this.graphics.fillRect(x + 1, y - 15, 5, 1)

    // Collar shadow
    this.graphics.fillStyle(0xE8E0E0)
    this.graphics.fillRect(x - 10, y - 15, 5, 1)
    this.graphics.fillRect(x + 6, y - 15, 5, 1)
    this.graphics.fillRect(x - 6, y - 14, 5, 1)
    this.graphics.fillRect(x + 1, y - 14, 5, 1)

    // Phase indicator glow
    if (this.phase === 2) {
      this.graphics.fillStyle(0x00D4FF, 0.15)
      this.graphics.fillCircle(x, y, 45)
    } else if (this.phase === 3) {
      const pulse = Math.sin(time * 0.008) * 0.1 + 0.2
      this.graphics.fillStyle(0xFF2200, pulse)
      this.graphics.fillCircle(x, y, 50)
    }

    // HP bar (always visible, wider)
    const barWidth = 60
    const barX = x - barWidth / 2
    const barY = y - 58
    this.graphics.fillStyle(0x333333)
    this.graphics.fillRect(barX, barY, barWidth, 5)
    const hpColor = this.phase === 3 ? 0xFF4444 : this.phase === 2 ? 0xFFAA00 : COLORS.RED
    this.graphics.fillStyle(hpColor)
    this.graphics.fillRect(barX, barY, barWidth * (this.hp / this.maxHp), 5)
  }

  destroy() {
    if (this.nameText) this.nameText.destroy()
    this.activeTweets.forEach(t => {
      if (t.active) t.destroy()
    })
    this.graphics.destroy()
    if (this.sprite.active) this.sprite.destroy()
  }
}
