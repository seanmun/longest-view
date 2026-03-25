import { useState, useEffect, useCallback, useRef } from 'react'
import { saveScore } from '../lib/scores.js'
import { AudioSystem } from '../game/systems/AudioSystem.js'
import VirtualInput from '../game/systems/VirtualInput.js'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export default function InitialsEntry({ game }) {
  const [show, setShow] = useState(false)
  const [data, setData] = useState(null)
  const [letters, setLetters] = useState([0, 0, 0]) // indices into LETTERS
  const [activeSlot, setActiveSlot] = useState(0)
  const stateRef = useRef({ letters: [0, 0, 0], activeSlot: 0 })

  // Keep ref in sync for polling callback
  useEffect(() => {
    stateRef.current = { letters, activeSlot }
  }, [letters, activeSlot])

  useEffect(() => {
    if (!game) return
    const onChange = (_, key, value) => {
      if (key === 'showInitialsEntry') {
        setShow(value)
        if (value) {
          setLetters([0, 0, 0])
          setActiveSlot(0)
        }
      }
      if (key === 'initialsEntryData') setData(value)
    }
    game.registry.events.on('changedata', onChange)
    game.registry.events.on('setdata', onChange)
    return () => {
      game.registry.events.off('changedata', onChange)
      game.registry.events.off('setdata', onChange)
    }
  }, [game])

  const confirm = useCallback(() => {
    if (!data || !game) return
    AudioSystem.playMenuConfirm()
    const { letters: cur } = stateRef.current
    const initials = cur.map(i => LETTERS[i]).join('')
    saveScore(initials, data.score, data.time)

    game.registry.set('showInitialsEntry', false)
    game.registry.set('leaderboardHighlight', { initials, score: data.score })
    game.registry.set('showLeaderboard', true)
  }, [data, game])

  const cycleLetter = useCallback((dir) => {
    AudioSystem.playMenuSelect()
    setLetters(prev => {
      const next = [...prev]
      const slot = stateRef.current.activeSlot
      next[slot] = (next[slot] + dir + 26) % 26
      return next
    })
  }, [])

  const advanceSlot = useCallback(() => {
    const slot = stateRef.current.activeSlot
    if (slot < 2) {
      AudioSystem.playMenuSelect()
      setActiveSlot(prev => prev + 1)
    } else {
      confirm()
    }
  }, [confirm])

  const goBackSlot = useCallback(() => {
    const slot = stateRef.current.activeSlot
    if (slot > 0) {
      AudioSystem.playMenuSelect()
      setActiveSlot(prev => prev - 1)
    }
  }, [])

  // Keyboard input
  useEffect(() => {
    if (!show) return

    const handleKey = (e) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault()
          cycleLetter(-1)
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault()
          cycleLetter(1)
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault()
          advanceSlot()
          break
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault()
          goBackSlot()
          break
        case 'Enter':
          e.preventDefault()
          confirm()
          break
      }
    }

    // Mobile START button for confirm
    const handleStart = () => confirm()

    window.addEventListener('keydown', handleKey)
    window.addEventListener('game-start', handleStart)

    return () => {
      window.removeEventListener('keydown', handleKey)
      window.removeEventListener('game-start', handleStart)
    }
  }, [show, cycleLetter, advanceSlot, goBackSlot, confirm])

  // Mobile D-pad polling (VirtualInput is flag-based, not event-based)
  useEffect(() => {
    if (!show || !VirtualInput.isMobile) return

    const prevState = { up: false, down: false, left: false, right: false }
    const interval = setInterval(() => {
      // Detect rising edges (flag just became true)
      if (VirtualInput.up && !prevState.up) cycleLetter(-1)
      if (VirtualInput.down && !prevState.down) cycleLetter(1)
      if (VirtualInput.right && !prevState.right) advanceSlot()
      if (VirtualInput.left && !prevState.left) goBackSlot()

      prevState.up = VirtualInput.up
      prevState.down = VirtualInput.down
      prevState.left = VirtualInput.left
      prevState.right = VirtualInput.right
    }, 100)

    return () => clearInterval(interval)
  }, [show, cycleLetter, advanceSlot, goBackSlot])

  if (!show || !data) return null

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/90"
      style={{ fontFamily: '"Press Start 2P", monospace' }}>
      <div className="text-center p-6">
        <div className="text-[16px] mb-2" style={{ color: '#E8B800' }}>
          ENTER YOUR INITIALS
        </div>

        <div className="text-[10px] text-gray-400 mb-8">
          SCORE: {data.score.toLocaleString()}
        </div>

        {/* Letter slots */}
        <div className="flex justify-center gap-6 mb-8">
          {letters.map((letterIdx, slot) => (
            <div key={slot} className="text-center">
              {/* Up arrow */}
              <div className="text-[8px] mb-1"
                style={{ color: slot === activeSlot ? '#00D4FF' : 'transparent' }}>
                ▲
              </div>

              {/* Letter */}
              <div className="text-[32px] px-3 py-2 border-b-4"
                style={{
                  color: slot === activeSlot ? '#00D4FF' : '#FFFFFF',
                  borderColor: slot === activeSlot ? '#00D4FF' : '#333333'
                }}>
                {LETTERS[letterIdx]}
              </div>

              {/* Down arrow */}
              <div className="text-[8px] mt-1"
                style={{ color: slot === activeSlot ? '#00D4FF' : 'transparent' }}>
                ▼
              </div>
            </div>
          ))}
        </div>

        <div className="text-[7px] text-gray-500 animate-pulse">
          ↑↓ CHANGE LETTER &nbsp; → NEXT &nbsp; ENTER CONFIRM
        </div>
      </div>
    </div>
  )
}
