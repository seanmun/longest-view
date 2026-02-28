import { useEffect, useRef, useLayoutEffect } from 'react'

const SCALE = 4
const COLORS = {
  GOLD: '#E8B800',
  RED: '#CC2200',
  CYAN: '#00D4FF',
  WHITE: '#FFFFFF',
  NAVY: '#0a0a2e',
  DARK: '#0a0a1a'
}

// --- Canvas2D drawing helpers ---
function hexNum(n, alpha = 1) {
  const r = (n >> 16) & 0xFF
  const g = (n >> 8) & 0xFF
  const b = n & 0xFF
  return alpha < 1
    ? `rgba(${r},${g},${b},${alpha})`
    : `rgb(${r},${g},${b})`
}

function fillRect(ctx, x, y, w, h) { ctx.fillRect(x, y, w, h) }
function fillCircle(ctx, x, y, r) {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
}
function setFill(ctx, color, alpha = 1) {
  ctx.fillStyle = typeof color === 'number' ? hexNum(color, alpha) : color
}

// --- Character Drawing Functions ---

// --- HINKIE (Nintendo/Sega style: no glasses, blue shirt, eyebrows, blue eyes) ---

function drawHinkieV2Standing(ctx, x, y, walkFrame = 0) {
  const legOffset = walkFrame % 2 === 0 ? 2 : -2

  // Legs (dark suit pants)
  setFill(ctx, 0x1a1a3a)
  fillRect(ctx, x - 7, y + 6, 5, 14 + legOffset)
  fillRect(ctx, x + 2, y + 6, 5, 14 - legOffset)

  // Shoes (dark brown dress shoes)
  setFill(ctx, 0x3B2314)
  fillRect(ctx, x - 8, y + 18 + legOffset, 7, 3)
  fillRect(ctx, x + 1, y + 18 - legOffset, 7, 3)

  // Body (dark navy/black suit jacket)
  setFill(ctx, 0x141428)
  fillRect(ctx, x - 9, y - 10, 18, 18)

  // Suit jacket lapels (subtle darker edge)
  setFill(ctx, 0x0e0e1e)
  fillRect(ctx, x - 9, y - 10, 2, 16)
  fillRect(ctx, x + 7, y - 10, 2, 16)

  // Light blue dress shirt (visible at chest/collar, no tie)
  setFill(ctx, 0x7BB8E0)
  fillRect(ctx, x - 4, y - 10, 8, 14)

  // Shirt collar notch
  setFill(ctx, 0x9CCEF0)
  fillRect(ctx, x - 3, y - 10, 6, 2)

  // Shirt button
  setFill(ctx, 0xFFFFFF)
  fillRect(ctx, x, y - 4, 1, 1)

  // Arms
  const armSwing = walkFrame < 2 ? 3 : -3
  setFill(ctx, 0x141428)
  fillRect(ctx, x - 13, y - 8 + armSwing, 5, 12)
  fillRect(ctx, x + 8, y - 8 - armSwing, 5, 12)

  // Hands (skin tone — fists)
  setFill(ctx, 0xE8B090)
  fillRect(ctx, x - 13, y + 3 + armSwing, 5, 4)
  fillRect(ctx, x + 8, y + 3 - armSwing, 5, 4)

  // Head (skin extends up to hairline so forehead shows where hair recedes)
  setFill(ctx, 0xE8B090)
  fillRect(ctx, x - 8, y - 26, 16, 17)

  // Hair — fuller on top, receding on his left (our right)
  setFill(ctx, 0x3D2517)
  fillRect(ctx, x - 1, y - 30, 4, 1)
  fillRect(ctx, x - 3, y - 29, 8, 1)
  fillRect(ctx, x - 6, y - 28, 13, 1)
  fillRect(ctx, x - 8, y - 27, 17, 1)
  fillRect(ctx, x - 9, y - 26, 14, 1)
  fillRect(ctx, x + 6, y - 26, 4, 3)
  fillRect(ctx, x - 9, y - 25, 12, 1)
  fillRect(ctx, x - 9, y - 24, 2, 7)
  fillRect(ctx, x - 5, y - 24, 5, 1)
  fillRect(ctx, x + 7, y - 23, 3, 2)
  fillRect(ctx, x + 8, y - 21, 2, 1)
  fillRect(ctx, x + 9, y - 20, 1, 3)
  // Eyebrows
  fillRect(ctx, x - 5, y - 19, 4, 1)
  fillRect(ctx, x + 2, y - 19, 4, 1)

  // Ear/sideburn detail
  setFill(ctx, 0xCC8866)
  fillRect(ctx, x + 8, y - 20, 1, 3)

  // Eyes — blue with white sclera (no glasses)
  setFill(ctx, 0xFFFFFF)
  fillRect(ctx, x - 5, y - 17, 4, 3)
  fillRect(ctx, x + 2, y - 17, 4, 3)
  // Blue iris
  setFill(ctx, 0x2266CC)
  fillRect(ctx, x - 3, y - 17, 2, 2)
  fillRect(ctx, x + 3, y - 17, 2, 2)
  // Pupil
  setFill(ctx, 0x111111)
  fillRect(ctx, x - 3, y - 16, 1, 1)
  fillRect(ctx, x + 4, y - 16, 1, 1)

  // Nose (subtle)
  setFill(ctx, 0xD8A080)
  fillRect(ctx, x, y - 14, 2, 2)

  // Mouth (confident smirk)
  setFill(ctx, 0x995533)
  fillRect(ctx, x - 2, y - 11, 5, 1)
  setFill(ctx, 0xCC8866)
  fillRect(ctx, x + 2, y - 12, 2, 1)

  // Stubble
  setFill(ctx, 0xC09878)
  fillRect(ctx, x - 3, y - 11, 1, 1)
}

function drawHinkieV2Ducking(ctx, x, y) {
  // Legs (bent)
  setFill(ctx, 0x1a1a3a)
  fillRect(ctx, x - 8, y + 10, 6, 6)
  fillRect(ctx, x + 2, y + 10, 6, 6)

  // Shoes
  setFill(ctx, 0x3B2314)
  fillRect(ctx, x - 9, y + 15, 8, 3)
  fillRect(ctx, x + 1, y + 15, 8, 3)

  // Body (squished)
  setFill(ctx, 0x141428)
  fillRect(ctx, x - 9, y - 2, 18, 14)

  // Lapels
  setFill(ctx, 0x0e0e1e)
  fillRect(ctx, x - 9, y - 2, 2, 12)
  fillRect(ctx, x + 7, y - 2, 2, 12)

  // Light blue shirt
  setFill(ctx, 0x7BB8E0)
  fillRect(ctx, x - 4, y - 2, 8, 10)

  // Shirt collar
  setFill(ctx, 0x9CCEF0)
  fillRect(ctx, x - 3, y - 2, 6, 2)

  // Arms (tucked)
  setFill(ctx, 0x141428)
  fillRect(ctx, x - 13, y, 5, 8)
  fillRect(ctx, x + 8, y, 5, 8)

  // Hands
  setFill(ctx, 0xE8B090)
  fillRect(ctx, x - 13, y + 7, 5, 4)
  fillRect(ctx, x + 8, y + 7, 5, 4)

  // Head (skin extends up so forehead shows where hair recedes)
  setFill(ctx, 0xE8B090)
  fillRect(ctx, x - 8, y - 19, 16, 18)

  // Hair — receding on his left (our right), fuller on his right (our left)
  setFill(ctx, 0x3D2517)
  // Our left side (his right) — fuller, comes down lower
  fillRect(ctx, x - 9, y - 19, 8, 5)
  fillRect(ctx, x - 9, y - 15, 2, 6)
  // Top connecting across
  fillRect(ctx, x - 1, y - 19, 5, 3)
  // Our right side (his left) — receding, sits higher
  fillRect(ctx, x + 4, y - 19, 6, 3)
  fillRect(ctx, x + 8, y - 17, 2, 8)
  // Eyebrows
  setFill(ctx, 0x3D2517)
  fillRect(ctx, x - 5, y - 11, 4, 1)
  fillRect(ctx, x + 2, y - 11, 4, 1)

  // Eyes — blue
  setFill(ctx, 0xFFFFFF)
  fillRect(ctx, x - 5, y - 9, 4, 3)
  fillRect(ctx, x + 2, y - 9, 4, 3)
  setFill(ctx, 0x2266CC)
  fillRect(ctx, x - 3, y - 9, 2, 2)
  fillRect(ctx, x + 3, y - 9, 2, 2)
  setFill(ctx, 0x111111)
  fillRect(ctx, x - 3, y - 8, 1, 1)
  fillRect(ctx, x + 4, y - 8, 1, 1)

  // Nose
  setFill(ctx, 0xD8A080)
  fillRect(ctx, x, y - 6, 2, 2)

  // Mouth (smirk)
  setFill(ctx, 0x995533)
  fillRect(ctx, x - 2, y - 3, 5, 1)
  setFill(ctx, 0xCC8866)
  fillRect(ctx, x + 2, y - 4, 2, 1)

  // Stubble
  setFill(ctx, 0xC09878)
  fillRect(ctx, x - 3, y - 3, 1, 1)
  fillRect(ctx, x + 4, y - 3, 1, 1)
  fillRect(ctx, x - 1, y - 2, 1, 1)
  fillRect(ctx, x + 2, y - 2, 1, 1)
}

function drawFanEnemy(ctx, x, y, variant, walkFrame, isThrowing, isStunned) {
  if (isStunned) {
    setFill(ctx, 0xE8B800)
    fillRect(ctx, x - 6, y - 28, 3, 3)
    fillRect(ctx, x + 4, y - 30, 3, 3)
  }

  const legOffset = walkFrame % 2 === 0 ? 2 : -2

  // Legs (jeans)
  setFill(ctx, 0x3344AA)
  fillRect(ctx, x - 6, y + 4, 5, 12 + legOffset)
  fillRect(ctx, x + 1, y + 4, 5, 12 - legOffset)

  // Shoes
  setFill(ctx, 0x888888)
  fillRect(ctx, x - 7, y + 14 + legOffset, 7, 3)
  fillRect(ctx, x, y + 14 - legOffset, 7, 3)

  // Body (jersey)
  const jerseyColor = variant === 'fast' ? 0xCC2200 : 0x003DA5
  setFill(ctx, jerseyColor)
  fillRect(ctx, x - 8, y - 10, 16, 16)

  // Jersey number mark
  setFill(ctx, 0xFFFFFF)
  fillRect(ctx, x - 2, y - 6, 4, 5)

  // Arms
  const armSwing = walkFrame < 2 ? 2 : -2
  setFill(ctx, jerseyColor)
  fillRect(ctx, x - 12, y - 8 + armSwing, 5, 10)
  fillRect(ctx, x + 7, y - 8 - armSwing, 5, 10)

  // Hands
  setFill(ctx, 0xE8B090)
  fillRect(ctx, x - 12, y + 1 + armSwing, 5, 3)
  fillRect(ctx, x + 7, y + 1 - armSwing, 5, 3)

  // Head
  setFill(ctx, 0xE8B090)
  fillRect(ctx, x - 6, y - 20, 12, 11)

  // Hat (backwards cap)
  setFill(ctx, 0xCC2200)
  fillRect(ctx, x - 7, y - 23, 14, 5)

  // Angry eyes
  setFill(ctx, 0x000000)
  fillRect(ctx, x - 4, y - 16, 3, 2)
  fillRect(ctx, x + 1, y - 16, 3, 2)

  // Angry mouth
  setFill(ctx, 0x000000)
  fillRect(ctx, x - 3, y - 12, 6, 2)

  // Snowball in hand
  if (isThrowing) {
    setFill(ctx, 0xFFFFFF)
    fillCircle(ctx, x + 14, y - 6, 3)
  }
}

function drawBall(ctx, x, y, tier) {
  const radius = tier === 2 ? 6 : tier === 1 ? 5 : 4

  if (tier >= 1) {
    const glowColor = tier === 2 ? 0xE8B800 : 0x00D4FF
    setFill(ctx, glowColor, 0.3)
    fillCircle(ctx, x, y, radius + 3)
  }

  setFill(ctx, 0xFFFFFF)
  fillCircle(ctx, x, y, radius)

  ctx.strokeStyle = hexNum(0xCCCCCC)
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(x, y, radius * 0.6, 0, Math.PI)
  ctx.stroke()
}

function drawLottoBalls(ctx, x, y) {
  const positions = [
    { bx: x - 8, by: y - 7, num: '1' },
    { bx: x + 8, by: y - 7, num: '2' },
    { bx: x - 8, by: y + 7, num: '3' },
    { bx: x + 8, by: y + 7, num: '4' },
  ]
  for (const { bx, by, num } of positions) {
    // ball body
    setFill(ctx, 0xFFFFFF)
    fillCircle(ctx, bx, by, 5)
    // subtle shadow arc
    ctx.strokeStyle = hexNum(0xCCCCCC)
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(bx, by, 3, 0, Math.PI)
    ctx.stroke()
    // number
    ctx.fillStyle = hexNum(0x222222)
    ctx.font = 'bold 7px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(num, bx, by + 0.5)
  }
}

function drawSnowball(ctx, x, y) {
  setFill(ctx, 0xFFFFFF)
  fillCircle(ctx, x, y, 4)
  setFill(ctx, 0xDDEEFF, 0.6)
  fillCircle(ctx, x - 1, y - 1, 1)
  fillCircle(ctx, x + 2, y + 1, 1)
}

// --- BRYAN COLANGELO (Boss — big collar, throws collar boomerangs) ---

function drawColangelo(ctx, x, y, walkFrame = 0) {
  const legOffset = walkFrame % 2 === 0 ? 2 : -2
  const armSwing = walkFrame < 2 ? 3 : -3

  // Legs (animated)
  setFill(ctx, 0x2A2A3A)
  fillRect(ctx, x - 7, y + 8, 5, 10 + legOffset)
  fillRect(ctx, x + 2, y + 8, 5, 10 - legOffset)

  // Shoes (animated)
  setFill(ctx, 0x1A1A1A)
  fillRect(ctx, x - 8, y + 18 + legOffset, 7, 3)
  fillRect(ctx, x + 1, y + 18 - legOffset, 7, 3)

  // Body suit
  setFill(ctx, 0x2A2A3A)
  fillRect(ctx, x - 7, y - 9, 3, 13)
  fillRect(ctx, x + 4, y - 9, 3, 13)
  fillRect(ctx, x - 7, y + 4, 14, 2)
  fillRect(ctx, x - 8, y + 6, 17, 2)

  // Lapels
  setFill(ctx, 0x1E1E2E)
  fillRect(ctx, x - 9, y - 10, 2, 5)
  fillRect(ctx, x + 7, y - 10, 1, 14)
  fillRect(ctx, x - 8, y - 5, 1, 11)
  fillRect(ctx, x + 7, y + 4, 2, 2)

  // Shirt (white)
  setFill(ctx, 0xFFFFFF)
  fillRect(ctx, x - 4, y - 8, 3, 4)
  fillRect(ctx, x + 1, y - 8, 3, 6)
  fillRect(ctx, x - 4, y - 4, 4, 2)
  fillRect(ctx, x - 4, y - 2, 3, 2)
  fillRect(ctx, x + 0, y - 2, 4, 1)
  fillRect(ctx, x + 1, y - 1, 3, 3)
  fillRect(ctx, x - 4, y + 0, 4, 1)
  fillRect(ctx, x - 4, y + 1, 3, 3)
  fillRect(ctx, x + 0, y + 2, 4, 1)
  fillRect(ctx, x + 1, y + 3, 3, 1)

  // Shirt buttons
  setFill(ctx, 0xE8E0E0)
  fillRect(ctx, x - 1, y - 5, 2, 1)
  fillRect(ctx, x + 0, y - 4, 1, 2)
  fillRect(ctx, x - 1, y - 2, 1, 1)
  fillRect(ctx, x - 1, y - 1, 2, 1)
  fillRect(ctx, x + 0, y + 0, 1, 1)
  fillRect(ctx, x - 1, y + 1, 2, 1)
  fillRect(ctx, x - 1, y + 2, 1, 1)
  fillRect(ctx, x - 1, y + 3, 2, 1)

  // Neck/chest skin visible between collar
  setFill(ctx, 0xD8A080)
  fillRect(ctx, x - 1, y - 10, 2, 5)

  // Arms (animated)
  setFill(ctx, 0x2A2A3A)
  fillRect(ctx, x - 13, y - 8 + armSwing, 5, 11)
  fillRect(ctx, x + 8, y - 8 - armSwing, 5, 11)

  // Hands (animated)
  setFill(ctx, 0xE8B090)
  fillRect(ctx, x - 13, y + 3 + armSwing, 5, 4)
  fillRect(ctx, x + 8, y + 3 - armSwing, 5, 4)

  // Head/face
  setFill(ctx, 0xE8B090)
  fillRect(ctx, x - 6, y - 23, 12, 4)
  fillRect(ctx, x - 6, y - 19, 2, 1)
  fillRect(ctx, x - 1, y - 19, 2, 3)
  fillRect(ctx, x + 4, y - 19, 2, 1)
  fillRect(ctx, x - 7, y - 18, 3, 2)
  fillRect(ctx, x + 4, y - 18, 3, 2)
  fillRect(ctx, x - 6, y - 16, 5, 1)
  fillRect(ctx, x + 1, y - 16, 5, 1)
  fillRect(ctx, x - 5, y - 15, 4, 1)
  fillRect(ctx, x + 1, y - 15, 4, 1)
  fillRect(ctx, x - 4, y - 14, 8, 1)
  fillRect(ctx, x - 3, y - 13, 1, 1)
  fillRect(ctx, x + 2, y - 13, 1, 1)
  fillRect(ctx, x - 2, y - 12, 3, 1)
  fillRect(ctx, x - 1, y - 11, 2, 1)

  // Hair
  setFill(ctx, 0x5C4633)
  fillRect(ctx, x - 4, y - 26, 8, 1)
  fillRect(ctx, x - 6, y - 25, 12, 1)
  fillRect(ctx, x - 7, y - 24, 14, 1)
  fillRect(ctx, x - 7, y - 23, 1, 5)
  fillRect(ctx, x + 6, y - 23, 1, 5)

  // Eyebrows + mouth
  setFill(ctx, 0x996655)
  fillRect(ctx, x - 4, y - 19, 3, 1)
  fillRect(ctx, x + 1, y - 19, 3, 1)
  fillRect(ctx, x - 2, y - 13, 4, 1)

  // Eyes (white)
  setFill(ctx, 0xFFFFFF)
  fillRect(ctx, x - 2, y - 18, 1, 1)
  fillRect(ctx, x + 1, y - 18, 1, 1)
  fillRect(ctx, x - 4, y - 17, 3, 1)
  fillRect(ctx, x + 1, y - 17, 3, 1)

  // Eye pupils
  setFill(ctx, 0x333333)
  fillRect(ctx, x - 3, y - 18, 1, 1)
  fillRect(ctx, x + 2, y - 18, 1, 1)

  // Nose
  setFill(ctx, 0xD8A080)
  fillRect(ctx, x - 1, y - 16, 2, 2)
  fillRect(ctx, x + 1, y - 12, 1, 1)

  // THE BIG COLLAR — drawn over the face
  setFill(ctx, 0xFFFFFF)
  fillRect(ctx, x - 8, y - 16, 2, 1)
  fillRect(ctx, x + 6, y - 16, 2, 1)
  fillRect(ctx, x - 8, y - 15, 3, 1)
  fillRect(ctx, x + 5, y - 15, 3, 1)
  fillRect(ctx, x - 8, y - 14, 4, 1)
  fillRect(ctx, x + 4, y - 14, 4, 1)
  fillRect(ctx, x - 8, y - 13, 5, 1)
  fillRect(ctx, x + 3, y - 13, 5, 1)
  fillRect(ctx, x - 8, y - 12, 6, 1)
  fillRect(ctx, x + 2, y - 12, 6, 1)
  fillRect(ctx, x - 7, y - 11, 6, 1)
  fillRect(ctx, x + 1, y - 11, 6, 1)
  fillRect(ctx, x - 4, y - 10, 3, 1)
  fillRect(ctx, x + 1, y - 10, 3, 1)

  // Collar shadow/tips
  setFill(ctx, 0xE8E0E0)
  fillRect(ctx, x - 4, y - 18, 1, 1)
  fillRect(ctx, x + 3, y - 18, 1, 1)
  fillRect(ctx, x - 7, y - 10, 3, 1)
  fillRect(ctx, x + 4, y - 10, 3, 1)
  fillRect(ctx, x - 4, y - 9, 3, 1)
  fillRect(ctx, x + 1, y - 9, 3, 1)
}

function drawCollarBoomerang(ctx, x, y) {
  // A flying collar — V-shape, bright white
  setFill(ctx, 0xFFFFFF)
  // Left wing
  fillRect(ctx, x - 5, y - 2, 3, 4)
  fillRect(ctx, x - 6, y - 1, 1, 2)
  // Right wing
  fillRect(ctx, x + 2, y - 2, 3, 4)
  fillRect(ctx, x + 5, y - 1, 1, 2)
  // Center connection
  fillRect(ctx, x - 2, y, 4, 2)
  // Collar tips (shadow)
  setFill(ctx, 0xE8E0E0)
  fillRect(ctx, x - 6, y - 1, 1, 1)
  fillRect(ctx, x + 5, y - 1, 1, 1)
  fillRect(ctx, x - 5, y - 2, 1, 1)
  fillRect(ctx, x + 4, y - 2, 1, 1)
}

// --- ADAM SILVER (Boss — the snake, bald head, glasses, tongue attack) ---

function drawAdamSilver(ctx, x, y, walkFrame = 0) {
  const legOffset = walkFrame % 2 === 0 ? 2 : -2
  const armSwing = walkFrame < 2 ? 3 : -3

  // Legs (dark suit)
  setFill(ctx, 0x2A2A3A)
  fillRect(ctx, x - 6, y + 6, 5, 12 + legOffset)
  fillRect(ctx, x + 1, y + 6, 5, 12 - legOffset)

  // Shoes
  setFill(ctx, 0x1A1A1A)
  fillRect(ctx, x - 7, y + 16 + legOffset, 7, 3)
  fillRect(ctx, x, y + 16 - legOffset, 7, 3)

  // Body (dark suit — narrow, snake-like torso)
  setFill(ctx, 0x2A2A3A)
  fillRect(ctx, x - 7, y - 8, 14, 16)

  // Suit lapels
  setFill(ctx, 0x1E1E2E)
  fillRect(ctx, x - 7, y - 8, 2, 14)
  fillRect(ctx, x + 5, y - 8, 2, 14)

  // White shirt
  setFill(ctx, 0xFFFFFF)
  fillRect(ctx, x - 2, y - 8, 4, 12)

  // Tie (red — NBA commissioner)
  setFill(ctx, 0xCC2222)
  fillRect(ctx, x - 1, y - 8, 2, 10)
  fillRect(ctx, x, y + 2, 1, 2)

  // Arms (animated)
  setFill(ctx, 0x2A2A3A)
  fillRect(ctx, x - 11, y - 6 + armSwing, 5, 10)
  fillRect(ctx, x + 6, y - 6 - armSwing, 5, 10)

  // Hands
  setFill(ctx, 0xD8A878)
  fillRect(ctx, x - 11, y + 3 + armSwing, 5, 3)
  fillRect(ctx, x + 6, y + 3 - armSwing, 5, 3)

  // Neck (long, snake-like — greenish tint)
  setFill(ctx, 0xD8A878)
  fillRect(ctx, x - 3, y - 16, 6, 9)
  // Subtle green scales on neck
  setFill(ctx, 0xC0A060)
  fillRect(ctx, x - 2, y - 14, 1, 1)
  fillRect(ctx, x + 1, y - 12, 1, 1)
  fillRect(ctx, x - 1, y - 10, 1, 1)

  // Head (bald, elongated — reptilian)
  setFill(ctx, 0xD8A878)
  fillRect(ctx, x - 6, y - 26, 12, 11)
  // Bald dome highlight
  setFill(ctx, 0xE0B888)
  fillRect(ctx, x - 3, y - 27, 6, 2)
  fillRect(ctx, x - 4, y - 26, 1, 1)
  fillRect(ctx, x + 3, y - 26, 1, 1)

  // Ears
  setFill(ctx, 0xC89868)
  fillRect(ctx, x - 7, y - 22, 1, 4)
  fillRect(ctx, x + 6, y - 22, 1, 4)

  // Glasses (thick black frames)
  setFill(ctx, 0x333333)
  // Left frame
  fillRect(ctx, x - 5, y - 22, 5, 1)
  fillRect(ctx, x - 5, y - 19, 5, 1)
  fillRect(ctx, x - 5, y - 22, 1, 4)
  fillRect(ctx, x - 1, y - 22, 1, 4)
  // Bridge
  fillRect(ctx, x - 1, y - 21, 2, 1)
  // Right frame
  fillRect(ctx, x + 1, y - 22, 5, 1)
  fillRect(ctx, x + 1, y - 19, 5, 1)
  fillRect(ctx, x + 1, y - 22, 1, 4)
  fillRect(ctx, x + 5, y - 22, 1, 4)

  // Lens tint
  setFill(ctx, 0x444466, 0.4)
  fillRect(ctx, x - 4, y - 21, 3, 2)
  fillRect(ctx, x + 2, y - 21, 3, 2)

  // Eyes behind glasses (beady, reptilian)
  setFill(ctx, 0x111111)
  fillRect(ctx, x - 3, y - 21, 2, 2)
  fillRect(ctx, x + 2, y - 21, 2, 2)
  // Slit pupils (vertical)
  setFill(ctx, 0x448844)
  fillRect(ctx, x - 3, y - 21, 1, 2)
  fillRect(ctx, x + 3, y - 21, 1, 2)

  // Nose (thin, angular)
  setFill(ctx, 0xC89868)
  fillRect(ctx, x, y - 18, 1, 2)

  // Mouth (thin, sinister)
  setFill(ctx, 0x996655)
  fillRect(ctx, x - 3, y - 16, 6, 1)
  // Slight smirk
  setFill(ctx, 0xCC2222)
  fillRect(ctx, x + 3, y - 16, 1, 1)
}

function drawSnakeTongue(ctx, x, y) {
  // Forked tongue projectile
  setFill(ctx, 0xCC2222)
  fillRect(ctx, x - 1, y - 1, 8, 2)
  // Fork
  fillRect(ctx, x + 7, y - 3, 1, 2)
  fillRect(ctx, x + 8, y - 4, 1, 1)
  fillRect(ctx, x + 7, y + 1, 1, 2)
  fillRect(ctx, x + 8, y + 3, 1, 1)
  // Darker center line
  setFill(ctx, 0x991111)
  fillRect(ctx, x, y, 7, 1)
}

// --- ANGELO & ESKIN (Two-Headed Monster — radio shock jocks) ---

function drawAngeloEskin(ctx, x, y, walkFrame = 0) {
  const legOffset = walkFrame % 2 === 0 ? 2 : -2
  const armSwing = walkFrame < 2 ? 3 : -3

  // Legs (shared — wide stance)
  setFill(ctx, 0x2A2A3A)
  fillRect(ctx, x - 9, y + 6, 6, 12 + legOffset)
  fillRect(ctx, x + 3, y + 6, 6, 12 - legOffset)

  // Shoes
  setFill(ctx, 0x333333)
  fillRect(ctx, x - 10, y + 16 + legOffset, 8, 3)
  fillRect(ctx, x + 2, y + 16 - legOffset, 8, 3)

  // Body (wide, shared torso — dark suit)
  setFill(ctx, 0x2A2A3A)
  fillRect(ctx, x - 12, y - 10, 24, 18)

  // Lapels
  setFill(ctx, 0x1E1E2E)
  fillRect(ctx, x - 12, y - 10, 2, 16)
  fillRect(ctx, x + 10, y - 10, 2, 16)

  // Shirt (muted red — WIP sports radio vibe)
  setFill(ctx, 0x993333)
  fillRect(ctx, x - 6, y - 10, 12, 14)

  // Shirt detail — vertical dividing line (two personalities)
  setFill(ctx, 0x772222)
  fillRect(ctx, x, y - 10, 1, 14)

  // Arms (animated)
  setFill(ctx, 0x2A2A3A)
  fillRect(ctx, x - 16, y - 8 + armSwing, 5, 12)
  fillRect(ctx, x + 11, y - 8 - armSwing, 5, 12)

  // Hands
  setFill(ctx, 0xE8B090)
  fillRect(ctx, x - 16, y + 3 + armSwing, 5, 4)
  fillRect(ctx, x + 11, y + 3 - armSwing, 5, 4)

  // === TWO NECKS splitting from shoulders ===
  // Left neck (Angelo)
  setFill(ctx, 0xE0B090)
  fillRect(ctx, x - 8, y - 16, 5, 7)
  // Right neck (Eskin)
  setFill(ctx, 0xE8B090)
  fillRect(ctx, x + 3, y - 16, 5, 7)

  // ====== LEFT HEAD — ANGELO (older, grey hair) ======
  // Head
  setFill(ctx, 0xE0B090)
  fillRect(ctx, x - 14, y - 28, 14, 13)

  // Grey hair (thin, receding)
  setFill(ctx, 0xAAAAAA)
  fillRect(ctx, x - 12, y - 31, 10, 1)
  fillRect(ctx, x - 14, y - 30, 14, 1)
  fillRect(ctx, x - 15, y - 29, 16, 1)
  fillRect(ctx, x - 15, y - 28, 2, 6)
  fillRect(ctx, x + 0, y - 28, 1, 4)
  // Hair wisps on top
  setFill(ctx, 0xBBBBBB)
  fillRect(ctx, x - 10, y - 31, 2, 1)
  fillRect(ctx, x - 6, y - 32, 2, 1)

  // Eyebrows (bushy, grey)
  setFill(ctx, 0x888888)
  fillRect(ctx, x - 12, y - 24, 4, 1)
  fillRect(ctx, x - 5, y - 24, 4, 1)

  // Eyes
  setFill(ctx, 0xFFFFFF)
  fillRect(ctx, x - 11, y - 23, 3, 2)
  fillRect(ctx, x - 5, y - 23, 3, 2)
  // Pupils
  setFill(ctx, 0x443322)
  fillRect(ctx, x - 10, y - 23, 2, 2)
  fillRect(ctx, x - 4, y - 23, 2, 2)

  // Nose (bigger, older)
  setFill(ctx, 0xD09870)
  fillRect(ctx, x - 8, y - 21, 3, 3)

  // Mouth (open, yelling — he's a shock jock)
  setFill(ctx, 0x111111)
  fillRect(ctx, x - 10, y - 17, 6, 2)
  // Teeth
  setFill(ctx, 0xFFFFFF)
  fillRect(ctx, x - 9, y - 17, 1, 1)
  fillRect(ctx, x - 6, y - 17, 1, 1)

  // Wrinkles
  setFill(ctx, 0xC89868)
  fillRect(ctx, x - 13, y - 20, 1, 1)
  fillRect(ctx, x - 1, y - 20, 1, 1)

  // ====== RIGHT HEAD — ESKIN (beard, lighter brown hair) ======
  // Head
  setFill(ctx, 0xE8B090)
  fillRect(ctx, x + 0, y - 28, 14, 13)

  // Lighter brown hair (styled, thicker)
  setFill(ctx, 0x8B6842)
  fillRect(ctx, x + 2, y - 31, 10, 1)
  fillRect(ctx, x + 0, y - 30, 14, 1)
  fillRect(ctx, x - 1, y - 29, 16, 1)
  fillRect(ctx, x - 1, y - 28, 1, 4)
  fillRect(ctx, x + 14, y - 28, 1, 6)
  // Hair volume on top
  fillRect(ctx, x + 0, y - 32, 14, 1)
  fillRect(ctx, x + 2, y - 33, 10, 1)

  // Eyebrows
  setFill(ctx, 0x6B4822)
  fillRect(ctx, x + 2, y - 24, 4, 1)
  fillRect(ctx, x + 8, y - 24, 4, 1)

  // Eyes
  setFill(ctx, 0xFFFFFF)
  fillRect(ctx, x + 3, y - 23, 3, 2)
  fillRect(ctx, x + 9, y - 23, 3, 2)
  // Pupils
  setFill(ctx, 0x443322)
  fillRect(ctx, x + 4, y - 23, 2, 2)
  fillRect(ctx, x + 10, y - 23, 2, 2)

  // Nose
  setFill(ctx, 0xD8A080)
  fillRect(ctx, x + 6, y - 21, 2, 2)

  // Mouth (smirking)
  setFill(ctx, 0x995533)
  fillRect(ctx, x + 4, y - 18, 6, 1)
  setFill(ctx, 0xCC8866)
  fillRect(ctx, x + 9, y - 19, 2, 1)

  // Beard (full, thick brown)
  setFill(ctx, 0x6B4822)
  fillRect(ctx, x + 1, y - 17, 12, 3)
  fillRect(ctx, x + 2, y - 14, 10, 2)
  fillRect(ctx, x + 3, y - 12, 8, 1)
  // Beard sides — thick along jawline
  fillRect(ctx, x + 0, y - 18, 2, 4)
  fillRect(ctx, x + 12, y - 18, 2, 4)
  // Stubble connecting to beard up cheeks
  setFill(ctx, 0x7B5832)
  fillRect(ctx, x + 1, y - 19, 2, 1)
  fillRect(ctx, x + 11, y - 19, 2, 1)
  fillRect(ctx, x + 0, y - 20, 1, 2)
  fillRect(ctx, x + 13, y - 20, 1, 2)
  // Beard texture
  setFill(ctx, 0x5A3812)
  fillRect(ctx, x + 4, y - 16, 1, 1)
  fillRect(ctx, x + 8, y - 15, 1, 1)
  fillRect(ctx, x + 6, y - 13, 1, 1)
}

function drawMegaphone(ctx, x, y) {
  // Handle
  setFill(ctx, 0x333333)
  fillRect(ctx, x - 8, y - 1, 4, 3)

  // Body (cone shape — widens left to right)
  setFill(ctx, 0xCC2200)
  fillRect(ctx, x - 4, y - 2, 3, 5)
  fillRect(ctx, x - 1, y - 3, 3, 7)
  fillRect(ctx, x + 2, y - 4, 3, 9)
  fillRect(ctx, x + 5, y - 5, 2, 11)

  // Bell opening
  setFill(ctx, 0x111111)
  fillRect(ctx, x + 7, y - 5, 1, 11)

  // Stripe detail
  setFill(ctx, 0xE8B800)
  fillRect(ctx, x - 4, y, 11, 1)

  // Sound waves
  setFill(ctx, 0xE8B800, 0.9)
  fillRect(ctx, x + 10, y - 3, 1, 7)
  fillRect(ctx, x + 11, y - 2, 1, 5)

  setFill(ctx, 0xE8B800, 0.6)
  fillRect(ctx, x + 13, y - 5, 1, 11)
  fillRect(ctx, x + 14, y - 4, 1, 9)

  setFill(ctx, 0xE8B800, 0.3)
  fillRect(ctx, x + 16, y - 7, 1, 15)
  fillRect(ctx, x + 17, y - 6, 1, 13)
}

// --- HEROES ---

// --- JOEL EMBIID #21 (Ally — twice as tall, 76ers jersey, dominant center) ---

function drawEmbiid(ctx, x, y, walkFrame = 0) {
  const legOffset = walkFrame % 2 === 0 ? 3 : -3
  const armSwing = walkFrame < 2 ? 4 : -4

  // Legs (long — blue shorts over long legs)
  // Shorts (76ers blue)
  setFill(ctx, 0x003DA5)
  fillRect(ctx, x - 10, y + 8, 8, 12)
  fillRect(ctx, x + 2, y + 8, 8, 12)

  // Shorts waistband (white)
  setFill(ctx, 0xFFFFFF)
  fillRect(ctx, x - 10, y + 8, 8, 2)
  fillRect(ctx, x + 2, y + 8, 8, 2)

  // Bare legs below shorts
  setFill(ctx, 0x6B4226)
  fillRect(ctx, x - 9, y + 20, 7, 16 + legOffset)
  fillRect(ctx, x + 3, y + 20, 7, 16 - legOffset)

  // Knee detail
  setFill(ctx, 0x5A3620)
  fillRect(ctx, x - 7, y + 26, 3, 2)
  fillRect(ctx, x + 5, y + 26, 3, 2)

  // Shoes (Nike — white with blue swoosh)
  setFill(ctx, 0xFFFFFF)
  fillRect(ctx, x - 11, y + 34 + legOffset, 10, 5)
  fillRect(ctx, x + 2, y + 34 - legOffset, 10, 5)
  // Sole
  setFill(ctx, 0x222222)
  fillRect(ctx, x - 11, y + 38 + legOffset, 10, 2)
  fillRect(ctx, x + 2, y + 38 - legOffset, 10, 2)
  // Swoosh
  setFill(ctx, 0x003DA5)
  fillRect(ctx, x - 9, y + 36 + legOffset, 5, 1)
  fillRect(ctx, x + 4, y + 36 - legOffset, 5, 1)

  // Body (76ers blue jersey — wide, powerful)
  setFill(ctx, 0x003DA5)
  fillRect(ctx, x - 12, y - 20, 24, 30)

  // Jersey side panels (red trim)
  setFill(ctx, 0xCC2200)
  fillRect(ctx, x - 12, y - 20, 2, 28)
  fillRect(ctx, x + 10, y - 20, 2, 28)

  // Jersey number 21 (white, front)
  setFill(ctx, 0xFFFFFF)
  // "2"
  fillRect(ctx, x - 7, y - 12, 5, 1)
  fillRect(ctx, x - 3, y - 11, 1, 3)
  fillRect(ctx, x - 7, y - 8, 5, 1)
  fillRect(ctx, x - 7, y - 7, 1, 3)
  fillRect(ctx, x - 7, y - 4, 5, 1)
  // "1"
  fillRect(ctx, x + 3, y - 12, 2, 9)
  fillRect(ctx, x + 2, y - 11, 1, 1)

  // Collar
  setFill(ctx, 0xFFFFFF)
  fillRect(ctx, x - 5, y - 21, 10, 2)

  // Arms (long, muscular)
  setFill(ctx, 0x6B4226)
  fillRect(ctx, x - 17, y - 18 + armSwing, 6, 20)
  fillRect(ctx, x + 11, y - 18 - armSwing, 6, 20)

  // Bicep detail
  setFill(ctx, 0x5A3620)
  fillRect(ctx, x - 16, y - 14 + armSwing, 1, 4)
  fillRect(ctx, x + 16, y - 14 - armSwing, 1, 4)

  // Hands
  setFill(ctx, 0x6B4226)
  fillRect(ctx, x - 17, y + 1 + armSwing, 6, 5)
  fillRect(ctx, x + 11, y + 1 - armSwing, 6, 5)

  // Wristbands (white)
  setFill(ctx, 0xFFFFFF)
  fillRect(ctx, x - 17, y - 1 + armSwing, 6, 2)
  fillRect(ctx, x + 11, y - 1 - armSwing, 6, 2)

  // Neck
  setFill(ctx, 0x6B4226)
  fillRect(ctx, x - 4, y - 28, 8, 8)

  // Head (large, proportional to big body)
  setFill(ctx, 0x6B4226)
  fillRect(ctx, x - 10, y - 46, 20, 19)

  // Hair (short, dark, flat top style)
  setFill(ctx, 0x1A1A1A)
  fillRect(ctx, x - 10, y - 49, 20, 4)
  fillRect(ctx, x - 8, y - 50, 16, 1)
  // Sides trimmed tight
  fillRect(ctx, x - 11, y - 46, 1, 10)
  fillRect(ctx, x + 10, y - 46, 1, 10)

  // Beard (full, thick, dark)
  setFill(ctx, 0x1A1A1A)
  // Main beard mass
  fillRect(ctx, x - 9, y - 36, 18, 10)
  // Chin extension
  fillRect(ctx, x - 7, y - 26, 14, 2)
  fillRect(ctx, x - 5, y - 24, 10, 1)
  // Sideburns thick along jaw
  fillRect(ctx, x - 10, y - 38, 2, 6)
  fillRect(ctx, x + 8, y - 38, 2, 6)
  // Cheek coverage up to eyes
  fillRect(ctx, x - 9, y - 40, 1, 4)
  fillRect(ctx, x + 8, y - 40, 1, 4)
  // Beard texture
  setFill(ctx, 0x2A2A2A)
  fillRect(ctx, x - 6, y - 34, 1, 1)
  fillRect(ctx, x + 3, y - 33, 1, 1)
  fillRect(ctx, x - 3, y - 31, 1, 1)
  fillRect(ctx, x + 5, y - 30, 1, 1)
  fillRect(ctx, x - 1, y - 28, 1, 1)
  fillRect(ctx, x + 1, y - 25, 1, 1)
  fillRect(ctx, x - 5, y - 29, 1, 1)
  fillRect(ctx, x + 6, y - 32, 1, 1)

  // Eyes (expressive, dark brown)
  setFill(ctx, 0xFFFFFF)
  fillRect(ctx, x - 7, y - 42, 5, 3)
  fillRect(ctx, x + 2, y - 42, 5, 3)
  // Iris (dark brown)
  setFill(ctx, 0x3D2517)
  fillRect(ctx, x - 5, y - 42, 3, 3)
  fillRect(ctx, x + 3, y - 42, 3, 3)
  // Pupil
  setFill(ctx, 0x111111)
  fillRect(ctx, x - 4, y - 41, 1, 1)
  fillRect(ctx, x + 4, y - 41, 1, 1)

  // Eyebrows (thick)
  setFill(ctx, 0x1A1A1A)
  fillRect(ctx, x - 7, y - 44, 5, 1)
  fillRect(ctx, x + 2, y - 44, 5, 1)

  // Nose (wide, strong)
  setFill(ctx, 0x5A3620)
  fillRect(ctx, x - 2, y - 39, 4, 3)
  fillRect(ctx, x - 3, y - 37, 6, 1)

  // Mouth (confident grin)
  setFill(ctx, 0xFFFFFF)
  fillRect(ctx, x - 4, y - 35, 8, 2)
  // Lip
  setFill(ctx, 0x4A2A16)
  fillRect(ctx, x - 5, y - 35, 1, 1)
  fillRect(ctx, x + 4, y - 35, 1, 1)

  // Ears
  setFill(ctx, 0x5A3620)
  fillRect(ctx, x - 11, y - 42, 2, 4)
  fillRect(ctx, x + 9, y - 42, 2, 4)
}

// --- WEAPONS ---

function drawTank(ctx, x, y) {
  // Draw Hinkie first — he'll be partially covered by the tank
  drawHinkieV2Standing(ctx, x - 2, y - 16, 0)

  // === TANK BODY (covers Hinkie's legs/lower body) ===

  // Treads
  setFill(ctx, 0x333333)
  fillRect(ctx, x - 20, y + 8, 40, 8)
  setFill(ctx, 0x222222)
  fillRect(ctx, x - 18, y + 10, 4, 5)
  fillRect(ctx, x - 12, y + 10, 4, 5)
  fillRect(ctx, x - 6, y + 10, 4, 5)
  fillRect(ctx, x + 0, y + 10, 4, 5)
  fillRect(ctx, x + 6, y + 10, 4, 5)
  fillRect(ctx, x + 12, y + 10, 4, 5)
  fillRect(ctx, x + 16, y + 10, 4, 5)
  // Tread edges
  setFill(ctx, 0x444444)
  fillRect(ctx, x - 20, y + 8, 40, 1)
  fillRect(ctx, x - 20, y + 15, 40, 1)

  // Hull (76ers blue)
  setFill(ctx, 0x003DA5)
  fillRect(ctx, x - 18, y - 4, 36, 14)

  // Red stripe
  setFill(ctx, 0xCC2200)
  fillRect(ctx, x - 18, y - 1, 36, 2)

  // Hull bottom detail
  setFill(ctx, 0x002277)
  fillRect(ctx, x - 18, y + 7, 36, 1)

  // Turret (Hinkie sits here)
  setFill(ctx, 0x003DA5)
  fillRect(ctx, x - 10, y - 14, 18, 12)

  // Turret darker top rim
  setFill(ctx, 0x002277)
  fillRect(ctx, x - 10, y - 14, 18, 2)

  // Hatch opening (Hinkie visible above this line)
  setFill(ctx, 0x001155)
  fillRect(ctx, x - 10, y - 14, 2, 2)
  fillRect(ctx, x + 6, y - 14, 2, 2)

  // Barrel
  setFill(ctx, 0x444444)
  fillRect(ctx, x + 8, y - 10, 16, 4)
  // Barrel tip
  setFill(ctx, 0x555555)
  fillRect(ctx, x + 22, y - 11, 3, 6)

  // 76ers star on hull
  setFill(ctx, 0xE8B800)
  fillRect(ctx, x - 7, y + 1, 4, 4)
  fillRect(ctx, x - 6, y + 0, 2, 1)
  fillRect(ctx, x - 6, y + 5, 2, 1)
  fillRect(ctx, x - 8, y + 2, 1, 2)
  fillRect(ctx, x - 3, y + 2, 1, 2)

  // White "TTP" on hull
  setFill(ctx, 0xFFFFFF)
  fillRect(ctx, x + 4, y + 1, 5, 1)
  fillRect(ctx, x + 6, y + 2, 1, 3)
}

function drawBurnerPhone(ctx, x, y) {
  // Phone body (old flip phone)
  setFill(ctx, 0x222222)
  fillRect(ctx, x - 2, y - 5, 5, 10)

  // Screen
  setFill(ctx, 0x44AA66)
  fillRect(ctx, x - 1, y - 4, 3, 3)

  // Keypad
  setFill(ctx, 0x555555)
  fillRect(ctx, x - 1, y, 1, 1)
  fillRect(ctx, x + 1, y, 1, 1)
  fillRect(ctx, x - 1, y + 2, 1, 1)
  fillRect(ctx, x + 1, y + 2, 1, 1)
  fillRect(ctx, x, y + 1, 1, 1)

  // Antenna
  setFill(ctx, 0x333333)
  fillRect(ctx, x + 2, y - 7, 1, 3)
}

function drawBattery(ctx, x, y) {
  // AA battery body
  setFill(ctx, 0xCC8800)
  fillRect(ctx, x - 2, y - 4, 4, 8)

  // Top terminal
  setFill(ctx, 0x888888)
  fillRect(ctx, x - 1, y - 6, 2, 2)

  // Bottom flat
  setFill(ctx, 0x888888)
  fillRect(ctx, x - 2, y + 4, 4, 1)

  // Label stripe
  setFill(ctx, 0x111111)
  fillRect(ctx, x - 2, y - 1, 4, 2)

  // Plus sign
  setFill(ctx, 0xFFFFFF)
  fillRect(ctx, x, y - 5, 1, 1)
}

function drawSilverAttack(ctx, x, y) {
  // Adam Silver with extended neck attacking
  // Body (small, far left)
  setFill(ctx, 0x2A2A3A)
  fillRect(ctx, x - 10, y + 1, 6, 6)
  // Head at end of long neck
  setFill(ctx, 0xD8A878)
  fillRect(ctx, x + 4, y - 4, 6, 5)
  // Glasses
  setFill(ctx, 0x333333)
  fillRect(ctx, x + 5, y - 3, 2, 1)
  fillRect(ctx, x + 8, y - 3, 2, 1)
  // Long stretched neck
  setFill(ctx, 0xD8A878)
  fillRect(ctx, x - 5, y - 1, 10, 3)
  // Scales on neck
  setFill(ctx, 0xC0A060)
  fillRect(ctx, x - 3, y, 1, 1)
  fillRect(ctx, x, y, 1, 1)
  fillRect(ctx, x + 3, y, 1, 1)
  // Tongue
  setFill(ctx, 0xCC2222)
  fillRect(ctx, x + 10, y - 1, 3, 1)
  fillRect(ctx, x + 10, y + 1, 3, 1)
}

// --- Pose Canvas Component ---

function PoseCanvas({ drawFn, width = 40, height = 55, label }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = width * SCALE
    canvas.height = height * SCALE
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = false
    ctx.scale(SCALE, SCALE)

    // Light gray background
    ctx.fillStyle = '#C0C0C0'
    ctx.fillRect(0, 0, width, height)

    drawFn(ctx, width / 2, height / 2 + 4)
  }, [drawFn, width, height])

  return (
    <div className="flex flex-col items-center gap-2">
      <canvas
        ref={canvasRef}
        style={{
          width: width * SCALE + 'px',
          height: height * SCALE + 'px',
          imageRendering: 'pixelated',
          borderRadius: '4px',
          border: '2px solid #222233'
        }}
      />
      {label && (
        <span style={{ fontFamily: '"Press Start 2P"', fontSize: '9px', color: '#888' }}>
          {label}
        </span>
      )}
    </div>
  )
}

// --- Color Swatch ---

function ColorSwatch({ colors }) {
  return (
    <div className="flex gap-1 items-center mt-1">
      {colors.map((c, i) => (
        <div key={i} className="flex items-center gap-1">
          <div style={{
            width: 14, height: 14, backgroundColor: typeof c.hex === 'number' ? hexNum(c.hex) : c.hex,
            border: '1px solid #333', borderRadius: 2
          }} />
          <span style={{ fontFamily: '"Press Start 2P"', fontSize: '7px', color: '#555' }}>{c.label}</span>
        </div>
      ))}
    </div>
  )
}

// --- Character Card ---

function CharacterCard({ name, description, poses, colors, stats }) {
  return (
    <div style={{
      background: '#0d0d1a',
      border: '1px solid #1a1a33',
      borderRadius: 8,
      padding: '20px 24px',
      width: '100%'
    }}>
      {/* Header */}
      <div className="flex items-baseline gap-3 mb-1">
        <h2 style={{ fontFamily: '"Press Start 2P"', fontSize: '14px', color: COLORS.GOLD, margin: 0 }}>
          {name}
        </h2>
        <span style={{ fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#555' }}>
          {description}
        </span>
      </div>

      {/* Stats */}
      {stats && (
        <div className="flex gap-4 mb-4 mt-2">
          {stats.map((s, i) => (
            <span key={i} style={{ fontFamily: '"Press Start 2P"', fontSize: '8px', color: COLORS.CYAN }}>
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Pose grid */}
      <div className="flex flex-wrap gap-4 mb-3">
        {poses.map((pose, i) => (
          <PoseCanvas
            key={i}
            drawFn={pose.draw}
            width={pose.width || 40}
            height={pose.height || 55}
            label={pose.label}
          />
        ))}
      </div>

      {/* Color palette */}
      {colors && <ColorSwatch colors={colors} />}
    </div>
  )
}

// === PAGE ===

export default function CharacterDesignPage() {
  // Override game CSS that prevents scrolling
  useLayoutEffect(() => {
    document.body.style.overflow = 'auto'
    document.body.style.height = 'auto'
    document.body.style.position = 'static'
    document.getElementById('root').style.height = 'auto'
    document.getElementById('root').style.display = 'block'
    return () => {
      document.body.style.overflow = ''
      document.body.style.height = ''
      document.body.style.position = ''
      document.getElementById('root').style.height = ''
      document.getElementById('root').style.display = ''
    }
  }, [])

  const hinkiePoses = [
    { label: 'HINKIE', draw: (ctx, x, y) => drawHinkieV2Standing(ctx, x, y, 0) },
    { label: 'LOTTO BALLS', width: 30, height: 36, draw: (ctx, x, y) => drawLottoBalls(ctx, x, y) },
    { label: 'TANK', width: 60, height: 55, draw: (ctx, x, y) => drawTank(ctx, x, y + 6) },
  ]

  const colangeloPoses = [
    { label: 'COLANGELO', draw: (ctx, x, y) => drawColangelo(ctx, x, y, 0) },
    { label: 'COLLAR', width: 24, height: 24, draw: (ctx, x, y) => drawCollarBoomerang(ctx, x, y) },
    { label: 'BURNER', width: 24, height: 24, draw: (ctx, x, y) => drawBurnerPhone(ctx, x, y) },
  ]

  const silverPoses = [
    { label: 'SILVER', draw: (ctx, x, y) => drawAdamSilver(ctx, x, y, 0) },
    { label: 'ATTACK', width: 36, height: 24, draw: (ctx, x, y) => drawSilverAttack(ctx, x, y) },
    { label: 'TONGUE', width: 24, height: 24, draw: (ctx, x, y) => drawSnakeTongue(ctx, x - 4, y) },
  ]

  const monsterPoses = [
    { label: 'ANGELO & ESKIN', width: 50, height: 60, draw: (ctx, x, y) => drawAngeloEskin(ctx, x, y, 0) },
    { label: 'MEGAPHONE', width: 36, height: 28, draw: (ctx, x, y) => drawMegaphone(ctx, x - 4, y) },
  ]

  const embiidPoses = [
    { label: 'EMBIID', width: 50, height: 110, draw: (ctx, x, y) => drawEmbiid(ctx, x, y, 0) },
  ]

  const fanPoses = [
    { label: 'NORMAL', draw: (ctx, x, y) => drawFanEnemy(ctx, x, y, 'normal', 0, false, false) },
    { label: 'FAST', draw: (ctx, x, y) => drawFanEnemy(ctx, x, y, 'fast', 0, false, false) },
    { label: 'SNOWBALL', width: 24, height: 24, draw: (ctx, x, y) => drawSnowball(ctx, x, y) },
    { label: 'BATTERY', width: 24, height: 24, draw: (ctx, x, y) => drawBattery(ctx, x, y) },
  ]

  return (
    <div className="min-h-screen bg-black"
      style={{ fontFamily: '"Press Start 2P", monospace' }}>

      {/* Header bar */}
      <div style={{
        borderBottom: '1px solid #1a1a33',
        background: '#080810',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div className="flex items-center gap-5">
          <a href="/"
            style={{
              fontFamily: '"Press Start 2P"', fontSize: '10px',
              color: '#666', textDecoration: 'none', padding: '6px 12px',
              border: '1px solid #333', borderRadius: 4,
              transition: 'all 0.2s'
            }}
            onMouseOver={e => { e.target.style.color = '#fff'; e.target.style.borderColor = '#666' }}
            onMouseOut={e => { e.target.style.color = '#666'; e.target.style.borderColor = '#333' }}>
            BACK
          </a>
          <h1 style={{ fontFamily: '"Press Start 2P"', fontSize: '16px', color: COLORS.GOLD, margin: 0 }}>
            CHARACTER DESIGN
          </h1>
          <a href="/editor"
            style={{
              fontFamily: '"Press Start 2P"', fontSize: '10px',
              color: '#E8B800', textDecoration: 'none', padding: '6px 12px',
              border: '1px solid #E8B800', borderRadius: 4,
            }}>
            PIXEL EDITOR
          </a>
        </div>
        <span style={{ fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#333' }}>
          LONGEST VIEW
        </span>
      </div>

      {/* Cards grid */}
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 20px' }}
        className="flex flex-col gap-6">

        <CharacterCard
          name="HINKIE"
          description="THE PROTAGONIST"
          stats={['LOTTO BALLS', 'TANK']}
          poses={hinkiePoses}
          colors={[
            { hex: 0xE8B090, label: 'SKIN' },
            { hex: 0x3D2517, label: 'HAIR' },
            { hex: 0x141428, label: 'SUIT' },
            { hex: 0x7BB8E0, label: 'SHIRT' },
            { hex: 0x2266CC, label: 'EYES' },
            { hex: 0x3B2314, label: 'SHOES' },
          ]}
        />

        <CharacterCard
          name="JOEL EMBIID"
          description="HERO — THE PROCESS"
          stats={['#21', 'SIXERS CENTER']}
          poses={embiidPoses}
          colors={[
            { hex: 0x6B4226, label: 'SKIN' },
            { hex: 0x1A1A1A, label: 'HAIR/BEARD' },
            { hex: 0x003DA5, label: 'JERSEY' },
            { hex: 0xCC2200, label: 'TRIM' },
            { hex: 0xFFFFFF, label: 'SHORTS' },
          ]}
        />

        <CharacterCard
          name="COLANGELO"
          description="BOSS — BIG COLLAR"
          stats={['COLLAR BOOMERANGS', 'BURNER PHONES']}
          poses={colangeloPoses}
          colors={[
            { hex: 0xE8B090, label: 'SKIN' },
            { hex: 0x5C4633, label: 'HAIR' },
            { hex: 0x2A2A3A, label: 'SUIT' },
            { hex: 0xFFFFFF, label: 'COLLAR' },
          ]}
        />

        <CharacterCard
          name="ADAM SILVER"
          description="BOSS — THE SNAKE"
          stats={['EXTENDS NECK', 'SNAKE TONGUE']}
          poses={silverPoses}
          colors={[
            { hex: 0xD8A878, label: 'SKIN' },
            { hex: 0x2A2A3A, label: 'SUIT' },
            { hex: 0x333333, label: 'GLASSES' },
            { hex: 0xCC2222, label: 'TONGUE' },
          ]}
        />

        <CharacterCard
          name="ANGELO & ESKIN"
          description="BOSS — TWO-HEADED MONSTER"
          stats={['MEGAPHONE BLAST']}
          poses={monsterPoses}
          colors={[
            { hex: 0xE0B090, label: 'ANGELO' },
            { hex: 0xE8B090, label: 'ESKIN' },
            { hex: 0xAAAAAA, label: 'GREY HAIR' },
            { hex: 0x8B6842, label: 'BROWN HAIR' },
            { hex: 0x6B4822, label: 'BEARD' },
            { hex: 0x993333, label: 'SHIRT' },
          ]}
        />

        <CharacterCard
          name="FANS"
          description="ENEMIES"
          stats={['SNOWBALLS', 'AA BATTERIES']}
          poses={fanPoses}
          colors={[
            { hex: 0x003DA5, label: 'JERSEY' },
            { hex: 0xCC2200, label: 'CAP/FAST' },
            { hex: 0xE8B090, label: 'SKIN' },
            { hex: 0xCC8800, label: 'BATTERY' },
          ]}
        />
      </div>
    </div>
  )
}
