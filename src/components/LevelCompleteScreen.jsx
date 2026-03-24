import { useState, useEffect } from 'react'

export default function LevelCompleteScreen({ game }) {
  const [show, setShow] = useState(false)
  const [data, setData] = useState(null)

  useEffect(() => {
    if (!game) return
    const onChange = (_, key, value) => {
      if (key === 'showLevelComplete') setShow(value)
      if (key === 'levelCompleteData') setData(value)
    }
    game.registry.events.on('changedata', onChange)
    return () => game.registry.events.off('changedata', onChange)
  }, [game])

  if (!show || !data) return null

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/90"
      style={{ fontFamily: '"Press Start 2P", monospace' }}>
      <div className="text-center p-6 max-w-md w-full">
        <div className="text-[20px] mb-6" style={{ color: '#E8B800' }}>
          LEVEL COMPLETE!
        </div>

        <div className="text-left space-y-3 mb-6 mx-auto" style={{ maxWidth: '320px' }}>
          <div className="flex justify-between text-[9px]">
            <span className="text-gray-300">ENEMIES DEFEATED</span>
            <span className="text-white">{data.enemiesDefeated}/{data.totalEnemies}</span>
          </div>

          <div className="flex justify-between text-[9px]">
            <span className="text-gray-300">TIME</span>
            <span style={{ color: '#00D4FF' }}>{formatTime(data.elapsed)}</span>
          </div>

          {data.timeBonus > 0 && (
            <div className="flex justify-between text-[9px]">
              <span className="text-gray-300">TIME BONUS</span>
              <span style={{ color: '#00CC44' }}>+{data.timeBonus.toLocaleString()}</span>
            </div>
          )}

          {data.damagePenalty > 0 && (
            <div className="flex justify-between text-[9px]">
              <span className="text-gray-300">DAMAGE PENALTY</span>
              <span style={{ color: '#CC2200' }}>-{data.damagePenalty.toLocaleString()}</span>
            </div>
          )}

          {data.noDamageBonus > 0 && (
            <div className="flex justify-between text-[9px]">
              <span className="text-gray-300">NO DAMAGE BONUS</span>
              <span style={{ color: '#00CC44' }}>+{data.noDamageBonus.toLocaleString()}</span>
            </div>
          )}

          <div className="border-t border-gray-700 pt-3">
            <div className="flex justify-between text-[12px]">
              <span style={{ color: '#E8B800' }}>TOTAL SCORE</span>
              <span style={{ color: '#E8B800' }}>{data.finalScore.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="text-[8px] text-gray-500 mt-4 animate-pulse">
          PRESS ENTER TO CONTINUE
        </div>
      </div>
    </div>
  )
}
