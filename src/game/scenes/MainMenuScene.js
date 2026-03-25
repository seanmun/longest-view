import Phaser from 'phaser'
import { AudioSystem } from '../systems/AudioSystem.js'
import { COLORS, GAME_WIDTH, GAME_HEIGHT, fontSize, IS_MOBILE } from '../constants.js'
import { CRTBarrelPipeline } from '../pipelines/CRTBarrelPipeline.js'

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' })
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a1a')
    this.cameras.main.setPostPipeline(CRTBarrelPipeline)

    // Start menu music
    AudioSystem.resume()
    AudioSystem.playMenuMusic()

    // Title
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.15, 'LONGEST VIEW', {
      fontFamily: '"Press Start 2P"',
      fontSize: fontSize(32),
      color: '#E8B800',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5)

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.22, "SAM HINKIE'S REVENGE", {
      fontFamily: '"Press Start 2P"',
      fontSize: fontSize(14),
      color: '#FFFFFF'
    }).setOrigin(0.5)

    // Blinking "INSERT COIN" text
    const insertCoin = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.38, IS_MOBILE ? 'PRESS START' : 'PRESS ENTER TO START', {
      fontFamily: '"Press Start 2P"',
      fontSize: fontSize(12),
      color: '#00D4FF'
    }).setOrigin(0.5)

    this.tweens.add({
      targets: insertCoin,
      alpha: 0.2,
      duration: 600,
      yoyo: true,
      repeat: -1
    })

    // Menu options
    const menuItems = ['PLAY', 'LEADERBOARD', 'HOW TO PLAY', 'CREDITS']
    this.selectedIndex = 0
    this.menuTexts = []

    menuItems.forEach((item, i) => {
      const text = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.48 + i * 40, item, {
        fontFamily: '"Press Start 2P"',
        fontSize: fontSize(10),
        color: i === 0 ? '#E8B800' : '#666666'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })

      // Tap to select, tap again to confirm
      text.on('pointerdown', () => {
        AudioSystem.resume()
        if (i === this.selectedIndex) {
          this.selectMenu()
        } else {
          this.selectedIndex = i
          AudioSystem.playMenuSelect()
          this.menuTexts.forEach((t, j) => {
            t.setColor(j === this.selectedIndex ? '#E8B800' : '#666666')
          })
        }
      })

      this.menuTexts.push(text)
    })

    // MNS at bottom
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 20, 'MONEYNEVERSLEEPS.APP', {
      fontFamily: '"Press Start 2P"',
      fontSize: fontSize(8),
      color: '#E8B800',
      alpha: 0.6
    }).setOrigin(0.5)

    // Animated Hinkie walking across screen
    this.demoHinkieX = -30
    this.demoGraphics = this.add.graphics()
    this.demoGraphics.setDepth(5)
    this.demoWalkFrame = 0
    this.demoWalkTimer = 0

    // Input
    this.input.keyboard.on('keydown-UP', () => this.moveMenu(-1))
    this.input.keyboard.on('keydown-DOWN', () => this.moveMenu(1))
    this.input.keyboard.on('keydown-ENTER', () => this.selectMenu())
    this.input.keyboard.on('keydown-SPACE', () => this.selectMenu())

    // Also start on any click/tap
    this.input.on('pointerdown', () => {
      AudioSystem.resume()
    })

    // Mobile custom events
    this._onGameStart = () => this.selectMenu()
    this._onGameSelect = () => {} // no-op on menu
    window.addEventListener('game-start', this._onGameStart)
    window.addEventListener('game-select', this._onGameSelect)

    this.events.on('shutdown', () => {
      window.removeEventListener('game-start', this._onGameStart)
      window.removeEventListener('game-select', this._onGameSelect)
    })
  }

  moveMenu(dir) {
    AudioSystem.playMenuSelect()
    this.selectedIndex = Phaser.Math.Clamp(
      this.selectedIndex + dir, 0, this.menuTexts.length - 1
    )
    this.menuTexts.forEach((text, i) => {
      text.setColor(i === this.selectedIndex ? '#E8B800' : '#666666')
    })
  }

  selectMenu() {
    AudioSystem.playMenuConfirm()

    if (this.selectedIndex === 0) {
      // PLAY — go to weapon select
      AudioSystem.stopMusic()
      this.cameras.main.fadeOut(500, 0, 0, 0)
      this.time.delayedCall(500, () => {
        this.scene.start('WeaponSelectScene')
      })
    } else if (this.selectedIndex === 1) {
      // LEADERBOARD — show overlay (music keeps playing)
      this.game.registry.set('leaderboardFromMenu', true)
      this.game.registry.set('showLeaderboard', true)
    }
    // HOW TO PLAY and CREDITS can be added later
  }

  update(time) {
    // Animate demo Hinkie walking across screen
    this.demoHinkieX += 0.8
    if (this.demoHinkieX > GAME_WIDTH + 30) this.demoHinkieX = -30

    this.demoWalkTimer += 16
    if (this.demoWalkTimer > 150) {
      this.demoWalkFrame = (this.demoWalkFrame + 1) % 4
      this.demoWalkTimer = 0
    }

    this.demoGraphics.clear()
    const x = this.demoHinkieX
    const y = GAME_HEIGHT - 80
    const legOffset = this.demoWalkFrame % 2 === 0 ? 5 : -5

    // Walking Hinkie (1.5x scale, matches Player.js)
    const g = this.demoGraphics
    const armSwing = this.demoWalkFrame < 2 ? 8 : -8

    // Legs
    g.fillStyle(0x1a1a3a)
    g.fillRect(x - 15, y + 14, 12, 32 + legOffset)
    g.fillRect(x + 5, y + 14, 12, 32 - legOffset)
    // Shoes
    g.fillStyle(0x3B2314)
    g.fillRect(x - 18, y + 41 + legOffset, 15, 8)
    g.fillRect(x + 3, y + 41 - legOffset, 15, 8)
    // Body
    g.fillStyle(0x1a1a4a)
    g.fillRect(x - 21, y - 23, 41, 41)
    // Collar
    g.fillStyle(0xF0F0F0)
    g.fillRect(x - 9, y - 23, 18, 8)
    // Tie
    g.fillStyle(COLORS.RED)
    g.fillRect(x - 3, y - 23, 5, 32)
    // Arms
    g.fillStyle(0x1a1a4a)
    g.fillRect(x - 30, y - 18 + armSwing, 12, 27)
    g.fillRect(x + 18, y - 18 - armSwing, 12, 27)
    // Hands
    g.fillStyle(0xE8B090)
    g.fillRect(x - 30, y + 8 + armSwing, 12, 8)
    g.fillRect(x + 18, y + 8 - armSwing, 12, 8)
    // Head
    g.fillStyle(0xE8B090)
    g.fillRect(x - 15, y - 50, 32, 30)
    // Hair
    g.fillStyle(0x3D2517)
    g.fillRect(x - 18, y - 54, 5, 18)
    g.fillRect(x + 14, y - 54, 5, 18)
    g.fillRect(x - 14, y - 57, 27, 5)
    g.fillRect(x - 8, y - 53, 14, 3)
    // Glasses
    g.fillStyle(0x666666)
    g.fillRect(x - 12, y - 41, 9, 8)
    g.fillRect(x + 3, y - 41, 9, 8)
    g.fillStyle(0xFFFFFF)
    g.fillRect(x - 9, y - 38, 5, 3)
    g.fillRect(x + 5, y - 38, 5, 3)
    g.fillStyle(0x111111)
    g.fillRect(x - 8, y - 38, 3, 3)
    g.fillRect(x + 6, y - 38, 3, 3)
    // Mouth
    g.fillStyle(0x333333)
    g.fillRect(x - 5, y - 27, 9, 3)
  }
}
