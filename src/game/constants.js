export const GAME_WIDTH = 900
export const GAME_HEIGHT = 675

export const IS_MOBILE = typeof window !== 'undefined' &&
  ('ontouchstart' in window && window.innerWidth < 1024)

// Mobile text needs to be bigger since the canvas is scaled down on small screens
export const TEXT_SCALE = IS_MOBILE ? 1.8 : 1

// Helper: returns scaled font size string for Phaser text
export function fontSize(basePx) {
  return `${Math.round(basePx * TEXT_SCALE)}px`
}

export const COLORS = {
  GOLD: 0xE8B800,
  RED: 0xCC2200,
  CYAN: 0x00D4FF,
  WHITE: 0xFFFFFF,
  NAVY: 0x0a0a2e,
  DARK: 0x0a0a1a,
  GREEN: 0x00CC44
}
