import { useState, useEffect } from 'react'

const isMobile = typeof window !== 'undefined' && 'ontouchstart' in window && window.innerWidth < 1024

// Mobile needs bigger text since the game container is scaled down
const ms = (base) => isMobile ? Math.round(base * 1.5) : base

export default function HUD({ game }) {
  const [hp, setHp] = useState(100)
  const [maxHp, setMaxHp] = useState(100)
  const [lives, setLives] = useState(3)
  const [score, setScore] = useState(0)
  const [comboHits, setComboHits] = useState(0)
  const [comboMultiplier, setComboMultiplier] = useState(1)
  const [chargeLevel, setChargeLevel] = useState(0)
  const [level, setLevel] = useState('')
  const [elapsedTime, setElapsedTime] = useState(0)
  const [weapon, setWeapon] = useState('')

  useEffect(() => {
    if (!game) return

    const registry = game.registry

    const onChange = (_, key, value) => {
      switch (key) {
        case 'playerHp': setHp(value); break
        case 'playerMaxHp': setMaxHp(value); break
        case 'playerLives': setLives(value); break
        case 'score': setScore(value); break
        case 'comboHits': setComboHits(value); break
        case 'comboMultiplier': setComboMultiplier(value); break
        case 'chargeLevel': setChargeLevel(value); break
        case 'currentLevel': setLevel(value); break
        case 'elapsedTime': setElapsedTime(value); break
        case 'selectedWeapon': setWeapon(value); break
      }
    }

    registry.events.on('changedata', onChange)
    registry.events.on('setdata', onChange)
    return () => {
      registry.events.off('changedata', onChange)
      registry.events.off('setdata', onChange)
    }
  }, [game])

  const hpPercent = (hp / maxHp) * 100
  const hpColor = hpPercent > 60 ? '#00CC44' : hpPercent > 30 ? '#E8B800' : '#CC2200'

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="absolute top-0 left-0 w-full pointer-events-none z-10"
      style={{ fontFamily: '"Press Start 2P", monospace', padding: isMobile ? '8px 16px' : '20px 40px' }}>
      <div className="flex justify-between items-start">
        {/* Left side — HP and Lives */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-white" style={{ fontSize: ms(14) }}>HP</span>
            <div className="h-3 bg-gray-800 border border-gray-600" style={{ width: isMobile ? 80 : 128 }}>
              <div
                className="h-full transition-all duration-200"
                style={{ width: `${hpPercent}%`, backgroundColor: hpColor }}
              />
            </div>
            <span style={{ fontSize: ms(14), color: hpColor }}>{hp}</span>
          </div>
          <div className="flex items-center gap-1" style={{ fontSize: ms(12) }}>
            {Array.from({ length: lives }, (_, i) => (
              <span key={i} className="text-red-500">♥</span>
            ))}
          </div>
          {level && (
            <span className="text-gray-400 mt-1" style={{ fontSize: ms(10) }}>{level}</span>
          )}
          {weapon && (
            <span className="mt-1" style={{
              fontSize: ms(8),
              color: weapon === 'lotto_ball' ? '#00D4FF' :
                     weapon === 'poison_pill' ? '#CC2200' : '#E8B800'
            }}>
              {weapon === 'lotto_ball' ? 'LOTTO BALL' :
               weapon === 'poison_pill' ? 'POISON PILL' : 'THE TANK'}
            </span>
          )}
        </div>

        {/* Center — Combo */}
        {comboHits >= 3 && (
          <div className="text-center">
            <div style={{ fontSize: ms(16), color: '#E8B800' }}>
              {comboHits} HITS
            </div>
            <div style={{ fontSize: ms(14), color: '#FF8800' }}>
              x{comboMultiplier}
            </div>
          </div>
        )}

        {/* Right side — Score + Timer */}
        <div className="text-right">
          <div style={{ fontSize: ms(16), color: '#E8B800' }}>
            {score.toLocaleString()}
          </div>
          <div className="text-gray-400" style={{ fontSize: ms(10) }}>SCORE</div>
          <div className="mt-1" style={{ fontSize: ms(12), color: '#00D4FF' }}>
            {formatTime(elapsedTime)}
          </div>
        </div>
      </div>

      {/* Charge bar (only visible when charging) */}
      {chargeLevel > 0 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="text-center mb-1"
            style={{ fontSize: ms(12), color: chargeLevel >= 0.67 ? '#E8B800' : '#00D4FF' }}>
            {chargeLevel >= 1 ? 'MAX!' : 'CHARGING...'}
          </div>
        </div>
      )}
    </div>
  )
}
