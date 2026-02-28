import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react'

function hexNum(n) {
  const r = (n >> 16) & 0xFF
  const g = (n >> 8) & 0xFF
  const b = n & 0xFF
  return `rgb(${r},${g},${b})`
}

const GW = 40
const GH = 55
const CX = 20
const CY = 32
const CELL = 12

const HINKIE_PALETTE = [
  { label: 'ERASE', num: null },
  { label: 'HAIR', num: 0x3D2517 },
  { label: 'SKIN', num: 0xE8B090 },
  { label: 'SUIT', num: 0x141428 },
  { label: 'LAPEL', num: 0x0E0E1E },
  { label: 'SHIRT', num: 0x7BB8E0 },
  { label: 'COLLR', num: 0x9CCEF0 },
  { label: 'WHITE', num: 0xFFFFFF },
  { label: 'EYES', num: 0x2266CC },
  { label: 'BLACK', num: 0x111111 },
  { label: 'NOSE', num: 0xD8A080 },
  { label: 'MOUTH', num: 0x995533 },
  { label: 'SMIRK', num: 0xCC8866 },
  { label: 'STBBL', num: 0xC09878 },
  { label: 'PANTS', num: 0x1A1A3A },
  { label: 'SHOES', num: 0x3B2314 },
]

const COLANGELO_PALETTE = [
  { label: 'ERASE', num: null },
  { label: 'HAIR', num: 0x5C4633 },
  { label: 'SKIN', num: 0xE8B090 },
  { label: 'SUIT', num: 0x2A2A3A },
  { label: 'LAPEL', num: 0x1E1E2E },
  { label: 'WHITE', num: 0xFFFFFF },
  { label: 'CSHDW', num: 0xE8E0E0 },
  { label: 'EYES', num: 0x333333 },
  { label: 'NOSE', num: 0xD8A080 },
  { label: 'MOUTH', num: 0x996655 },
  { label: 'SHOES', num: 0x1A1A1A },
  { label: 'BLACK', num: 0x111111 },
]

const SILVER_PALETTE = [
  { label: 'ERASE', num: null },
  { label: 'SKIN', num: 0xD8A878 },
  { label: 'HILITE', num: 0xE0B888 },
  { label: 'EAR', num: 0xC89868 },
  { label: 'SUIT', num: 0x2A2A3A },
  { label: 'LAPEL', num: 0x1E1E2E },
  { label: 'WHITE', num: 0xFFFFFF },
  { label: 'GLASS', num: 0x333333 },
  { label: 'SNAKE', num: 0x448844 },
  { label: 'RED', num: 0xCC2222 },
  { label: 'SCALE', num: 0xC0A060 },
  { label: 'BLACK', num: 0x111111 },
  { label: 'MOUTH', num: 0x996655 },
  { label: 'SHOES', num: 0x1A1A1A },
]

function makeGrid() {
  const grid = Array.from({ length: GH }, () => Array(GW).fill(null))
  let cur = null
  const s = (hex) => { cur = hex }
  const f = (rx, ry, rw, rh) => {
    for (let dy = 0; dy < rh; dy++)
      for (let dx = 0; dx < rw; dx++) {
        const gx = rx + dx, gy = ry + dy
        if (gx >= 0 && gx < GW && gy >= 0 && gy < GH) grid[gy][gx] = cur
      }
  }
  return { grid, s, f, x: CX, y: CY }
}

function buildHinkieGrid() {
  const { grid, s, f, x, y } = makeGrid()

  // Legs (walkFrame=0, legOffset=2)
  s(0x1A1A3A)
  f(x-7, y+6, 5, 16); f(x+2, y+6, 5, 12)
  // Shoes
  s(0x3B2314)
  f(x-8, y+20, 7, 3); f(x+1, y+16, 7, 3)
  // Body
  s(0x141428)
  f(x-9, y-10, 18, 18)
  // Lapels
  s(0x0E0E1E)
  f(x-9, y-10, 2, 16); f(x+7, y-10, 2, 16)
  // Shirt
  s(0x7BB8E0)
  f(x-4, y-10, 8, 14)
  // Collar
  s(0x9CCEF0)
  f(x-3, y-10, 6, 2)
  // Button
  s(0xFFFFFF)
  f(x, y-4, 1, 1)
  // Arms (armSwing=3)
  s(0x141428)
  f(x-13, y-5, 5, 12); f(x+8, y-11, 5, 12)
  // Hands
  s(0xE8B090)
  f(x-13, y+6, 5, 4); f(x+8, y+0, 5, 4)
  // Head
  s(0xE8B090)
  f(x-8, y-27, 16, 18)
  // Hair
  s(0x3D2517)
  f(x-9, y-27, 8, 5); f(x-9, y-23, 2, 6)
  f(x-1, y-27, 5, 3)
  f(x+4, y-27, 6, 3); f(x+8, y-25, 2, 8)
  // Eyebrows
  f(x-5, y-19, 4, 1); f(x+2, y-19, 4, 1)
  // Eyes
  s(0xFFFFFF)
  f(x-5, y-17, 4, 3); f(x+2, y-17, 4, 3)
  s(0x2266CC)
  f(x-3, y-17, 2, 2); f(x+3, y-17, 2, 2)
  s(0x111111)
  f(x-3, y-16, 1, 1); f(x+4, y-16, 1, 1)
  // Nose
  s(0xD8A080)
  f(x, y-14, 2, 2)
  // Mouth
  s(0x995533)
  f(x-2, y-11, 5, 1)
  s(0xCC8866)
  f(x+2, y-12, 2, 1)
  // Stubble
  s(0xC09878)
  f(x-3, y-11, 1, 1); f(x+4, y-11, 1, 1)
  f(x-1, y-10, 1, 1); f(x+2, y-10, 1, 1)

  return grid
}

function buildColangeloGrid() {
  const { grid, s, f, x, y } = makeGrid()

  // Legs (walkFrame=0, legOffset=2)
  s(0x2A2A3A)
  f(x-7, y+6, 5, 16); f(x+2, y+6, 5, 12)
  // Shoes
  s(0x1A1A1A)
  f(x-8, y+20, 7, 3); f(x+1, y+16, 7, 3)
  // Body (dark charcoal suit)
  s(0x2A2A3A)
  f(x-9, y-10, 18, 18)
  // Suit jacket lapels
  s(0x1E1E2E)
  f(x-9, y-10, 2, 16); f(x+7, y-10, 2, 16)
  // Bright white dress shirt
  s(0xFFFFFF)
  f(x-4, y-10, 8, 14)
  // Collar base (behind head)
  s(0xFFFFFF)
  f(x-9, y-14, 2, 3); f(x+7, y-16, 2, 5); f(x+8, y-14, 1, 3)
  // Arms (armSwing=3)
  s(0x2A2A3A)
  f(x-13, y-5, 5, 12); f(x+8, y-11, 5, 12)
  // Hands
  s(0xE8B090)
  f(x-13, y+6, 5, 4); f(x+8, y+0, 5, 4)
  // Head
  s(0xE8B090)
  f(x-7, y-24, 14, 15)
  // Hair (dark brown, thinning)
  s(0x5C4633)
  f(x-8, y-26, 16, 3); f(x-8, y-24, 2, 6); f(x+6, y-24, 2, 6)
  // Eyes
  s(0xFFFFFF)
  f(x-4, y-18, 3, 2); f(x+1, y-18, 3, 2)
  s(0x333333)
  f(x-3, y-18, 1, 1); f(x+2, y-18, 1, 1)
  // Nose
  s(0xD8A080)
  f(x-1, y-16, 2, 2)
  // Mouth
  s(0x996655)
  f(x-2, y-13, 4, 1)
  // Chin
  s(0xD8A080)
  f(x-3, y-11, 6, 1)
  // THE BIG COLLAR — drawn over the face
  s(0xFFFFFF)
  f(x-7, y-18, 4, 9); f(x-8, y-16, 1, 5); f(x-9, y-14, 1, 3)
  f(x+3, y-18, 4, 9); f(x+7, y-16, 1, 5); f(x+8, y-14, 1, 3)
  f(x-3, y-14, 6, 5); f(x-5, y-15, 2, 6); f(x+3, y-15, 2, 6)
  // Collar tips (shadow)
  s(0xE8E0E0)
  f(x-7, y-18, 4, 1); f(x+3, y-18, 4, 1)
  f(x-9, y-14, 1, 1); f(x+8, y-14, 1, 1)
  f(x-3, y-14, 6, 1)

  return grid
}

function buildSilverGrid() {
  const { grid, s, f, x, y } = makeGrid()

  // Legs (walkFrame=0, legOffset=2)
  s(0x2A2A3A)
  f(x-6, y+6, 5, 14); f(x+1, y+6, 5, 10)
  // Shoes
  s(0x1A1A1A)
  f(x-7, y+18, 7, 3); f(x, y+14, 7, 3)
  // Body (narrow)
  s(0x2A2A3A)
  f(x-7, y-8, 14, 16)
  // Lapels
  s(0x1E1E2E)
  f(x-7, y-8, 2, 14); f(x+5, y-8, 2, 14)
  // Shirt
  s(0xFFFFFF)
  f(x-2, y-8, 4, 12)
  // Tie
  s(0xCC2222)
  f(x-1, y-8, 2, 10); f(x, y+2, 1, 2)
  // Arms (armSwing=3)
  s(0x2A2A3A)
  f(x-11, y-3, 5, 10); f(x+6, y-9, 5, 10)
  // Hands
  s(0xD8A878)
  f(x-11, y+6, 5, 3); f(x+6, y+0, 5, 3)
  // Neck (long, snake-like)
  s(0xD8A878)
  f(x-3, y-16, 6, 9)
  // Scales on neck
  s(0xC0A060)
  f(x-2, y-14, 1, 1); f(x+1, y-12, 1, 1); f(x-1, y-10, 1, 1)
  // Head (bald, elongated)
  s(0xD8A878)
  f(x-6, y-26, 12, 11)
  // Bald dome highlight
  s(0xE0B888)
  f(x-3, y-27, 6, 2); f(x-4, y-26, 1, 1); f(x+3, y-26, 1, 1)
  // Ears
  s(0xC89868)
  f(x-7, y-22, 1, 4); f(x+6, y-22, 1, 4)
  // Glasses frames
  s(0x333333)
  f(x-5, y-22, 5, 1); f(x-5, y-19, 5, 1)
  f(x-5, y-22, 1, 4); f(x-1, y-22, 1, 4)
  f(x-1, y-21, 2, 1)
  f(x+1, y-22, 5, 1); f(x+1, y-19, 5, 1)
  f(x+1, y-22, 1, 4); f(x+5, y-22, 1, 4)
  // Eyes (reptilian)
  s(0x111111)
  f(x-3, y-21, 2, 2); f(x+2, y-21, 2, 2)
  s(0x448844)
  f(x-3, y-21, 1, 2); f(x+3, y-21, 1, 2)
  // Nose
  s(0xC89868)
  f(x, y-18, 1, 2)
  // Mouth
  s(0x996655)
  f(x-3, y-16, 6, 1)
  s(0xCC2222)
  f(x+3, y-16, 1, 1)

  return grid
}

const CHARACTERS = {
  hinkie: { label: 'HINKIE V2', builder: buildHinkieGrid, palette: HINKIE_PALETTE },
  colangelo: { label: 'COLANGELO', builder: buildColangeloGrid, palette: COLANGELO_PALETTE },
  silver: { label: 'ADAM SILVER', builder: buildSilverGrid, palette: SILVER_PALETTE },
}

export default function PixelEditor() {
  const params = new URLSearchParams(window.location.search)
  const initialChar = CHARACTERS[params.get('char')] ? params.get('char') : 'hinkie'
  const [charKey, setCharKey] = useState(initialChar)
  const char = CHARACTERS[charKey]
  const PALETTE = char.palette

  const [grid, setGrid] = useState(() => char.builder())
  const [selectedColor, setSelectedColor] = useState(PALETTE[1].num)
  const [history, setHistory] = useState([])
  const [isPainting, setIsPainting] = useState(false)
  const [hoverCell, setHoverCell] = useState(null)
  const [showGrid, setShowGrid] = useState(true)
  const gridCanvasRef = useRef(null)
  const previewCanvasRef = useRef(null)

  const switchChar = useCallback((key) => {
    setCharKey(key)
    setGrid(CHARACTERS[key].builder())
    setSelectedColor(CHARACTERS[key].palette[1].num)
    setHistory([])
    window.history.replaceState(null, '', `/editor?char=${key}`)
  }, [])

  useLayoutEffect(() => {
    document.body.style.overflow = 'auto'
    document.body.style.height = 'auto'
    document.body.style.position = 'static'
    const root = document.getElementById('root')
    root.style.height = 'auto'
    root.style.display = 'block'
    return () => {
      document.body.style.overflow = ''
      document.body.style.height = ''
      document.body.style.position = ''
      root.style.height = ''
      root.style.display = ''
    }
  }, [])

  // Draw editor grid
  useEffect(() => {
    const canvas = gridCanvasRef.current
    if (!canvas) return
    canvas.width = GW * CELL
    canvas.height = GH * CELL
    const ctx = canvas.getContext('2d')

    for (let gy = 0; gy < GH; gy++)
      for (let gx = 0; gx < GW; gx++) {
        const c = grid[gy][gx]
        ctx.fillStyle = c !== null ? hexNum(c) : ((gx + gy) % 2 === 0 ? '#1a1a1a' : '#222')
        ctx.fillRect(gx * CELL, gy * CELL, CELL, CELL)
      }

    if (showGrid) {
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'
      ctx.lineWidth = 1
      for (let i = 0; i <= GW; i++) {
        ctx.beginPath(); ctx.moveTo(i * CELL + 0.5, 0); ctx.lineTo(i * CELL + 0.5, GH * CELL); ctx.stroke()
      }
      for (let i = 0; i <= GH; i++) {
        ctx.beginPath(); ctx.moveTo(0, i * CELL + 0.5); ctx.lineTo(GW * CELL, i * CELL + 0.5); ctx.stroke()
      }
    }

    // Center crosshair
    ctx.strokeStyle = 'rgba(232,184,0,0.2)'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(CX * CELL + 0.5, 0); ctx.lineTo(CX * CELL + 0.5, GH * CELL); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(0, CY * CELL + 0.5); ctx.lineTo(GW * CELL, CY * CELL + 0.5); ctx.stroke()

    // Hover highlight
    if (hoverCell) {
      ctx.strokeStyle = '#E8B800'
      ctx.lineWidth = 2
      ctx.strokeRect(hoverCell.x * CELL + 1, hoverCell.y * CELL + 1, CELL - 2, CELL - 2)
    }
  }, [grid, showGrid, hoverCell])

  // Draw preview
  useEffect(() => {
    const canvas = previewCanvasRef.current
    if (!canvas) return
    const S = 4
    canvas.width = GW * S
    canvas.height = GH * S
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = false
    ctx.fillStyle = '#C0C0C0'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    for (let gy = 0; gy < GH; gy++)
      for (let gx = 0; gx < GW; gx++) {
        const c = grid[gy][gx]
        if (c !== null) {
          ctx.fillStyle = hexNum(c)
          ctx.fillRect(gx * S, gy * S, S, S)
        }
      }
  }, [grid])

  const getCellFromEvent = useCallback((e) => {
    const canvas = gridCanvasRef.current
    const rect = canvas.getBoundingClientRect()
    const sx = canvas.width / rect.width
    const sy = canvas.height / rect.height
    const gx = Math.floor((e.clientX - rect.left) * sx / CELL)
    const gy = Math.floor((e.clientY - rect.top) * sy / CELL)
    if (gx < 0 || gx >= GW || gy < 0 || gy >= GH) return null
    return { x: gx, y: gy }
  }, [])

  const paintCell = useCallback((gx, gy) => {
    setGrid(prev => {
      if (prev[gy][gx] === selectedColor) return prev
      const next = prev.map(row => [...row])
      next[gy][gx] = selectedColor
      return next
    })
  }, [selectedColor])

  const handleMouseDown = useCallback((e) => {
    e.preventDefault()
    const cell = getCellFromEvent(e)
    if (!cell) return
    setHistory(prev => [...prev, grid])
    setIsPainting(true)
    paintCell(cell.x, cell.y)
  }, [getCellFromEvent, grid, paintCell])

  const handleMouseMove = useCallback((e) => {
    const cell = getCellFromEvent(e)
    setHoverCell(cell)
    if (isPainting && cell) paintCell(cell.x, cell.y)
  }, [getCellFromEvent, isPainting, paintCell])

  const handleMouseUp = useCallback(() => setIsPainting(false), [])

  const undo = useCallback(() => {
    if (history.length === 0) return
    setGrid(history[history.length - 1])
    setHistory(prev => prev.slice(0, -1))
  }, [history])

  const reset = useCallback(() => {
    setHistory(prev => [...prev, grid])
    setGrid(char.builder())
  }, [grid, char])

  const exportCode = useCallback(() => {
    const colorMap = new Map()
    for (let gy = 0; gy < GH; gy++)
      for (let gx = 0; gx < GW; gx++) {
        const c = grid[gy][gx]
        if (c === null) continue
        if (!colorMap.has(c)) colorMap.set(c, [])
        colorMap.get(c).push({ x: gx, y: gy })
      }

    let code = ''
    for (const [num, pixels] of colorMap) {
      const hex = '0x' + num.toString(16).toUpperCase().padStart(6, '0')
      code += `setFill(ctx, ${hex})\n`
      pixels.sort((a, b) => a.y - b.y || a.x - b.x)

      // Find horizontal runs, then merge vertically
      const runs = []
      let i = 0
      while (i < pixels.length) {
        const sx = pixels[i].x, sy = pixels[i].y
        let len = 1
        while (i + len < pixels.length && pixels[i + len].y === sy && pixels[i + len].x === sx + len) len++
        runs.push({ x: sx, y: sy, w: len, h: 1 })
        i += len
      }

      // Merge adjacent vertical runs with same x and width
      for (let j = 0; j < runs.length; j++) {
        if (!runs[j]) continue
        for (let k = j + 1; k < runs.length; k++) {
          if (!runs[k]) continue
          if (runs[k].x === runs[j].x && runs[k].w === runs[j].w && runs[k].y === runs[j].y + runs[j].h) {
            runs[j].h++
            runs[k] = null
          }
        }
      }

      for (const run of runs) {
        if (!run) continue
        const rx = run.x - CX, ry = run.y - CY
        const xs = rx >= 0 ? `x + ${rx}` : `x - ${-rx}`
        const ys = ry >= 0 ? `y + ${ry}` : `y - ${-ry}`
        code += `fillRect(ctx, ${xs}, ${ys}, ${run.w}, ${run.h})\n`
      }
      code += '\n'
    }
    navigator.clipboard.writeText(code)
    alert('Copied to clipboard!')
  }, [grid])

  const coordLabel = hoverCell
    ? `x${hoverCell.x - CX >= 0 ? '+' : ''}${hoverCell.x - CX}, y${hoverCell.y - CY >= 0 ? '+' : ''}${hoverCell.y - CY}`
    : '\u2014'

  const cellColor = hoverCell ? grid[hoverCell.y]?.[hoverCell.x] : null
  const cellColorLabel = hoverCell
    ? (cellColor !== null
      ? (PALETTE.find(p => p.num === cellColor)?.label || '0x' + cellColor.toString(16).toUpperCase())
      : 'EMPTY')
    : ''

  return (
    <div style={{ background: '#000', minHeight: '100vh', padding: 20, fontFamily: '"Press Start 2P", monospace' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, borderBottom: '1px solid #1a1a33', paddingBottom: 16 }}>
        <a href="/design" style={{ fontSize: 10, color: '#666', textDecoration: 'none', padding: '6px 12px', border: '1px solid #333', borderRadius: 4 }}>BACK</a>
        <h1 style={{ fontSize: 14, color: '#E8B800', margin: 0 }}>PIXEL EDITOR</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {Object.entries(CHARACTERS).map(([key, c]) => (
            <button
              key={key}
              onClick={() => switchChar(key)}
              style={{
                fontSize: 8,
                fontFamily: '"Press Start 2P"',
                padding: '6px 10px',
                background: key === charKey ? '#2a1a00' : '#111',
                color: key === charKey ? '#E8B800' : '#555',
                border: `1px solid ${key === charKey ? '#E8B800' : '#333'}`,
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >{c.label}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        {/* Grid canvas */}
        <div style={{ maxHeight: '80vh', overflow: 'auto', border: '2px solid #333', borderRadius: 4, flexShrink: 0 }}>
          <canvas
            ref={gridCanvasRef}
            style={{ cursor: 'crosshair', display: 'block', imageRendering: 'pixelated' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => { handleMouseUp(); setHoverCell(null) }}
            onContextMenu={e => e.preventDefault()}
          />
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 180 }}>
          {/* Coordinate display */}
          <div style={{ background: '#0a0a1a', padding: '8px 12px', borderRadius: 4, border: '1px solid #1a1a33' }}>
            <div style={{ fontSize: 8, color: '#555', marginBottom: 4 }}>POSITION</div>
            <div style={{ fontSize: 12, color: '#E8B800' }}>{coordLabel}</div>
            <div style={{ fontSize: 8, color: '#666', marginTop: 2 }}>{cellColorLabel}</div>
          </div>

          {/* Preview */}
          <div>
            <div style={{ fontSize: 8, color: '#555', marginBottom: 6 }}>PREVIEW</div>
            <canvas
              ref={previewCanvasRef}
              style={{ width: GW * 4, height: GH * 4, imageRendering: 'pixelated', border: '2px solid #333', borderRadius: 4, display: 'block' }}
            />
          </div>

          {/* Palette */}
          <div>
            <div style={{ fontSize: 8, color: '#555', marginBottom: 6 }}>COLOR</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3 }}>
              {PALETTE.map((p, i) => {
                const isSelected = selectedColor === p.num
                const bright = p.num !== null && ((p.num >> 16 & 0xFF) + (p.num >> 8 & 0xFF) + (p.num & 0xFF)) > 300
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedColor(p.num)}
                    style={{
                      height: 28,
                      background: p.num !== null ? hexNum(p.num) : '#0a0a0a',
                      border: isSelected ? '2px solid #E8B800' : '1px solid #333',
                      borderRadius: 3,
                      cursor: 'pointer',
                      fontSize: 5,
                      fontFamily: '"Press Start 2P"',
                      color: bright ? '#000' : '#aaa',
                      padding: 0,
                    }}
                  >{p.label}</button>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button onClick={undo} disabled={history.length === 0} style={btnStyle(false)}>
              UNDO ({history.length})
            </button>
            <button onClick={reset} style={btnStyle(false)}>RESET</button>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 8, color: '#888', cursor: 'pointer' }}>
              <input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} />
              GRID
            </label>
            <button onClick={exportCode} style={btnStyle(true)}>EXPORT CODE</button>
          </div>

          <div style={{ fontSize: 7, color: '#444', lineHeight: 1.6 }}>
            CLICK TO PAINT<br />
            SELECT ERASE TO REMOVE<br />
            YELLOW CROSS = CENTER
          </div>
        </div>
      </div>
    </div>
  )
}

function btnStyle(primary) {
  return {
    padding: '8px 12px',
    fontSize: 8,
    fontFamily: '"Press Start 2P"',
    background: primary ? '#2a1a00' : '#1a1a33',
    color: primary ? '#E8B800' : '#888',
    border: `1px solid ${primary ? '#E8B800' : '#333'}`,
    borderRadius: 4,
    cursor: 'pointer',
  }
}
