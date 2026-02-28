import { useState, useEffect, useCallback, useRef } from 'react'
import VirtualInput from '../game/systems/VirtualInput.js'
import { AudioSystem } from '../game/systems/AudioSystem.js'

// D-Pad component — calculates direction from touch position
function DPad() {
  const dpadRef = useRef(null)
  const [active, setActive] = useState({ left: false, right: false, up: false, down: false })

  const updateFromTouches = useCallback((touchList) => {
    if (!dpadRef.current) return
    const rect = dpadRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    let left = false, right = false, up = false, down = false

    for (let i = 0; i < touchList.length; i++) {
      const touch = touchList[i]
      const dx = touch.clientX - centerX
      const dy = touch.clientY - centerY

      // Only count touches within the D-pad area
      if (Math.abs(dx) > rect.width * 0.7 || Math.abs(dy) > rect.height * 0.7) continue

      const deadzone = 10
      if (dx < -deadzone) left = true
      if (dx > deadzone) right = true
      if (dy < -deadzone) up = true
      if (dy > deadzone) down = true
    }

    VirtualInput.left = left
    VirtualInput.right = right
    VirtualInput.up = up
    VirtualInput.down = down
    setActive({ left, right, up, down })
  }, [])

  useEffect(() => {
    const el = dpadRef.current
    if (!el) return

    const onTouch = (e) => {
      e.preventDefault()
      e.stopPropagation()
      AudioSystem.resume()
      updateFromTouches(e.touches)
    }
    const onEnd = (e) => {
      e.preventDefault()
      e.stopPropagation()
      updateFromTouches(e.touches)
    }

    el.addEventListener('touchstart', onTouch, { passive: false })
    el.addEventListener('touchmove', onTouch, { passive: false })
    el.addEventListener('touchend', onEnd, { passive: false })
    el.addEventListener('touchcancel', onEnd, { passive: false })
    return () => {
      el.removeEventListener('touchstart', onTouch)
      el.removeEventListener('touchmove', onTouch)
      el.removeEventListener('touchend', onEnd)
      el.removeEventListener('touchcancel', onEnd)
    }
  }, [updateFromTouches])

  const size = 38

  return (
    <div ref={dpadRef} style={{
      width: 120, height: 120, position: 'relative',
      touchAction: 'none', WebkitTouchCallout: 'none', userSelect: 'none',
    }}>
      {/* Up */}
      <div style={{
        position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)',
        width: size, height: size, borderRadius: 4,
        backgroundColor: active.up ? '#666' : '#333',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, color: active.up ? '#fff' : '#888',
      }}>&#9650;</div>
      {/* Down */}
      <div style={{
        position: 'absolute', left: '50%', bottom: 0, transform: 'translateX(-50%)',
        width: size, height: size, borderRadius: 4,
        backgroundColor: active.down ? '#666' : '#333',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, color: active.down ? '#fff' : '#888',
      }}>&#9660;</div>
      {/* Left */}
      <div style={{
        position: 'absolute', top: '50%', left: 0, transform: 'translateY(-50%)',
        width: size, height: size, borderRadius: 4,
        backgroundColor: active.left ? '#666' : '#333',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, color: active.left ? '#fff' : '#888',
      }}>&#9664;</div>
      {/* Right */}
      <div style={{
        position: 'absolute', top: '50%', right: 0, transform: 'translateY(-50%)',
        width: size, height: size, borderRadius: 4,
        backgroundColor: active.right ? '#666' : '#333',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, color: active.right ? '#fff' : '#888',
      }}>&#9654;</div>
      {/* Center */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: size - 6, height: size - 6, borderRadius: 4,
        backgroundColor: '#2a2a2a',
      }} />
    </div>
  )
}

// Action button (A or B)
function ActionButton({ label, color, pressedColor, onPress, onRelease, size = 56 }) {
  const [pressed, setPressed] = useState(false)
  const btnRef = useRef(null)

  useEffect(() => {
    const el = btnRef.current
    if (!el) return

    const handleStart = (e) => {
      e.preventDefault()
      e.stopPropagation()
      AudioSystem.resume()
      setPressed(true)
      onPress()
    }
    const handleEnd = (e) => {
      e.preventDefault()
      e.stopPropagation()
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
      fontSize: size > 44 ? 14 : 10,
      color: '#000',
      fontWeight: 'bold',
      boxShadow: pressed ? 'inset 0 2px 4px rgba(0,0,0,0.5)' : '0 3px 0 rgba(0,0,0,0.4)',
      transform: pressed ? 'translateY(2px)' : 'none',
      touchAction: 'none',
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
      e.stopPropagation()
      AudioSystem.resume()
      setPressed(true)
      onPress()
    }
    const handleEnd = (e) => {
      e.preventDefault()
      e.stopPropagation()
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
      padding: '8px 18px',
      borderRadius: 12,
      backgroundColor: pressed ? '#555' : '#444',
      fontFamily: '"Press Start 2P", monospace',
      fontSize: 7,
      color: '#aaa',
      transform: `rotate(-25deg) ${pressed ? 'translateY(1px)' : ''}`,
      touchAction: 'none',
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
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 8px)' }}>
      {dots}
    </div>
  )
}

// Button action handlers
const pressA = () => { VirtualInput.actionA = true }
const releaseA = () => { VirtualInput.actionA = false }
const pressB = () => { VirtualInput.actionB = true }
const releaseB = () => { VirtualInput.actionB = false }
const pressSelect = () => {
  window.dispatchEvent(new CustomEvent('game-select'))
}
const pressStart = () => {
  window.dispatchEvent(new CustomEvent('game-start'))
}

// ============================================
// GAMEBOY LAYOUT (Portrait)
// ============================================
function GameboyShell({ children }) {
  return (
    <div style={{
      width: '100vw',
      height: '100dvh',
      backgroundColor: '#6B4FA0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      overflow: 'hidden',
      fontFamily: '"Press Start 2P", monospace',
      position: 'fixed',
      top: 0,
      left: 0,
    }}>
      {/* Screen bezel */}
      <div style={{
        width: '94%',
        flex: '1 1 auto',
        backgroundColor: '#2a2040',
        borderRadius: 8,
        padding: '6px',
        marginTop: 'max(env(safe-area-inset-top, 4px), 4px)',
        boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}>
        {/* Power LED */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          marginBottom: 3, marginLeft: 4, flex: '0 0 auto',
        }}>
          <div style={{
            width: 5, height: 5, borderRadius: '50%',
            backgroundColor: '#00ff44',
            boxShadow: '0 0 4px #00ff44',
          }} />
          <span style={{ fontSize: 4, color: '#888' }}>BATTERY</span>
        </div>

        {/* Game canvas container — fills available bezel space */}
        <div style={{
          width: '100%',
          flex: '1 1 auto',
          backgroundColor: '#0a0a1a',
          borderRadius: 4,
          overflow: 'hidden',
          position: 'relative',
          minHeight: 0,
        }}>
          {children}
        </div>
      </div>

      {/* Label */}
      <div style={{
        fontSize: 6,
        color: '#3d2d6b',
        marginTop: 4,
        letterSpacing: 2,
        fontWeight: 'bold',
        flex: '0 0 auto',
      }}>
        LONGEST VIEW
      </div>

      {/* Controls area */}
      <div style={{
        flex: '0 0 auto',
        width: '100%',
        padding: '8px 20px',
        paddingBottom: 'max(env(safe-area-inset-bottom, 8px), 8px)',
      }}>
        {/* D-pad + Action buttons row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
        }}>
          <DPad />

          {/* A + B buttons — angled like real Gameboy */}
          <div style={{
            display: 'flex', gap: 14, alignItems: 'center',
            transform: 'rotate(-15deg)',
          }}>
            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <ActionButton label="B" color="#00D4FF" pressedColor="#0099BB" onPress={pressB} onRelease={releaseB} />
              <div style={{ fontSize: 6, color: '#3d2d6b', marginTop: 4 }}>JUMP</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <ActionButton label="A" color="#E8B800" pressedColor="#B08E00" onPress={pressA} onRelease={releaseA} />
              <div style={{ fontSize: 6, color: '#3d2d6b', marginTop: 4 }}>FIRE</div>
            </div>
          </div>
        </div>

        {/* SELECT + START row */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 24, marginTop: 10,
        }}>
          <SystemButton label="SELECT" onPress={pressSelect} />
          <SystemButton label="START" onPress={pressStart} />
        </div>
      </div>

      {/* Speaker grille */}
      <div style={{
        position: 'absolute',
        bottom: 'max(calc(env(safe-area-inset-bottom, 8px) + 12px), 20px)',
        right: 20,
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
      height: '100dvh',
      backgroundColor: '#1a1a2e',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      fontFamily: '"Press Start 2P", monospace',
      position: 'fixed',
      top: 0,
      left: 0,
      padding: '0 max(env(safe-area-inset-right, 8px), 8px) 0 max(env(safe-area-inset-left, 8px), 8px)',
    }}>
      {/* Left controls */}
      <div style={{
        flex: '0 0 auto', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 10, padding: '0 6px',
      }}>
        <DPad />
        <SystemButton label="SELECT" onPress={pressSelect} />
      </div>

      {/* Center screen */}
      <div style={{
        flex: 1, maxWidth: '58%',
        backgroundColor: '#0f0f1e', borderRadius: 6,
        padding: 5,
        boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)',
        margin: '0 6px',
        display: 'flex',
        height: '85%',
      }}>
        <div style={{
          width: '100%', height: '100%',
          backgroundColor: '#0a0a1a', borderRadius: 4,
          overflow: 'hidden', position: 'relative',
        }}>
          {children}
        </div>
      </div>

      {/* Right controls */}
      <div style={{
        flex: '0 0 auto', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 10, padding: '0 6px',
      }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <ActionButton label="B" color="#00D4FF" pressedColor="#0099BB" onPress={pressB} onRelease={releaseB} size={46} />
            <div style={{ fontSize: 5, color: '#555', marginTop: 3 }}>JUMP</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <ActionButton label="A" color="#E8B800" pressedColor="#B08E00" onPress={pressA} onRelease={releaseA} size={46} />
            <div style={{ fontSize: 5, color: '#555', marginTop: 3 }}>FIRE</div>
          </div>
        </div>
        <SystemButton label="START" onPress={pressStart} />
      </div>
    </div>
  )
}

// ============================================
// MAIN EXPORT
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
    return () => window.removeEventListener('resize', check)
  }, [])

  if (!isMobile) return children

  return orientation === 'portrait'
    ? <GameboyShell>{children}</GameboyShell>
    : <GameGearShell>{children}</GameGearShell>
}
