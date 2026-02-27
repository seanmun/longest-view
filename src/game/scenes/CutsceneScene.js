import Phaser from 'phaser'
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../constants.js'

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
    const yPos = 120 + this.textObjects.length * 35
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
    const y = GAME_HEIGHT - 80

    // Draw Hinkie (larger version for cutscene)
    // Legs
    this.hinkieGraphics.fillStyle(0x1a1a3a)
    this.hinkieGraphics.fillRect(x - 8, y + 8, 6, 18)
    this.hinkieGraphics.fillRect(x + 2, y + 8, 6, 18)
    // Shoes
    this.hinkieGraphics.fillStyle(0x222222)
    this.hinkieGraphics.fillRect(x - 9, y + 24, 8, 4)
    this.hinkieGraphics.fillRect(x + 1, y + 24, 8, 4)
    // White stripe on shoes
    this.hinkieGraphics.fillStyle(0xFFFFFF)
    this.hinkieGraphics.fillRect(x - 9, y + 24, 8, 1)
    this.hinkieGraphics.fillRect(x + 1, y + 24, 8, 1)
    // Body
    this.hinkieGraphics.fillStyle(0x1a1a4a)
    this.hinkieGraphics.fillRect(x - 11, y - 14, 22, 24)
    // Tie
    this.hinkieGraphics.fillStyle(COLORS.RED)
    this.hinkieGraphics.fillRect(x - 1, y - 10, 3, 16)
    // Arms
    this.hinkieGraphics.fillStyle(0x1a1a4a)
    this.hinkieGraphics.fillRect(x - 16, y - 12, 6, 16)
    this.hinkieGraphics.fillRect(x + 10, y - 12, 6, 16)
    // Hands
    this.hinkieGraphics.fillStyle(0xE8B090)
    this.hinkieGraphics.fillRect(x - 16, y + 3, 6, 4)
    this.hinkieGraphics.fillRect(x + 10, y + 3, 6, 4)
    // Head
    this.hinkieGraphics.fillStyle(0xE8B090)
    this.hinkieGraphics.fillRect(x - 9, y - 30, 18, 17)
    // Bald head — skin top with shine
    this.hinkieGraphics.fillStyle(0xE8B090)
    this.hinkieGraphics.fillRect(x - 9, y - 33, 18, 4)
    this.hinkieGraphics.fillStyle(0xF0C8A0, 0.5)
    this.hinkieGraphics.fillRect(x - 4, y - 33, 8, 1)
    // Glasses
    this.hinkieGraphics.fillStyle(0x333333)
    this.hinkieGraphics.fillRect(x - 7, y - 25, 5, 4)
    this.hinkieGraphics.fillRect(x + 2, y - 25, 5, 4)
    this.hinkieGraphics.fillRect(x - 2, y - 24, 4, 1)
  }
}
