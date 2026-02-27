import Phaser from 'phaser'
import { AudioSystem } from '../systems/AudioSystem.js'

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  create() {
    // Initialize audio system
    AudioSystem.init()

    // Show loading text
    const text = this.add.text(450, 200, 'LOADING...', {
      fontFamily: '"Press Start 2P"',
      fontSize: '16px',
      color: '#E8B800'
    })
    text.setOrigin(0.5)

    // Brief delay then go to menu
    this.time.delayedCall(500, () => {
      this.scene.start('MainMenuScene')
    })
  }
}
