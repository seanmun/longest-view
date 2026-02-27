export class ScoreSystem {
  constructor(scene) {
    this.scene = scene
    this.score = 0
    this.onScoreChange = null
  }

  addPoints(points, x, y, color = 0xFFFFFF) {
    const multiplier = this.scene.comboSystem ? this.scene.comboSystem.getMultiplier() : 1
    const total = points * multiplier
    this.score += total
    this.showFloatingText(total, x, y, color)
    if (this.onScoreChange) this.onScoreChange(this.score)
    return total
  }

  showFloatingText(value, x, y, color = 0xFFFFFF) {
    const text = this.scene.add.text(x, y, `+${value}`, {
      fontFamily: '"Press Start 2P"',
      fontSize: value >= 1000 ? '14px' : value >= 500 ? '12px' : '10px',
      color: '#' + color.toString(16).padStart(6, '0')
    })
    text.setOrigin(0.5)
    text.setDepth(100)

    this.scene.tweens.add({
      targets: text,
      y: y - 60,
      alpha: 0,
      duration: 1200,
      ease: 'Power2',
      onComplete: () => text.destroy()
    })
  }

  showLabelText(label, x, y, color = 0x00D4FF) {
    const text = this.scene.add.text(x, y - 20, label, {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      color: '#' + color.toString(16).padStart(6, '0')
    })
    text.setOrigin(0.5)
    text.setDepth(100)

    this.scene.tweens.add({
      targets: text,
      y: y - 80,
      alpha: 0,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => text.destroy()
    })
  }

  getScore() {
    return this.score
  }

  reset() {
    this.score = 0
    if (this.onScoreChange) this.onScoreChange(0)
  }
}
