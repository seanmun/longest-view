import Phaser from 'phaser'
import { AudioSystem } from '../systems/AudioSystem.js'
import { COLORS, GAME_WIDTH, GAME_HEIGHT, fontSize } from '../constants.js'
import { CRTBarrelPipeline } from '../pipelines/CRTBarrelPipeline.js'

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' })
  }

  init(data) {
    this.finalScore = data.score || 0
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a0a')
    this.cameras.main.setPostPipeline(CRTBarrelPipeline)
    this.cameras.main.fadeIn(500)

    AudioSystem.playGameOver()

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.2, 'GAME OVER', {
      fontFamily: '"Press Start 2P"',
      fontSize: fontSize(28),
      color: '#CC2200',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5)

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.3, `SCORE: ${this.finalScore}`, {
      fontFamily: '"Press Start 2P"',
      fontSize: fontSize(14),
      color: '#E8B800'
    }).setOrigin(0.5)

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.37, 'The Process requires patience.', {
      fontFamily: '"Press Start 2P"',
      fontSize: fontSize(8),
      color: '#888888'
    }).setOrigin(0.5)

    // Retry prompt
    const isMobile = 'ontouchstart' in window && window.innerWidth < 1024
    const retry = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.52, isMobile ? 'PRESS START TO RETRY' : 'PRESS ENTER TO RETRY', {
      fontFamily: '"Press Start 2P"',
      fontSize: fontSize(10),
      color: '#00D4FF'
    }).setOrigin(0.5)

    this.tweens.add({
      targets: retry,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: -1
    })

    const menu = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.58, 'ESC FOR MENU', {
      fontFamily: '"Press Start 2P"',
      fontSize: fontSize(8),
      color: '#666666'
    }).setOrigin(0.5)

    // MNS tagline
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 25, 'Rebuild at MoneyNeverSleeps.app', {
      fontFamily: '"Press Start 2P"',
      fontSize: fontSize(7),
      color: '#E8B800',
      alpha: 0.5
    }).setOrigin(0.5)

    this.input.keyboard.on('keydown-ENTER', () => this.retry())
    this.input.keyboard.on('keydown-ESC', () => this.goToMenu())

    // Mobile custom events
    this._onGameStart = () => this.retry()
    this._onGameSelect = () => this.goToMenu()
    window.addEventListener('game-start', this._onGameStart)
    window.addEventListener('game-select', this._onGameSelect)

    this.events.on('shutdown', () => {
      window.removeEventListener('game-start', this._onGameStart)
      window.removeEventListener('game-select', this._onGameSelect)
    })
  }

  retry() {
    AudioSystem.playMenuConfirm()
    this.cameras.main.fadeOut(300)
    this.time.delayedCall(300, () => {
      this.scene.start('CutsceneScene', { cutscene: 'level1_intro' })
    })
  }

  goToMenu() {
    AudioSystem.playMenuSelect()
    this.cameras.main.fadeOut(300)
    this.time.delayedCall(300, () => {
      this.scene.start('MainMenuScene')
    })
  }
}
