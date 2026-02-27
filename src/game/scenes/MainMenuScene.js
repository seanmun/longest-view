import Phaser from 'phaser'
import { AudioSystem } from '../systems/AudioSystem.js'
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../constants.js'

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' })
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a1a')

    // Start menu music
    AudioSystem.resume()
    AudioSystem.playMenuMusic()

    // Title
    this.add.text(GAME_WIDTH / 2, 80, 'LONGEST VIEW', {
      fontFamily: '"Press Start 2P"',
      fontSize: '32px',
      color: '#E8B800',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5)

    this.add.text(GAME_WIDTH / 2, 120, "SAM HINKIE'S REVENGE", {
      fontFamily: '"Press Start 2P"',
      fontSize: '14px',
      color: '#FFFFFF'
    }).setOrigin(0.5)

    // Blinking "INSERT COIN" text
    const insertCoin = this.add.text(GAME_WIDTH / 2, 200, 'PRESS ENTER TO START', {
      fontFamily: '"Press Start 2P"',
      fontSize: '12px',
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
    const menuItems = ['PLAY', 'HOW TO PLAY', 'CREDITS']
    this.selectedIndex = 0
    this.menuTexts = []

    menuItems.forEach((item, i) => {
      const text = this.add.text(GAME_WIDTH / 2, 250 + i * 30, item, {
        fontFamily: '"Press Start 2P"',
        fontSize: '10px',
        color: i === 0 ? '#E8B800' : '#666666'
      }).setOrigin(0.5)
      this.menuTexts.push(text)
    })

    // MNS.COM at bottom
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 20, 'MNS.COM', {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
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
    AudioSystem.stopMusic()

    if (this.selectedIndex === 0) {
      // PLAY — go to opening cutscene
      this.cameras.main.fadeOut(500, 0, 0, 0)
      this.time.delayedCall(500, () => {
        this.scene.start('CutsceneScene', { cutscene: 'level1_intro' })
      })
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
    const y = GAME_HEIGHT - 40
    const legOffset = this.demoWalkFrame % 2 === 0 ? 2 : -2

    // Small walking Hinkie
    // Legs
    this.demoGraphics.fillStyle(0x1a1a3a)
    this.demoGraphics.fillRect(x - 4, y + 4, 3, 10 + legOffset)
    this.demoGraphics.fillRect(x + 1, y + 4, 3, 10 - legOffset)
    // Body
    this.demoGraphics.fillStyle(0x1a1a4a)
    this.demoGraphics.fillRect(x - 5, y - 6, 10, 12)
    // Tie
    this.demoGraphics.fillStyle(COLORS.RED)
    this.demoGraphics.fillRect(x - 1, y - 4, 2, 7)
    // Head
    this.demoGraphics.fillStyle(0xE8B090)
    this.demoGraphics.fillRect(x - 4, y - 14, 8, 9)
    // Bald head — skin top with shine
    this.demoGraphics.fillStyle(0xE8B090)
    this.demoGraphics.fillRect(x - 4, y - 16, 8, 2)
    this.demoGraphics.fillStyle(0xF0C8A0, 0.5)
    this.demoGraphics.fillRect(x - 2, y - 16, 4, 1)
    // Glasses
    this.demoGraphics.fillStyle(0x333333)
    this.demoGraphics.fillRect(x - 3, y - 12, 3, 2)
    this.demoGraphics.fillRect(x + 1, y - 12, 3, 2)
  }
}
