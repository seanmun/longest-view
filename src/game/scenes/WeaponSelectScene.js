import Phaser from 'phaser'
import { AudioSystem } from '../systems/AudioSystem.js'
import { COLORS, GAME_WIDTH, GAME_HEIGHT, fontSize } from '../constants.js'
import { CRTBarrelPipeline } from '../pipelines/CRTBarrelPipeline.js'

const WEAPONS = [
  {
    id: 'lotto_ball',
    name: 'LOTTO BALL',
    desc: 'FAST & LONG RANGE',
    stats: { speed: 3, range: 3, damage: 1, aoe: 0 },
    color: COLORS.WHITE,
    accentColor: COLORS.CYAN
  },
  {
    id: 'poison_pill',
    name: 'POISON PILL',
    desc: 'EXPLODES ON IMPACT',
    stats: { speed: 2, range: 1, damage: 2, aoe: 3 },
    color: COLORS.RED,
    accentColor: 0xFF6644
  },
  {
    id: 'tank',
    name: 'THE TANK',
    desc: 'SLOW BUT UNSTOPPABLE',
    stats: { speed: 1, range: 2, damage: 3, aoe: 2 },
    color: 0x003DA5,
    accentColor: COLORS.GOLD
  }
]

export class WeaponSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WeaponSelectScene' })
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a1a')
    this.cameras.main.setPostPipeline(CRTBarrelPipeline)
    this.cameras.main.fadeIn(400)

    this.selectedIndex = 0
    this.confirmed = false

    // Title
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.08, 'CHOOSE YOUR WEAPON', {
      fontFamily: '"Press Start 2P"',
      fontSize: fontSize(18),
      color: '#E8B800',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5)

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.15, 'Every process needs the right tools.', {
      fontFamily: '"Press Start 2P"',
      fontSize: fontSize(7),
      color: '#888888'
    }).setOrigin(0.5)

    // Weapon cards
    this.weaponGraphics = this.add.graphics()
    this.weaponGraphics.setDepth(5)

    // Card positions — evenly spread across width
    const cardWidth = 220
    const spacing = 260
    const startX = GAME_WIDTH / 2 - spacing

    this.cardPositions = WEAPONS.map((_, i) => ({
      x: startX + i * spacing,
      y: GAME_HEIGHT * 0.48
    }))

    // Stat labels (drawn once)
    this.statLabels = []
    WEAPONS.forEach((weapon, i) => {
      const cx = this.cardPositions[i].x
      const baseY = this.cardPositions[i].y + 68

      // Weapon name
      this.add.text(cx, this.cardPositions[i].y - 80, weapon.name, {
        fontFamily: '"Press Start 2P"',
        fontSize: fontSize(11),
        color: '#' + weapon.accentColor.toString(16).padStart(6, '0'),
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5).setDepth(10)

      // Description
      this.add.text(cx, this.cardPositions[i].y - 62, weapon.desc, {
        fontFamily: '"Press Start 2P"',
        fontSize: fontSize(6),
        color: '#AAAAAA'
      }).setOrigin(0.5).setDepth(10)

      // Stats
      const statNames = ['SPEED', 'RANGE', 'POWER', 'BLAST']
      const statKeys = ['speed', 'range', 'damage', 'aoe']

      statNames.forEach((name, si) => {
        const sy = baseY + si * 18
        this.add.text(cx - 85, sy, name, {
          fontFamily: '"Press Start 2P"',
          fontSize: fontSize(6),
          color: '#888888'
        }).setDepth(10)
      })
    })

    // Controls hint
    const isMobile = 'ontouchstart' in window && window.innerWidth < 1024
    const controlText = isMobile ? 'TAP TO SELECT  •  START TO CONFIRM' : '← → SELECT  •  ENTER TO CONFIRM'
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 25, controlText, {
      fontFamily: '"Press Start 2P"',
      fontSize: fontSize(7),
      color: '#555555'
    }).setOrigin(0.5)

    // Input
    this.input.keyboard.on('keydown-LEFT', () => this.moveSelection(-1))
    this.input.keyboard.on('keydown-RIGHT', () => this.moveSelection(1))
    this.input.keyboard.on('keydown-A', () => this.moveSelection(-1))
    this.input.keyboard.on('keydown-D', () => this.moveSelection(1))
    this.input.keyboard.on('keydown-ENTER', () => this.confirmSelection())
    this.input.keyboard.on('keydown-SPACE', () => this.confirmSelection())

    // Mobile: tap left/right halves to navigate, or use mobile events
    this.input.on('pointerdown', (pointer) => {
      AudioSystem.resume()
      if (this.confirmed) return
      const third = GAME_WIDTH / 3
      if (pointer.x < third) {
        this.moveSelection(-1)
      } else if (pointer.x > third * 2) {
        this.moveSelection(1)
      } else {
        this.confirmSelection()
      }
    })

    this._onGameStart = () => this.confirmSelection()
    window.addEventListener('game-start', this._onGameStart)
    this.events.on('shutdown', () => {
      window.removeEventListener('game-start', this._onGameStart)
    })
  }

  moveSelection(dir) {
    if (this.confirmed) return
    const prev = this.selectedIndex
    this.selectedIndex = Phaser.Math.Clamp(this.selectedIndex + dir, 0, WEAPONS.length - 1)
    if (this.selectedIndex !== prev) {
      AudioSystem.playMenuSelect()
    }
  }

  confirmSelection() {
    if (this.confirmed) return
    this.confirmed = true
    AudioSystem.playMenuConfirm()

    // Flash selected card
    const cx = this.cardPositions[this.selectedIndex].x
    const cy = this.cardPositions[this.selectedIndex].y
    const flash = this.add.rectangle(cx, cy, 230, 200, COLORS.WHITE, 0.5).setDepth(50)

    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 400,
      onComplete: () => flash.destroy()
    })

    // Store selection in registry
    this.game.registry.set('selectedWeapon', WEAPONS[this.selectedIndex].id)

    // Transition to cutscene
    this.time.delayedCall(600, () => {
      this.cameras.main.fadeOut(500, 0, 0, 0)
      this.time.delayedCall(500, () => {
        this.scene.start('CutsceneScene', { cutscene: 'level1_intro' })
      })
    })
  }

  update(time) {
    this.weaponGraphics.clear()

    WEAPONS.forEach((weapon, i) => {
      const cx = this.cardPositions[i].x
      const cy = this.cardPositions[i].y
      const isSelected = i === this.selectedIndex

      // Card background
      const alpha = isSelected ? 0.9 : 0.3
      this.weaponGraphics.fillStyle(0x1a1a2e, alpha)
      this.weaponGraphics.fillRect(cx - 110, cy - 95, 220, 200)

      // Card border
      const borderColor = isSelected ? weapon.accentColor : 0x333355
      const borderWidth = isSelected ? 2 : 1
      this.weaponGraphics.lineStyle(borderWidth, borderColor)
      this.weaponGraphics.strokeRect(cx - 110, cy - 95, 220, 200)

      // Selected glow
      if (isSelected) {
        this.weaponGraphics.fillStyle(weapon.accentColor, 0.05 + Math.sin(time / 300) * 0.03)
        this.weaponGraphics.fillRect(cx - 108, cy - 93, 216, 196)
      }

      // Draw weapon preview
      this.drawWeaponPreview(weapon.id, cx, cy - 20, isSelected, time)

      // Draw stat bars
      const statKeys = ['speed', 'range', 'damage', 'aoe']
      const baseY = cy + 68

      statKeys.forEach((key, si) => {
        const sy = baseY + si * 18
        const val = weapon.stats[key]
        const barColor = isSelected ? weapon.accentColor : 0x555555

        // Bar background
        this.weaponGraphics.fillStyle(0x222233)
        this.weaponGraphics.fillRect(cx - 20, sy + 1, 90, 8)

        // Bar fill
        this.weaponGraphics.fillStyle(barColor)
        this.weaponGraphics.fillRect(cx - 20, sy + 1, (val / 3) * 90, 8)
      })

      // Selection arrow
      if (isSelected) {
        const arrowBob = Math.sin(time / 200) * 3
        this.weaponGraphics.fillStyle(COLORS.GOLD)
        // Triangle pointing down above card
        this.weaponGraphics.fillTriangle(
          cx - 8, cy - 105 + arrowBob,
          cx + 8, cy - 105 + arrowBob,
          cx, cy - 95 + arrowBob
        )
      }
    })
  }

  drawWeaponPreview(weaponId, x, y, isSelected, time) {
    const g = this.weaponGraphics

    if (weaponId === 'lotto_ball') {
      // Ping pong ball — bouncing animation when selected
      const bounce = isSelected ? Math.abs(Math.sin(time / 250)) * 10 : 0
      const ballY = y - bounce

      // Glow
      if (isSelected) {
        g.fillStyle(COLORS.CYAN, 0.2)
        g.fillCircle(x, ballY, 22)
      }

      // Ball
      g.fillStyle(COLORS.WHITE)
      g.fillCircle(x, ballY, 14)

      // Seam
      g.lineStyle(1, 0xCCCCCC)
      g.beginPath()
      g.arc(x, ballY, 9, 0, Math.PI)
      g.strokePath()

      // Trail when selected
      if (isSelected) {
        for (let t = 1; t <= 3; t++) {
          g.fillStyle(COLORS.WHITE, 0.3 - t * 0.08)
          g.fillCircle(x - t * 12, ballY + t * 4, 14 - t * 2)
        }
      }

    } else if (weaponId === 'poison_pill') {
      // Rolled up contract / poison pill
      const pulse = isSelected ? Math.sin(time / 300) * 2 : 0

      // Glow
      if (isSelected) {
        g.fillStyle(COLORS.RED, 0.15)
        g.fillCircle(x, y, 28 + pulse)
      }

      // Contract roll (cylinder shape)
      g.fillStyle(0xF5E6C8) // parchment
      g.fillRect(x - 14, y - 10, 28, 20)

      // Roll ends
      g.fillStyle(0xE8D5B0)
      g.fillCircle(x - 14, y, 10)
      g.fillCircle(x + 14, y, 10)

      // Text on contract
      g.fillStyle(0x333333)
      g.fillRect(x - 8, y - 6, 16, 2)
      g.fillRect(x - 8, y - 2, 12, 2)
      g.fillRect(x - 8, y + 2, 14, 2)

      // Poison skull symbol
      g.fillStyle(COLORS.RED)
      g.fillCircle(x, y - 18, 5)
      g.fillRect(x - 2, y - 14, 4, 5)
      // Crossbones
      g.fillRect(x - 6, y - 11, 12, 2)

      // Explosion particles when selected
      if (isSelected) {
        const numParticles = 6
        for (let p = 0; p < numParticles; p++) {
          const angle = (time / 500 + p * (Math.PI * 2 / numParticles))
          const dist = 22 + pulse
          const px = x + Math.cos(angle) * dist
          const py = y + Math.sin(angle) * dist
          g.fillStyle(0xFF4400, 0.6)
          g.fillCircle(px, py, 3)
        }
      }

    } else if (weaponId === 'tank') {
      // Tank — based on CharacterDesignPage drawTank
      const rumble = isSelected ? Math.sin(time / 80) * 1 : 0

      // Treads
      g.fillStyle(0x333333)
      g.fillRect(x - 30, y + 12 + rumble, 60, 12)
      g.fillStyle(0x222222)
      for (let t = 0; t < 7; t++) {
        g.fillRect(x - 27 + t * 9, y + 14 + rumble, 6, 8)
      }
      g.fillStyle(0x444444)
      g.fillRect(x - 30, y + 12 + rumble, 60, 2)
      g.fillRect(x - 30, y + 22 + rumble, 60, 2)

      // Hull (76ers blue)
      g.fillStyle(0x003DA5)
      g.fillRect(x - 27, y - 6 + rumble, 54, 20)

      // Red stripe
      g.fillStyle(COLORS.RED)
      g.fillRect(x - 27, y - 1 + rumble, 54, 3)

      // Turret
      g.fillStyle(0x003DA5)
      g.fillRect(x - 15, y - 22 + rumble, 27, 18)
      g.fillStyle(0x002277)
      g.fillRect(x - 15, y - 22 + rumble, 27, 3)

      // Barrel
      g.fillStyle(0x444444)
      g.fillRect(x + 12, y - 16 + rumble, 24, 6)
      g.fillStyle(0x555555)
      g.fillRect(x + 33, y - 17 + rumble, 5, 8)

      // 76ers star on hull
      g.fillStyle(COLORS.GOLD)
      g.fillRect(x - 10, y + 1 + rumble, 6, 6)
      g.fillRect(x - 9, y + rumble, 4, 2)
      g.fillRect(x - 9, y + 7 + rumble, 4, 2)
      g.fillRect(x - 12, y + 3 + rumble, 2, 3)
      g.fillRect(x - 4, y + 3 + rumble, 2, 3)

      // TTP text
      g.fillStyle(COLORS.WHITE)
      g.fillRect(x + 6, y + 1 + rumble, 8, 2)
      g.fillRect(x + 9, y + 3 + rumble, 2, 4)

      // Tread movement animation when selected
      if (isSelected) {
        const treadOffset = Math.floor(time / 100) % 3
        g.fillStyle(0x555555, 0.5)
        for (let t = 0; t < 3; t++) {
          g.fillRect(x - 27 + (t * 9 + treadOffset * 3) % 60, y + 15 + rumble, 3, 6)
        }
      }
    }
  }
}
