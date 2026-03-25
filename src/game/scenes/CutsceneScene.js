import Phaser from 'phaser'
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../constants.js'
import { CRTBarrelPipeline } from '../pipelines/CRTBarrelPipeline.js'

const CUTSCENES = {
  level1_intro: {
    nextScene: 'Level1Scene',
    nextData: {},
    lines: [
      { type: 'text', text: 'Philadelphia, 2013.', delay: 1500 },
      { type: 'text', text: 'Sam Hinkie has a plan.', delay: 1500 },
      { type: 'text', text: 'Nobody else understands it yet.', delay: 2000 },
      { type: 'action', action: 'hinkie_enter', delay: 2000 },
      { type: 'text', text: '"..."', delay: 1000 },
      { type: 'action', action: 'hinkie_glasses', delay: 1500 },
      { type: 'text', text: '"Let\'s begin."', delay: 1500 },
    ]
  }
}

export class CutsceneScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CutsceneScene' })
  }

  init(data) {
    this.cutsceneKey = data.cutscene || 'level1_intro'
    this.nextSceneData = data.nextData || {}
  }

  create() {
    this.cameras.main.setBackgroundColor('#000000')
    this.cameras.main.setPostPipeline(CRTBarrelPipeline)
    this.cameras.main.fadeIn(500)

    const cutscene = CUTSCENES[this.cutsceneKey]
    if (!cutscene) {
      this.scene.start('Level1Scene')
      return
    }

    this.lineIndex = 0
    this.lines = cutscene.lines
    this.nextScene = cutscene.nextScene
    this.textObjects = []
    this.hinkieGraphics = this.add.graphics()
    this.hinkieGraphics.setDepth(10)
    this.hinkieVisible = false
    this.hinkieX = -30
    this.hinkieTargetX = GAME_WIDTH / 2

    // Skip instruction
    this.add.text(GAME_WIDTH - 20, GAME_HEIGHT - 15, 'ESC TO SKIP', {
      fontFamily: '"Press Start 2P"',
      fontSize: '6px',
      color: '#444444'
    }).setOrigin(1, 0.5)

    // Skip handler
    this.input.keyboard.on('keydown-ESC', () => this.skipCutscene())
    this.input.keyboard.on('keydown-ENTER', () => this.skipCutscene())

    // Mobile custom events
    this._onGameStart = () => this.skipCutscene()
    this._onGameSelect = () => this.skipCutscene()
    window.addEventListener('game-start', this._onGameStart)
    window.addEventListener('game-select', this._onGameSelect)

    this.events.on('shutdown', () => {
      window.removeEventListener('game-start', this._onGameStart)
      window.removeEventListener('game-select', this._onGameSelect)
    })

    // Start showing lines
    this.showNextLine()
  }

  showNextLine() {
    if (this.lineIndex >= this.lines.length) {
      // Cutscene done — transition
      this.time.delayedCall(1000, () => {
        this.cameras.main.fadeOut(500, 0, 0, 0)
        this.time.delayedCall(500, () => {
          this.scene.start(this.nextScene, this.nextSceneData)
        })
      })
      return
    }

    const line = this.lines[this.lineIndex]
    this.lineIndex++

    if (line.type === 'text') {
      this.typewriterText(line.text, line.delay)
    } else if (line.type === 'action') {
      this.handleAction(line.action, line.delay)
    }
  }

  typewriterText(text, delay) {
    const yPos = GAME_HEIGHT * 0.22 + this.textObjects.length * 35
    const textObj = this.add.text(GAME_WIDTH / 2, yPos, '', {
      fontFamily: '"Press Start 2P"',
      fontSize: '12px',
      color: '#FFFFFF',
      wordWrap: { width: 700 }
    }).setOrigin(0.5)
    textObj.setDepth(20)
    this.textObjects.push(textObj)

    let charIndex = 0
    const timer = this.time.addEvent({
      delay: 40,
      callback: () => {
        charIndex++
        textObj.setText(text.substring(0, charIndex))
        if (charIndex >= text.length) {
          timer.remove()
          this.time.delayedCall(delay, () => this.showNextLine())
        }
      },
      loop: true
    })
  }

  handleAction(action, delay) {
    if (action === 'hinkie_enter') {
      this.hinkieVisible = true
      this.hinkieX = -30
      this.tweens.add({
        targets: this,
        hinkieX: GAME_WIDTH / 2,
        duration: 1500,
        ease: 'Power2',
        onComplete: () => {
          this.time.delayedCall(delay, () => this.showNextLine())
        }
      })
    } else if (action === 'hinkie_glasses') {
      // Quick glasses adjust animation
      this.time.delayedCall(delay, () => this.showNextLine())
    } else {
      this.time.delayedCall(delay, () => this.showNextLine())
    }
  }

  skipCutscene() {
    const cutscene = CUTSCENES[this.cutsceneKey]
    this.cameras.main.fadeOut(300, 0, 0, 0)
    this.time.delayedCall(300, () => {
      this.scene.start(cutscene ? cutscene.nextScene : 'Level1Scene')
    })
  }

  update() {
    this.hinkieGraphics.clear()
    if (!this.hinkieVisible) return

    const x = this.hinkieX
    const y = GAME_HEIGHT - 120

    // Draw Hinkie (same as Player.js standing pose)
    const g = this.hinkieGraphics

    // Legs
    g.fillStyle(0x1a1a3a)
    g.fillRect(x - 10, y + 9, 8, 21)
    g.fillRect(x + 3, y + 9, 8, 21)

    // Shoes (dark brown dress shoes)
    g.fillStyle(0x3B2314)
    g.fillRect(x - 12, y + 27, 10, 5)
    g.fillRect(x + 2, y + 27, 10, 5)

    // Body (suit jacket)
    g.fillStyle(0x1a1a4a)
    g.fillRect(x - 14, y - 15, 27, 27)

    // White dress shirt collar
    g.fillStyle(0xF0F0F0)
    g.fillRect(x - 6, y - 15, 12, 5)

    // Tie
    g.fillStyle(COLORS.RED)
    g.fillRect(x - 2, y - 15, 3, 21)

    // Arms
    g.fillStyle(0x1a1a4a)
    g.fillRect(x - 20, y - 12, 8, 18)
    g.fillRect(x + 12, y - 12, 8, 18)

    // Hands
    g.fillStyle(0xE8B090)
    g.fillRect(x - 20, y + 5, 8, 5)
    g.fillRect(x + 12, y + 5, 8, 5)

    // Head
    g.fillStyle(0xE8B090)
    g.fillRect(x - 10, y - 33, 21, 20)

    // Hair (receding hairline — sides fuller, top thinning at front)
    g.fillStyle(0x3D2517)
    g.fillRect(x - 12, y - 36, 3, 12)
    g.fillRect(x + 9, y - 36, 3, 12)
    g.fillRect(x - 9, y - 38, 18, 3)
    g.fillRect(x - 5, y - 35, 9, 2)

    // Glasses (regular frames with visible eyes)
    g.fillStyle(0x666666)
    g.fillRect(x - 8, y - 27, 6, 5)
    g.fillRect(x + 2, y - 27, 6, 5)
    g.fillStyle(0xFFFFFF)
    g.fillRect(x - 6, y - 25, 3, 2)
    g.fillRect(x + 3, y - 25, 3, 2)
    g.fillStyle(0x111111)
    g.fillRect(x - 5, y - 25, 2, 2)
    g.fillRect(x + 4, y - 25, 2, 2)

    // Mouth
    g.fillStyle(0x333333)
    g.fillRect(x - 3, y - 18, 6, 2)
  }
}
