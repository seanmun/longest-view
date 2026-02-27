import { useState, useEffect, useCallback, useRef } from 'react'
import VirtualInput from '../game/systems/VirtualInput.js'
import { AudioSystem } from '../game/systems/AudioSystem.js'

// D-Pad component — calculates direction from touch position
function DPad() {
  const dpadRef = useRef(null)
  const [active, setActive] = useState({ left: false, right: false, up: false, down: false })

  const updateDirection = useCallback((touches) => {
    if (!dpadRef.current) return
    const rect = dpadRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    let left = false, right = false, up = false, down = false

    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i]
      const dx = touch.clientX - centerX
      const dy = touch.clientY - centerY
      const maxR = rect.width * 0.6

      if (Math.abs(dx) < maxR && Math.abs(dy) < maxR) {
        const deadzone = rect.width * 0.12
        if (dx < -deadzone) left = true
        if (dx > deadzone) right = true
        if (dy < -deadzone) up = true
        if (dy > deadzone) down = true
      }
    }

    VirtualInput.left = left
    VirtualInput.right = right
    VirtualInput.up = up
    VirtualInput.down = down
    setActive({ left, right, up, down })
  }, [])

  const handleTouch = useCallback((e) => {
    e.preventDefault()
    AudioSystem.resume()
    updateDirection(e.touches)
  }, [updateDirection])

  const handleTouchEnd = useCallback((e) => {
    e.preventDefault()
    updateDirection(e.touches)
  }, [updateDirection])

  useEffect(() => {
    const el = dpadRef.current
    if (!el) return
    el.addEventListener('touchstart', handleTouch, { passive: false })
    el.addEventListener('touchmove', handleTouch, { passive: false })
    el.addEventListener('touchend', handleTouchEnd, { passive: false })
    el.addEventListener('touchcancel', handleTouchEnd, { passive: false })
    return () => {
      el.removeEventListener('touchstart', handleTouch)
      el.removeEventListener('touchmove', handleTouch)
      el.removeEventListener('touchend', handleTouchEnd)
      el.removeEventListener('touchcancel', handleTouchEnd)
    }
  }, [handleTouch, handleTouchEnd])

  const btnBase = 'absolute flex items-center justify-center text-[10px] font-bold'
  const size = 36

  return (
    <div ref={dpadRef} className="relative" style={{ width: 110, height: 110 }}>
      {/* Up */}
      <div className={btnBase} style={{
        left: '50%', top: 0, transform: 'translateX(-50%)',
        width: size, height: size, borderRadius: 4,
        backgroundColor: active.up ? '#555' : '#333',
        color: active.up ? '#fff' : '#888'
      }}>&#9650;</div>
      {/* Down */}
      <div className={btnBase} style={{
        left: '50%', bottom: 0, transform: 'translateX(-50%)',
        width: size, height: size, borderRadius: 4,
        backgroundColor: active.down ? '#555' : '#333',
        color: active.down ? '#fff' : '#888'
      }}>&#9660;</div>
      {/* Left */}
      <div className={btnBase} style={{
        top: '50%', left: 0, transform: 'translateY(-50%)',
        width: size, height: size, borderRadius: 4,
        backgroundColor: active.left ? '#555' : '#333',
        color: active.left ? '#fff' : '#888'
      }}>&#9664;</div>
      {/* Right */}
      <div className={btnBase} style={{
        top: '50%', right: 0, transform: 'translateY(-50%)',
        width: size, height: size, borderRadius: 4,
        backgroundColor: active.right ? '#555' : '#333',
        color: active.right ? '#fff' : '#888'
      }}>&#9654;</div>
      {/* Center */}
      <div className="absolute" style={{
        top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: size - 4, height: size - 4, borderRadius: 4,
        backgroundColor: '#2a2a2a'
      }} />
    </div>
  )
}

// Action button (A or B)
function ActionButton({ label, color, pressedColor, onPress, onRelease, size = 52 }) {
  const [pressed, setPressed] = useState(false)
  const btnRef = useRef(null)

  useEffect(() => {
    const el = btnRef.current
    if (!el) return

    const handleStart = (e) => {
      e.preventDefault()
      AudioSystem.resume()
      setPressed(true)
      onPress()
    }
    const handleEnd = (e) => {
      e.preventDefault()
      setPressed(false)
      onRelease()
    }

    el.addEventListener('touchstart', handleStart, { passive: false })
    el.addEventListener('touchend', handleEnd, { passive: false })
    el.addEventListener('touchcancel', handleEnd, { passive: false })
    return () => {
      el.removeEventListener('touchstart', handleStart)
      el.removeEventListener('touchend', handleEnd)
      el.removeEventListener('touchcancel', handleEnd)
    }
  }, [onPress, onRelease])

  return (
    <div ref={btnRef} style={{
      width: size, height: size, borderRadius: '50%',
      backgroundColor: pressed ? pressedColor : color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '"Press Start 2P", monospace',
      fontSize: size > 40 ? 14 : 10,
      color: '#000',
      fontWeight: 'bold',
      boxShadow: pressed ? 'inset 0 2px 4px rgba(0,0,0,0.5)' : '0 3px 0 rgba(0,0,0,0.4)',
      transform: pressed ? 'translateY(2px)' : 'none',
      transition: 'transform 0.05s, box-shadow 0.05s',
      cursor: 'pointer',
      userSelect: 'none',
      WebkitTouchCallout: 'none',
    }}>
      {label}
    </div>
  )
}

// Small system button (SELECT / START)
function SystemButton({ label, onPress }) {
  const btnRef = useRef(null)
  const [pressed, setPressed] = useState(false)

  useEffect(() => {
    const el = btnRef.current
    if (!el) return

    const handleStart = (e) => {
      e.preventDefault()
      AudioSystem.resume()
      setPressed(true)
      onPress()
    }
    const handleEnd = (e) => {
      e.preventDefault()
      setPressed(false)
    }

    el.addEventListener('touchstart', handleStart, { passive: false })
    el.addEventListener('touchend', handleEnd, { passive: false })
    el.addEventListener('touchcancel', handleEnd, { passive: false })
    return () => {
      el.removeEventListener('touchstart', handleStart)
      el.removeEventListener('touchend', handleEnd)
      el.removeEventListener('touchcancel', handleEnd)
    }
  }, [onPress])

  return (
    <div ref={btnRef} style={{
      padding: '6px 14px',
      borderRadius: 12,
      backgroundColor: pressed ? '#555' : '#444',
      fontFamily: '"Press Start 2P", monospace',
      fontSize: 6,
      color: '#aaa',
      transform: `rotate(-25deg) ${pressed ? 'translateY(1px)' : ''}`,
      userSelect: 'none',
      WebkitTouchCallout: 'none',
    }}>
      {label}
    </div>
  )
}

// Speaker grille dots
function SpeakerGrille() {
  const dots = []
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 3; col++) {
      dots.push(
        <div key={`${row}-${col}`} style={{
          width: 4, height: 4, borderRadius: '50%',
          backgroundColor: '#5a4580',
          margin: 2,
        }} />
      )
    }
  }
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 8px)',
      gap: 0,
    }}>
      {dots}
    </div>
  )
}

// Handlers for button actions
const pressA = () => { VirtualInput.actionA = true }
const releaseA = () => { VirtualInput.actionA = false }
const pressB = () => { VirtualInput.actionB = true }
const releaseB = () => { VirtualInput.actionB = false }
const pressSelect = () => {
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }))
}
const pressStart = () => {
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }))
  setTimeout(() => {
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', bubbles: true }))
  }, 100)
}

// ============================================
// GAMEBOY LAYOUT (Portrait)
// ============================================
function GameboyShell({ children }) {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: '#6B4FA0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      borderRadius: 0,
      overflow: 'hidden',
      fontFamily: '"Press Start 2P", monospace',
      paddingTop: 'env(safe-area-inset-top, 8px)',
      paddingBottom: 'env(safe-area-inset-bottom, 8px)',
    }}>
      {/* Screen bezel */}
      <div style={{
        width: '92%',
        flex: '0 0 auto',
        backgroundColor: '#2a2040',
        borderRadius: 8,
        padding: '8px 6px',
        marginTop: 8,
        boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)',
      }}>
        {/* Power LED */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          marginBottom: 4,
          marginLeft: 4,
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            backgroundColor: '#00ff44',
            boxShadow: '0 0 4px #00ff44',
          }} />
          <span style={{ fontSize: 5, color: '#888' }}>BATTERY</span>
        </div>

        {/* Game canvas container */}
        <div style={{
          width: '100%',
          aspectRatio: '9 / 4',
          backgroundColor: '#0a0a1a',
          borderRadius: 4,
          overflow: 'hidden',
          position: 'relative',
        }}>
          {children}
        </div>
      </div>

      {/* Label */}
      <div style={{
        fontSize: 7,
        color: '#3d2d6b',
        marginTop: 6,
        letterSpacing: 2,
        fontWeight: 'bold',
      }}>
        LONGEST VIEW
      </div>

      {/* Controls area */}
      <div style={{
        flex: 1,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 16px',
        minHeight: 0,
      }}>
        {/* D-pad + Action buttons row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
        }}>
          {/* D-Pad */}
          <DPad />

          {/* A + B buttons — angled like real Gameboy */}
          <div style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            transform: 'rotate(-15deg)',
          }}>
            <div style={{ marginTop: 20 }}>
              <ActionButton
                label="B"
                color="#00D4FF"
                pressedColor="#0099BB"
                onPress={pressB}
                onRelease={releaseB}
              />
              <div style={{ fontSize: 6, color: '#3d2d6b', textAlign: 'center', marginTop: 4 }}>JUMP</div>
            </div>
            <div>
              <ActionButton
                label="A"
                color="#E8B800"
                pressedColor="#B08E00"
                onPress={pressA}
                onRelease={releaseA}
              />
              <div style={{ fontSize: 6, color: '#3d2d6b', textAlign: 'center', marginTop: 4 }}>FIRE</div>
            </div>
          </div>
        </div>

        {/* SELECT + START row */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 20,
          marginTop: 12,
        }}>
          <SystemButton label="SELECT" onPress={pressSelect} />
          <SystemButton label="START" onPress={pressStart} />
        </div>
      </div>

      {/* Speaker grille */}
      <div style={{
        position: 'absolute',
        bottom: 'calc(env(safe-area-inset-bottom, 8px) + 16px)',
        right: 24,
      }}>
        <SpeakerGrille />
      </div>
    </div>
  )
}

// ============================================
// GAME GEAR LAYOUT (Landscape)
// ============================================
function GameGearShell({ children }) {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: '#1a1a2e',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      fontFamily: '"Press Start 2P", monospace',
      padding: '0 env(safe-area-inset-right, 0px) 0 env(safe-area-inset-left, 0px)',
    }}>
      {/* Left controls */}
      <div style={{
        flex: '0 0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        padding: '0 8px',
      }}>
        <DPad />
        <SystemButton label="SELECT" onPress={pressSelect} />
      </div>

      {/* Center screen */}
      <div style={{
        flex: 1,
        maxWidth: '60%',
        backgroundColor: '#0f0f1e',
        borderRadius: 6,
        padding: 6,
        boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)',
        margin: '0 8px',
      }}>
        <div style={{
          width: '100%',
          aspectRatio: '9 / 4',
          backgroundColor: '#0a0a1a',
          borderRadius: 4,
          overflow: 'hidden',
          position: 'relative',
        }}>
          {children}
        </div>
      </div>

      {/* Right controls */}
      <div style={{
        flex: '0 0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        padding: '0 8px',
      }}>
        <div style={{
          display: 'flex',
          gap: 10,
          alignItems: 'center',
        }}>
          <div style={{ textAlign: 'center' }}>
            <ActionButton
              label="B"
              color="#00D4FF"
              pressedColor="#0099BB"
              onPress={pressB}
              onRelease={releaseB}
              size={44}
            />
            <div style={{ fontSize: 5, color: '#555', marginTop: 3 }}>JUMP</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <ActionButton
              label="A"
              color="#E8B800"
              pressedColor="#B08E00"
              onPress={pressA}
              onRelease={releaseA}
              size={44}
            />
            <div style={{ fontSize: 5, color: '#555', marginTop: 3 }}>FIRE</div>
          </div>
        </div>
        <SystemButton label="START" onPress={pressStart} />
      </div>
    </div>
  )
}

// ============================================
// MAIN EXPORT — detects mobile + orientation
// ============================================
export default function MobileControls({ children }) {
  const [isMobile, setIsMobile] = useState(false)
  const [orientation, setOrientation] = useState('portrait')

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768 || ('ontouchstart' in window && window.innerWidth < 1024)
      setIsMobile(mobile)
      VirtualInput.isMobile = mobile

      if (mobile) {
        setOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait')
      }
    }

    check()
    window.addEventListener('resize', check)
    window.addEventListener('orientationchange', () => setTimeout(check, 150))
    return () => {
      window.removeEventListener('resize', check)
    }
  }, [])

  if (!isMobile) return children

  return orientation === 'portrait'
    ? <GameboyShell>{children}</GameboyShell>
    : <GameGearShell>{children}</GameGearShell>
}
