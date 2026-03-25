import { useState, useEffect } from 'react'
import { getTopScores } from '../lib/scores.js'
import { AudioSystem } from '../game/systems/AudioSystem.js'

export default function Leaderboard({ game }) {
  const [show, setShow] = useState(false)
  const [highlight, setHighlight] = useState(null)
  const [scores, setScores] = useState([])

  useEffect(() => {
    if (!game) return
    const onChange = (_, key, value) => {
      if (key === 'showLeaderboard') {
        setShow(value)
        if (value) setScores(getTopScores(10))
      }
      if (key === 'leaderboardHighlight') setHighlight(value)
    }
    game.registry.events.on('changedata', onChange)
    game.registry.events.on('setdata', onChange)
    return () => {
      game.registry.events.off('changedata', onChange)
      game.registry.events.off('setdata', onChange)
    }
  }, [game])

  useEffect(() => {
    if (!show) return

    const dismiss = () => {
      AudioSystem.playMenuConfirm()
      game.registry.set('showLeaderboard', false)
      game.registry.set('showMNSPromo', true)
      game.registry.set('mnsPromoMessage',
        'While Hinkie rebuilds Philly, rebuild your fantasy roster.\nMoneyNeverSleeps.app — The smartest fantasy basketball platform on the internet.')
    }

    const handleKey = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        dismiss()
      }
    }
    const handleStart = () => dismiss()

    window.addEventListener('keydown', handleKey)
    window.addEventListener('game-start', handleStart)
    return () => {
      window.removeEventListener('keydown', handleKey)
      window.removeEventListener('game-start', handleStart)
    }
  }, [show, game])

  if (!show) return null

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Pad to 10 rows
  const rows = [...scores]
  while (rows.length < 10) {
    rows.push(null)
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/90"
      style={{ fontFamily: '"Press Start 2P", monospace' }}>
      <div className="text-center p-6 w-full max-w-md">
        <div className="text-[16px] mb-6" style={{ color: '#E8B800' }}>
          HIGH SCORES
        </div>

        {/* Header row */}
        <div className="flex justify-between text-[7px] text-gray-500 mb-2 px-2">
          <span className="w-8 text-left">#</span>
          <span className="w-16 text-left">NAME</span>
          <span className="flex-1 text-right">SCORE</span>
          <span className="w-16 text-right">TIME</span>
        </div>

        {/* Score rows */}
        <div className="space-y-1">
          {rows.map((entry, i) => {
            const isHighlight = entry && highlight &&
              entry.initials === highlight.initials &&
              entry.score === highlight.score
            const color = isHighlight ? '#E8B800' : entry ? '#FFFFFF' : '#333333'

            return (
              <div key={i}
                className="flex justify-between text-[9px] px-2 py-1"
                style={{
                  color,
                  backgroundColor: isHighlight ? 'rgba(232, 184, 0, 0.1)' : 'transparent'
                }}>
                <span className="w-8 text-left">{i + 1}.</span>
                <span className="w-16 text-left">{entry ? entry.initials : '---'}</span>
                <span className="flex-1 text-right">
                  {entry ? entry.score.toLocaleString() : '---'}
                </span>
                <span className="w-16 text-right">
                  {entry ? formatTime(entry.time) : '--:--'}
                </span>
              </div>
            )
          })}
        </div>

        <div className="text-[7px] text-gray-500 mt-6 animate-pulse">
          PRESS ENTER TO CONTINUE
        </div>
      </div>
    </div>
  )
}
