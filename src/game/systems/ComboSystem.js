import { AudioSystem } from './AudioSystem.js'
import { COLORS } from '../constants.js'

export class ComboSystem {
  constructor(scene) {
    this.scene = scene
    this.hits = 0
    this.multiplier = 1
    this.trustTheProcess = false
    this.trustTimer = null
    this.onComboChange = null
    this.onTrustTheProcess = null
  }

  addHit() {
    this.hits++

    if (this.hits >= 15 && !this.trustTheProcess) {
      this.activateTrustTheProcess()
    } else if (this.hits >= 10) {
      this.multiplier = 5
    } else if (this.hits >= 6) {
      this.multiplier = 3
    } else if (this.hits >= 3) {
      this.multiplier = 2
      if (this.hits === 3) AudioSystem.playCombo()
    }

    if (this.onComboChange) {
      this.onComboChange(this.hits, this.multiplier, this.trustTheProcess)
    }
  }

  activateTrustTheProcess() {
    this.trustTheProcess = true
    this.multiplier = 10
    AudioSystem.playTrustTheProcess()

    // Show "TRUST THE PROCESS" text
    const text = this.scene.add.text(
      this.scene.cameras.main.scrollX + 450, 200,
      'TRUST THE PROCESS',
      {
        fontFamily: '"Press Start 2P"',
        fontSize: '24px',
        color: '#E8B800',
        stroke: '#000000',
        strokeThickness: 4
      }
    )
    text.setOrigin(0.5)
    text.setDepth(200)

    this.scene.tweens.add({
      targets: text,
      scaleX: 1.3,
      scaleY: 1.3,
      alpha: 0,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => text.destroy()
    })

    // Gold screen pulse
    const flash = this.scene.add.rectangle(
      this.scene.cameras.main.scrollX + 450, 200, 900, 400, COLORS.GOLD, 0.2
    )
    flash.setDepth(150)
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 500,
      yoyo: true,
      repeat: 4,
      onComplete: () => flash.destroy()
    })

    if (this.onTrustTheProcess) this.onTrustTheProcess(true)

    // End after 10 seconds
    this.trustTimer = this.scene.time.delayedCall(10000, () => {
      this.trustTheProcess = false
      this.multiplier = this.hits >= 10 ? 5 : this.hits >= 6 ? 3 : this.hits >= 3 ? 2 : 1
      if (this.onTrustTheProcess) this.onTrustTheProcess(false)
    })
  }

  breakCombo() {
    this.hits = 0
    this.multiplier = 1
    if (this.trustTheProcess) {
      this.trustTheProcess = false
      if (this.trustTimer) this.trustTimer.remove()
      if (this.onTrustTheProcess) this.onTrustTheProcess(false)
    }
    if (this.onComboChange) this.onComboChange(0, 1, false)
  }

  getMultiplier() {
    return this.multiplier
  }

  getHits() {
    return this.hits
  }
}
