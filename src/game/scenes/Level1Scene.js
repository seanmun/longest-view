import Phaser from 'phaser'
import { Player } from '../entities/Player.js'
import { Ball } from '../entities/Ball.js'
import { FanEnemy } from '../entities/FanEnemy.js'
import { AngeloEskin } from '../entities/AngeloEskin.js'
import { BossBrian } from '../entities/BossBrian.js'
import { EmbiidAlly } from '../entities/EmbiidAlly.js'
import { ScoreSystem } from '../systems/ScoreSystem.js'
import { ComboSystem } from '../systems/ComboSystem.js'
import { DialogueSystem } from '../systems/DialogueSystem.js'
import { AudioSystem } from '../systems/AudioSystem.js'
import { COLORS, GAME_WIDTH, GAME_HEIGHT, fontSize } from '../constants.js'
import { CRTBarrelPipeline } from '../pipelines/CRTBarrelPipeline.js'

const LEVEL_WIDTH = 5400
const GROUND_Y = GAME_HEIGHT - 30

const WAVES = [
  // Wave 1: Warmup (2 enemies)
  { trigger: 200, enemies: [
    { x: 600, variant: 'normal' }, { x: 700, variant: 'normal' }
  ]},
  // Wave 2: Ramp up (3 enemies)
  { trigger: 800, enemies: [
    { x: 1200, variant: 'normal' }, { x: 1300, variant: 'normal' }, { x: 1400, variant: 'normal' }
  ]},
  // Wave 3: Introduce fast variant (4 enemies)
  { trigger: 1600, enemies: [
    { x: 2000, variant: 'normal' }, { x: 2100, variant: 'normal' },
    { x: 2200, variant: 'normal' }, { x: 2300, variant: 'fast' }
  ]},
  // Wave 4: Mixed assault + mini-boss (5 enemies)
  { trigger: 2500, enemies: [
    { x: 2900, variant: 'normal' }, { x: 3000, variant: 'fast' },
    { x: 3100, variant: 'normal' }, { x: 3200, variant: 'normal' },
    { x: 3300, variant: 'angeloeskin' }
  ]},
  // Wave 5: Fast-heavy (5 enemies)
  { trigger: 3400, enemies: [
    { x: 3800, variant: 'fast' }, { x: 3900, variant: 'normal' },
    { x: 4000, variant: 'fast' }, { x: 4100, variant: 'fast' },
    { x: 4200, variant: 'normal' }
  ]},
  // Wave 6: Final push (4 enemies, no duplicate AngeloEskin)
  { trigger: 4200, enemies: [
    { x: 4600, variant: 'fast' }, { x: 4700, variant: 'normal' },
    { x: 4800, variant: 'fast' }, { x: 4900, variant: 'fast' }
  ]}
]

const SIDE_QUEST = {
  trigger: 2200,
  speaker: 'ANALYST',
  text: '"Sam, the owner wants us to sign a 32-year-old point guard for $18M a year. He can still play."',
  options: [
    { text: 'Sign him. The fans will be happy.', result: 'bad' },
    { text: 'Pass. We need the cap space for the right player in 3 years.', result: 'good' }
  ]
}

export class Level1Scene extends Phaser.Scene {
  constructor() {
    super({ key: 'Level1Scene' })
  }

  create() {
    this.cameras.main.fadeIn(500)
    this.cameras.main.setPostPipeline(CRTBarrelPipeline)

    // Set world bounds
    this.physics.world.setBounds(0, 0, LEVEL_WIDTH, GAME_HEIGHT)
    this.cameras.main.setBounds(0, 0, LEVEL_WIDTH, GAME_HEIGHT)

    // Systems
    this.scoreSystem = new ScoreSystem(this)
    this.comboSystem = new ComboSystem(this)
    this.dialogueSystem = new DialogueSystem(this)
    this.balls = []
    this.snowballs = []
    this.megaphones = []
    this.collarBoomerangs = []
    this.enemies = []
    this.waveIndex = 0
    this.sideQuestTriggered = false
    this.embiidTriggered = false
    this.embiid = null
    this.bossTriggered = false
    this.boss = null
    this.levelComplete = false
    this.villainAnnouncementActive = false
    this.villainMusicActive = false
    this.finishLineX = null
    this.startTime = this.time.now
    this.enemiesDefeated = 0
    this.totalDamageTaken = 0

    // Draw background layers
    this.drawBackground()

    // Create ground platform
    this.ground = this.physics.add.staticGroup()
    const groundRect = this.add.rectangle(LEVEL_WIDTH / 2, GROUND_Y + 15, LEVEL_WIDTH, 30, 0x2a2a3a)
    this.physics.add.existing(groundRect, true)
    this.ground.add(groundRect)

    // Environmental objects (trash cans, hot dog carts)
    this.envObjects = this.physics.add.staticGroup()
    this.createEnvironment()

    // Create player
    this.player = new Player(this, 100, GROUND_Y - 45)
    this.physics.add.collider(this.player.sprite, this.ground)
    this.physics.add.collider(this.player.sprite, this.envObjects)
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0)
    this.cameras.main.setDeadzone(200, GAME_HEIGHT)

    // Callbacks from player to React UI
    this.player.onHealthChange = (hp, maxHp) => {
      this.game.registry.set('playerHp', hp)
      this.game.registry.set('playerMaxHp', maxHp)
    }
    this.player.onLivesChange = (lives) => {
      this.game.registry.set('playerLives', lives)
    }
    this.player.onChargeChange = (charge) => {
      this.game.registry.set('chargeLevel', charge)
    }
    this.player.onDamageTaken = (amount) => {
      this.totalDamageTaken += amount
      const penalty = amount * 5
      if (this.scoreSystem) {
        this.scoreSystem.deductPoints(penalty, this.player.sprite.x, this.player.sprite.y - 10)
      }
    }
    this.player.onDeath = () => {
      AudioSystem.stopMusic()
      this.cameras.main.fadeOut(1000, 0, 0, 0)
      this.time.delayedCall(1000, () => {
        this.scene.start('GameOverScene', { score: this.scoreSystem.getScore() })
      })
    }

    this.scoreSystem.onScoreChange = (score) => {
      this.game.registry.set('score', score)
    }

    this.comboSystem.onComboChange = (hits, multiplier, ttp) => {
      this.game.registry.set('comboHits', hits)
      this.game.registry.set('comboMultiplier', multiplier)
    }

    this.dialogueSystem.onDialogueStart = (data) => {
      this.game.registry.set('dialogueActive', true)
      this.game.registry.set('dialogueData', data)
    }

    this.dialogueSystem.onDialogueEnd = (choiceIndex, result) => {
      this.game.registry.set('dialogueActive', false)
      this.handleSideQuestResult(result)
    }

    // Initialize registry
    this.game.registry.set('playerHp', 100)
    this.game.registry.set('playerMaxHp', 100)
    this.game.registry.set('playerLives', 3)
    this.game.registry.set('score', 0)
    this.game.registry.set('comboHits', 0)
    this.game.registry.set('comboMultiplier', 1)
    this.game.registry.set('chargeLevel', 0)
    this.game.registry.set('dialogueActive', false)
    this.game.registry.set('dialogueData', null)
    this.game.registry.set('elapsedTime', 0)
    this.game.registry.set('showLevelComplete', false)
    this.game.registry.set('levelCompleteData', null)
    this.game.registry.set('showInitialsEntry', false)
    this.game.registry.set('initialsEntryData', null)
    this.game.registry.set('showLeaderboard', false)
    this.game.registry.set('leaderboardHighlight', null)
    this.game.registry.set('currentLevel', 'THE WELLS FARGO CENTER')

    // Level subtitle
    this.showLevelTitle()

    // Start music
    AudioSystem.resume()
    AudioSystem.playLevel1Music()
  }

  drawBackground() {
    // Far layer — dark ceiling with spotlights
    this.bgFar = this.add.graphics()
    this.bgFar.setDepth(0)
    this.bgFar.setScrollFactor(0.2)

    // Dark ceiling
    this.bgFar.fillStyle(0x0a0a1a)
    this.bgFar.fillRect(0, 0, LEVEL_WIDTH * 2, GAME_HEIGHT)

    // Spotlights
    for (let i = 0; i < 20; i++) {
      const sx = i * 400
      this.bgFar.fillStyle(COLORS.GOLD, 0.05)
      this.bgFar.fillTriangle(sx, 0, sx - 40, 120, sx + 40, 120)
      this.bgFar.fillStyle(COLORS.WHITE, 0.03)
      this.bgFar.fillCircle(sx, 0, 8)
    }

    // Mid layer — banners on wall
    this.bgMid = this.add.graphics()
    this.bgMid.setDepth(1)
    this.bgMid.setScrollFactor(0.5)

    // Wall
    this.bgMid.fillStyle(0x1a1a2e)
    this.bgMid.fillRect(0, 40, LEVEL_WIDTH * 2, GAME_HEIGHT - 40)

    // Banners
    const banners = [
      { x: 200, text: 'JULIUS ERVING #6', color: COLORS.RED },
      { x: 600, text: 'CHAMPIONSHIP BANNER\nCOMING SOON', color: COLORS.GOLD },
      { x: 1000, text: 'MNS.COM\nMONEY NEVER SLEEPS', color: COLORS.GOLD },
      { x: 1600, text: 'ALLEN IVERSON #3', color: COLORS.RED },
      { x: 2200, text: 'TRUST\nTHE\nPROCESS', color: COLORS.CYAN },
      { x: 2800, text: 'MNS.COM', color: COLORS.GOLD },
      { x: 3400, text: 'DR. J\nFOREVER', color: COLORS.RED },
      { x: 4000, text: 'MNS.COM\nTRUST THE DATA', color: COLORS.GOLD },
      { x: 4600, text: 'PROCESS>>>', color: COLORS.CYAN }
    ]

    banners.forEach(b => {
      // Banner background
      this.bgMid.fillStyle(0x222244)
      this.bgMid.fillRect(b.x - 50, 60, 100, 70)
      this.bgMid.lineStyle(2, b.color)
      this.bgMid.strokeRect(b.x - 50, 60, 100, 70)

      // Banner text
      this.add.text(b.x, 95, b.text, {
        fontFamily: '"Press Start 2P"',
        fontSize: fontSize(6),
        color: '#' + b.color.toString(16).padStart(6, '0'),
        align: 'center'
      }).setOrigin(0.5).setScrollFactor(0.5).setDepth(2)
    })

    // Near layer — floor details and graffiti
    this.bgNear = this.add.graphics()
    this.bgNear.setDepth(3)
    this.bgNear.setScrollFactor(0.8)

    // Concourse floor tiles
    for (let i = 0; i < LEVEL_WIDTH / 50; i++) {
      this.bgNear.lineStyle(1, 0x2a2a4a, 0.3)
      this.bgNear.lineBetween(i * 50, GROUND_Y - 5, i * 50, GROUND_Y + 30)
    }

    // Graffiti tags
    const graffitiTags = [
      { x: 300, text: 'TANK JOB', color: '#CC2200' },
      { x: 800, text: 'HINKIE WAS RIGHT', color: '#00D4FF' },
      { x: 1200, text: 'MNS.COM', color: '#E8B800' },
      { x: 1800, text: 'PROCESS>>', color: '#00D4FF' },
      { x: 2400, text: 'HINKIE WAS RIGHT × MNS.COM', color: '#E8B800' },
      { x: 3000, text: 'TTP', color: '#FFFFFF' },
      { x: 3600, text: 'TRUST HINKIE', color: '#00D4FF' },
      { x: 4400, text: 'MNS.COM KNOWS', color: '#E8B800' },
      { x: 5000, text: 'PROCESS FOREVER', color: '#FFFFFF' }
    ]

    graffitiTags.forEach(g => {
      this.add.text(g.x, GROUND_Y - 50, g.text, {
        fontFamily: '"Press Start 2P"',
        fontSize: fontSize(5),
        color: g.color,
        alpha: 0.4
      }).setScrollFactor(0.8).setDepth(3)
    })
  }

  createEnvironment() {
    // Trash cans — solid obstacles
    const trashPositions = [400, 1100, 1900, 2600, 3400, 4200, 4800]
    trashPositions.forEach(tx => {
      // Visual: trash body
      this.add.rectangle(tx, GROUND_Y - 22, 24, 30, 0x555555).setDepth(4)
      // Visual: lid
      this.add.rectangle(tx, GROUND_Y - 39, 30, 6, 0x666666).setDepth(4)

      // Physics: solid hitbox for the trash can
      const hitbox = this.add.rectangle(tx, GROUND_Y - 22, 24, 30)
      this.physics.add.existing(hitbox, true) // true = static
      this.envObjects.add(hitbox)
    })

    // Hot dog cart at x=1600 — solid obstacle
    const cartX = 1600
    this.add.rectangle(cartX, GROUND_Y - 18, 60, 36, 0xCC4400).setDepth(4)
    this.add.rectangle(cartX, GROUND_Y - 39, 66, 6, 0xDD5500).setDepth(4)
    this.add.text(cartX, GROUND_Y - 27, 'DOGS', {
      fontFamily: '"Press Start 2P"',
      fontSize: fontSize(6),
      color: '#FFFFFF'
    }).setOrigin(0.5).setDepth(5)

    // Physics: solid hitbox for the cart
    const cartHitbox = this.add.rectangle(cartX, GROUND_Y - 18, 60, 36)
    this.physics.add.existing(cartHitbox, true)
    this.envObjects.add(cartHitbox)

    // Second hot dog cart at x=3800
    const cart2X = 3800
    this.add.rectangle(cart2X, GROUND_Y - 18, 60, 36, 0xCC4400).setDepth(4)
    this.add.rectangle(cart2X, GROUND_Y - 39, 66, 6, 0xDD5500).setDepth(4)
    this.add.text(cart2X, GROUND_Y - 27, 'DOGS', {
      fontFamily: '"Press Start 2P"',
      fontSize: fontSize(6),
      color: '#FFFFFF'
    }).setOrigin(0.5).setDepth(5)
    const cart2Hitbox = this.add.rectangle(cart2X, GROUND_Y - 18, 60, 36)
    this.physics.add.existing(cart2Hitbox, true)
    this.envObjects.add(cart2Hitbox)

    // "IN TANK WE TRUST" sign
    this.add.text(2200, GROUND_Y - 90, 'IN TANK WE TRUST', {
      fontFamily: '"Press Start 2P"',
      fontSize: fontSize(7),
      color: '#FFFFFF',
      backgroundColor: '#444444',
      padding: { x: 4, y: 3 }
    }).setDepth(4)

    // Second sign deeper in level
    this.add.text(4000, GROUND_Y - 90, 'HINKIE DID NOTHING WRONG', {
      fontFamily: '"Press Start 2P"',
      fontSize: fontSize(7),
      color: '#00D4FF',
      backgroundColor: '#333344',
      padding: { x: 4, y: 3 }
    }).setDepth(4)
  }

  showLevelTitle() {
    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, 'LEVEL 1', {
      fontFamily: '"Press Start 2P"',
      fontSize: fontSize(20),
      color: '#E8B800',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200)

    const subtitle = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 5, 'THE WELLS FARGO CENTER', {
      fontFamily: '"Press Start 2P"',
      fontSize: fontSize(10),
      color: '#FFFFFF'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200)

    const tagline = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30, '"The Fans Don\'t Understand Yet"', {
      fontFamily: '"Press Start 2P"',
      fontSize: fontSize(7),
      color: '#888888'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200)

    this.tweens.add({
      targets: [title, subtitle, tagline],
      alpha: 0,
      duration: 500,
      delay: 2500,
      onComplete: () => {
        title.destroy()
        subtitle.destroy()
        tagline.destroy()
      }
    })
  }

  spawnWave(waveData) {
    let hasVillain = false
    waveData.enemies.forEach(e => {
      let enemy
      if (e.variant === 'angeloeskin') {
        enemy = new AngeloEskin(this, e.x, GROUND_Y - 50)
        hasVillain = true
      } else {
        enemy = new FanEnemy(this, e.x, GROUND_Y - 40, e.variant)
      }
      this.physics.add.collider(enemy.sprite, this.ground)
      this.physics.add.collider(enemy.sprite, this.envObjects)
      this.enemies.push(enemy)
    })

    // Villain entrance: announce + Embiid + evil music
    if (hasVillain) {
      this.showVillainAnnouncement('ANGELO & ESKIN', 'PHILLY SPORTS RADIO\'S WORST', 0xFF4444)
      AudioSystem.playVillainIntro()

      // Switch to villain music after announcement
      this.villainMusicActive = true
      this.time.delayedCall(800, () => {
        AudioSystem.playVillainMusic()
      })

      // Spawn Embiid to help
      if (!this.embiidTriggered) {
        this.embiidTriggered = true
        this.time.delayedCall(1500, () => {
          const px = this.player.sprite.x
          this.embiid = new EmbiidAlly(this, px - 200, GROUND_Y - 70)
          this.physics.add.collider(this.embiid.sprite, this.ground)
        })
      }
    }
  }

  showVillainAnnouncement(name, subtitle, color) {
    // Brief pause
    this.villainAnnouncementActive = true
    this.physics.pause()

    const camX = this.cameras.main.scrollX
    const centerX = camX + GAME_WIDTH / 2
    const centerY = GAME_HEIGHT / 2

    // Dark overlay
    const overlay = this.add.rectangle(camX + GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6)
    overlay.setScrollFactor(0).setDepth(150)

    // Big villain name
    const nameText = this.add.text(GAME_WIDTH / 2, centerY - 15, name, {
      fontFamily: '"Press Start 2P"',
      fontSize: fontSize(24),
      color: '#' + color.toString(16).padStart(6, '0'),
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200)

    // Subtitle
    const subText = this.add.text(GAME_WIDTH / 2, centerY + 20, subtitle, {
      fontFamily: '"Press Start 2P"',
      fontSize: fontSize(8),
      color: '#FFFFFF'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200)

    // Scale in effect
    nameText.setScale(0.3)
    this.tweens.add({
      targets: nameText,
      scaleX: 1,
      scaleY: 1,
      duration: 400,
      ease: 'Back.easeOut'
    })

    // Resume after 1.5 seconds
    this.time.delayedCall(1500, () => {
      this.villainAnnouncementActive = false
      this.physics.resume()

      this.tweens.add({
        targets: [overlay, nameText, subText],
        alpha: 0,
        duration: 400,
        onComplete: () => {
          overlay.destroy()
          nameText.destroy()
          subText.destroy()
        }
      })
    })
  }

  update(time) {
    if (this.dialogueSystem.isActive()) return
    if (this.levelComplete) return
    if (this.villainAnnouncementActive) return

    // Update timer
    const elapsed = Math.floor((time - this.startTime) / 1000)
    this.game.registry.set('elapsedTime', elapsed)

    // Update player
    this.player.update(time)

    // Check wave triggers
    const playerX = this.player.sprite.x
    while (this.waveIndex < WAVES.length && playerX > WAVES[this.waveIndex].trigger) {
      this.spawnWave(WAVES[this.waveIndex])
      this.waveIndex++
    }

    // Side quest trigger
    if (!this.sideQuestTriggered && playerX > SIDE_QUEST.trigger) {
      this.sideQuestTriggered = true
      this.dialogueSystem.showDialogue(SIDE_QUEST)
    }

    // Check if AngeloEskin was defeated — restore normal music
    if (this.villainMusicActive && !this.enemies.some(e => e instanceof AngeloEskin && e.alive)) {
      this.villainMusicActive = false
      if (!this.bossTriggered) {
        AudioSystem.playLevel1Music()
      }
    }

    // Boss trigger — all waves spawned, all regular enemies dead, player past x=4600
    if (!this.bossTriggered && this.waveIndex >= WAVES.length &&
        this.enemies.length === 0 && playerX > 4600) {
      this.bossTriggered = true
      this.showVillainAnnouncement('BRIAN COLANGELO', 'SON OF JERRY. DESTROYER OF PROCESSES.', 0xE8B800)
      AudioSystem.playVillainIntro()

      this.time.delayedCall(1500, () => {
        this.boss = new BossBrian(this, playerX + 300, GROUND_Y - 55)
        this.physics.add.collider(this.boss.sprite, this.ground)
        AudioSystem.playVillainMusic()
        this.villainMusicActive = true
      })
    }

    // Update balls
    this.balls = this.balls.filter(ball => {
      if (!ball.alive) return false
      ball.update()
      return ball.alive
    })

    // Update enemies
    this.enemies = this.enemies.filter(enemy => {
      if (!enemy.alive) return false
      enemy.update(time, this.player.sprite.x)
      return enemy.alive
    })

    // Update boss
    if (this.boss && this.boss.alive) {
      this.boss.update(time, this.player.sprite.x)
    }

    // Update Embiid ally
    if (this.embiid && this.embiid.alive) {
      this.embiid.update(time, [...this.enemies, ...(this.boss && this.boss.alive ? [this.boss] : [])])
    }

    // Ball vs Enemy collisions (only for Ball type — PoisonPill and Tank handle their own)
    this.balls.forEach(ball => {
      if (!ball.alive) return
      if (!(ball instanceof Ball)) return // PoisonPill/Tank handle own damage
      this.enemies.forEach(enemy => {
        if (!enemy.alive) return
        const dist = Phaser.Math.Distance.Between(
          ball.sprite.x, ball.sprite.y,
          enemy.sprite.x, enemy.sprite.y
        )
        if (dist < 38) {
          const result = enemy.takeDamage(ball.damage, ball)
          if (result && result.defeated) {
            this.enemiesDefeated++
          }
          if (!ball.isRicochet() || ball.tier < 2) {
            ball.destroy()
          }
        }
      })
    })

    // Ball vs Boss collisions (only for Ball type)
    if (this.boss && this.boss.alive) {
      this.balls.forEach(ball => {
        if (!ball.alive) return
        if (!(ball instanceof Ball)) return
        const dist = Phaser.Math.Distance.Between(
          ball.sprite.x, ball.sprite.y,
          this.boss.sprite.x, this.boss.sprite.y
        )
        if (dist < 40) {
          const result = this.boss.takeDamage(ball.damage, ball)
          if (result && result.defeated) {
            this.enemiesDefeated++
          }
          if (!ball.isRicochet() || ball.tier < 2) {
            ball.destroy()
          }
        }
      })
    }

    // Update snowballs
    this.snowballs = this.snowballs.filter(snowball => {
      if (!snowball.alive) return false
      snowball.update()
      return snowball.alive
    })

    // Update megaphones
    this.megaphones = this.megaphones.filter(m => {
      if (!m.alive) return false
      m.update()
      return m.alive
    })

    // Update collar boomerangs
    this.collarBoomerangs = this.collarBoomerangs.filter(c => {
      if (!c.alive) return false
      c.update()
      return c.alive
    })

    // Snowball vs Player collisions
    this.snowballs.forEach(snowball => {
      if (!snowball.alive) return
      const sx = snowball.sprite.x
      const sy = snowball.sprite.y
      const body = this.player.sprite.body
      const px = body.x
      const py = body.y
      const pw = body.width
      const ph = body.height

      if (sx > px - 6 && sx < px + pw + 6 &&
          sy > py - 6 && sy < py + ph + 6) {
        this.player.takeDamage(snowball.damage)
        snowball.shatter()
      }
    })

    // Megaphone vs Player collisions
    this.megaphones.forEach(mega => {
      if (!mega.alive) return
      const body = this.player.sprite.body
      const mx = mega.sprite.x
      const my = mega.sprite.y
      if (mx > body.x - 8 && mx < body.x + body.width + 8 &&
          my > body.y - 8 && my < body.y + body.height + 8) {
        this.player.takeDamage(mega.damage)
        mega.shatter()
      }
    })

    // CollarBoomerang vs Player collisions
    this.collarBoomerangs.forEach(collar => {
      if (!collar.alive) return
      const body = this.player.sprite.body
      const cx = collar.sprite.x
      const cy = collar.sprite.y
      if (cx > body.x - 8 && cx < body.x + body.width + 8 &&
          cy > body.y - 8 && cy < body.y + body.height + 8) {
        this.player.takeDamage(collar.damage)
        collar.shatter()
      }
    })

    // Embiid blocks projectiles (snowballs, megaphones, collars)
    if (this.embiid && this.embiid.alive) {
      const ex = this.embiid.sprite.x
      const ey = this.embiid.sprite.y
      const blockRange = 53

      this.snowballs.forEach(s => {
        if (!s.alive) return
        if (Phaser.Math.Distance.Between(s.sprite.x, s.sprite.y, ex, ey) < blockRange) {
          this.embiid.blockProjectile(s)
        }
      })
      this.megaphones.forEach(m => {
        if (!m.alive) return
        if (Phaser.Math.Distance.Between(m.sprite.x, m.sprite.y, ex, ey) < blockRange) {
          this.embiid.blockProjectile(m)
        }
      })
      this.collarBoomerangs.forEach(c => {
        if (!c.alive) return
        if (Phaser.Math.Distance.Between(c.sprite.x, c.sprite.y, ex, ey) < blockRange) {
          this.embiid.blockProjectile(c)
        }
      })
    }

    // Player's ball vs projectile collisions (player can destroy incoming projectiles)
    this.balls.forEach(ball => {
      if (!ball.alive) return

      this.snowballs.forEach(snowball => {
        if (!snowball.alive) return
        if (Phaser.Math.Distance.Between(ball.sprite.x, ball.sprite.y, snowball.sprite.x, snowball.sprite.y) < 15) {
          snowball.shatter()
          if (this.scoreSystem) this.scoreSystem.addPoints(50, snowball.sprite.x, snowball.sprite.y - 10, COLORS.CYAN)
        }
      })

      this.megaphones.forEach(mega => {
        if (!mega.alive) return
        if (Phaser.Math.Distance.Between(ball.sprite.x, ball.sprite.y, mega.sprite.x, mega.sprite.y) < 18) {
          mega.shatter()
          if (this.scoreSystem) this.scoreSystem.addPoints(75, mega.sprite.x, mega.sprite.y - 10, COLORS.CYAN)
        }
      })

      this.collarBoomerangs.forEach(collar => {
        if (!collar.alive) return
        if (Phaser.Math.Distance.Between(ball.sprite.x, ball.sprite.y, collar.sprite.x, collar.sprite.y) < 18) {
          collar.shatter()
          if (this.scoreSystem) this.scoreSystem.addPoints(75, collar.sprite.x, collar.sprite.y - 10, COLORS.CYAN)
        }
      })
    })

    // Player vs Enemy collisions (contact damage)
    this.enemies.forEach(enemy => {
      if (!enemy.alive || enemy.stunned) return
      const dist = Phaser.Math.Distance.Between(
        this.player.sprite.x, this.player.sprite.y,
        enemy.sprite.x, enemy.sprite.y
      )
      if (dist < 38) {
        this.player.takeDamage(enemy.contactDamage)
      }
    })

    // Player vs Boss contact damage
    if (this.boss && this.boss.alive && !this.boss.stunned) {
      const dist = Phaser.Math.Distance.Between(
        this.player.sprite.x, this.player.sprite.y,
        this.boss.sprite.x, this.boss.sprite.y
      )
      if (dist < 40) {
        this.player.takeDamage(this.boss.contactDamage)
      }
    }

    // Boss defeated — show finish line
    if (this.boss && !this.boss.alive && !this.finishLineX) {
      this.villainMusicActive = false
      AudioSystem.playLevel1Music()
      this.showFinishLine()
    }

    // Level complete check — player crosses finish line
    if (this.finishLineX && playerX > this.finishLineX) {
      this.completeLevel()
    }
  }

  handleSideQuestResult(result) {
    if (result === 'good') {
      this.scoreSystem.addPoints(500, this.player.sprite.x, this.player.sprite.y - 30, COLORS.GOLD)
      this.scoreSystem.showLabelText('PROCESS APPROVED', this.player.sprite.x, this.player.sprite.y, COLORS.CYAN)

      // Daryl Morey thumbs up on wall
      const moreyText = this.add.text(
        this.player.sprite.x + 100, GROUND_Y - 80, '👍',
        { fontSize: fontSize(20) }
      ).setDepth(50)

      this.tweens.add({
        targets: moreyText,
        alpha: 0,
        y: GROUND_Y - 120,
        duration: 2000,
        onComplete: () => moreyText.destroy()
      })
    } else {
      this.player.takeDamage(10)
      this.scoreSystem.showLabelText('BAD PROCESS', this.player.sprite.x, this.player.sprite.y, COLORS.RED)
    }
  }

  showFinishLine() {
    // Place finish line 200px ahead of boss position
    const bossX = this.boss ? this.boss.sprite.x : this.player.sprite.x + 200
    this.finishLineX = bossX + 200

    // Draw finish line (checkered pattern)
    const fg = this.add.graphics()
    fg.setDepth(5)
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 2; col++) {
        const isWhite = (row + col) % 2 === 0
        fg.fillStyle(isWhite ? 0xFFFFFF : 0x111111)
        fg.fillRect(this.finishLineX + col * 10, GROUND_Y - 80 + row * 10, 10, 10)
      }
    }

    // Arrow pointing right
    const arrowText = this.add.text(this.finishLineX + 40, GROUND_Y - 50, '>>>', {
      fontFamily: '"Press Start 2P"',
      fontSize: fontSize(10),
      color: '#E8B800'
    }).setDepth(50)

    this.tweens.add({
      targets: arrowText,
      x: arrowText.x + 15,
      duration: 600,
      yoyo: true,
      repeat: -1
    })

    // "NBA DRAFT AWAITS" text
    const draftText = this.add.text(this.finishLineX + 30, GROUND_Y - 90, 'NBA DRAFT AWAITS', {
      fontFamily: '"Press Start 2P"',
      fontSize: fontSize(8),
      color: '#00D4FF',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5, 1).setDepth(50)

    this.tweens.add({
      targets: draftText,
      y: draftText.y - 5,
      duration: 800,
      yoyo: true,
      repeat: -1
    })
  }

  completeLevel() {
    this.levelComplete = true
    AudioSystem.stopMusic()
    AudioSystem.playLevelComplete()

    const elapsed = Math.floor((this.time.now - this.startTime) / 1000)
    const baseScore = this.scoreSystem.getScore()

    // Calculate time bonus
    let timeBonus = 0
    if (elapsed < 60) timeBonus = 2000
    else if (elapsed < 90) timeBonus = 1500
    else if (elapsed < 120) timeBonus = 1000
    else if (elapsed < 150) timeBonus = 500

    // No damage bonus
    const noDamageBonus = this.totalDamageTaken === 0 ? 1000 : 0

    // Damage penalty total (already applied in real-time, just display it)
    const damagePenalty = this.totalDamageTaken * 5

    // Apply bonuses to score (silently, no floating text)
    if (timeBonus > 0) this.scoreSystem.score += timeBonus
    if (noDamageBonus > 0) this.scoreSystem.score += noDamageBonus
    if (this.scoreSystem.onScoreChange) this.scoreSystem.onScoreChange(this.scoreSystem.score)

    const totalEnemies = WAVES.reduce((sum, w) => sum + w.enemies.length, 0) + 1 // +1 for boss
    const finalScore = this.scoreSystem.getScore()

    // Send breakdown data to React
    this.game.registry.set('levelCompleteData', {
      enemiesDefeated: this.enemiesDefeated,
      totalEnemies: totalEnemies,
      damageTaken: this.totalDamageTaken,
      damagePenalty: damagePenalty,
      elapsed: elapsed,
      timeBonus: timeBonus,
      noDamageBonus: noDamageBonus,
      baseScore: baseScore,
      finalScore: finalScore
    })
    this.game.registry.set('showLevelComplete', true)

    // Handle continue input
    this.input.keyboard.on('keydown-ENTER', () => {
      if (this.levelComplete) this.dismissLevelComplete()
    })
    this._onGameStartComplete = () => {
      if (this.levelComplete) this.dismissLevelComplete()
    }
    window.addEventListener('game-start', this._onGameStartComplete)
    this.events.on('shutdown', () => {
      window.removeEventListener('game-start', this._onGameStartComplete)
    })
  }

  dismissLevelComplete() {
    if (this.levelCompleteDismissed) return
    this.levelCompleteDismissed = true

    const data = this.game.registry.get('levelCompleteData')
    this.game.registry.set('showLevelComplete', false)
    this.game.registry.set('initialsEntryData', {
      score: data ? data.finalScore : 0,
      time: data ? data.elapsed : 0
    })
    this.game.registry.set('showInitialsEntry', true)
  }
}
