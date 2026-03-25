import { useState, useEffect } from 'react'

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
      style={{ fontFamily: '"Press Start 2P", monospace', padding: '16px 24px' }}>
      <div className="flex justify-between items-start">
        {/* Left side — HP and Lives */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-white text-[14px]">HP</span>
            <div className="w-32 h-3 bg-gray-800 border border-gray-600">
              <div
                className="h-full transition-all duration-200"
                style={{ width: `${hpPercent}%`, backgroundColor: hpColor }}
              />
            </div>
            <span className="text-[14px]" style={{ color: hpColor }}>{hp}</span>
          </div>
          <div className="flex items-center gap-1 text-[12px]">
            {Array.from({ length: lives }, (_, i) => (
              <span key={i} className="text-red-500">♥</span>
            ))}
          </div>
          {level && (
            <span className="text-[10px] text-gray-400 mt-1">{level}</span>
          )}
        </div>

        {/* Center — Combo */}
        {comboHits >= 3 && (
          <div className="text-center">
            <div className="text-[16px]" style={{ color: '#E8B800' }}>
              {comboHits} HITS
            </div>
            <div className="text-[14px]" style={{ color: '#FF8800' }}>
              ×{comboMultiplier}
            </div>
          </div>
        )}

        {/* Right side — Score + Timer */}
        <div className="text-right">
          <div className="text-[16px]" style={{ color: '#E8B800' }}>
            {score.toLocaleString()}
          </div>
          <div className="text-[10px] text-gray-400">SCORE</div>
          <div className="text-[12px] mt-1" style={{ color: '#00D4FF' }}>
            {formatTime(elapsedTime)}
          </div>
        </div>
      </div>

      {/* Charge bar (only visible when charging) */}
      {chargeLevel > 0 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="text-[12px] text-center mb-1"
            style={{ color: chargeLevel >= 0.67 ? '#E8B800' : '#00D4FF' }}>
            {chargeLevel >= 1 ? 'MAX!' : 'CHARGING...'}
          </div>
        </div>
      )}
    </div>
  )
}
