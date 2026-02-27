import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene.js'
import { MainMenuScene } from './scenes/MainMenuScene.js'
import { Level1Scene } from './scenes/Level1Scene.js'
import { CutsceneScene } from './scenes/CutsceneScene.js'
import { GameOverScene } from './scenes/GameOverScene.js'
import { GAME_WIDTH, GAME_HEIGHT } from './constants.js'

// Re-export for convenience
export { GAME_WIDTH, GAME_HEIGHT, COLORS } from './constants.js'

export const createGameConfig = (parent) => ({
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent,
  backgroundColor: '#0a0a1a',
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 800 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MainMenuScene, CutsceneScene, Level1Scene, GameOverScene]
})
