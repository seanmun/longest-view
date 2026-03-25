import { useState, useEffect } from 'react'
import { AudioSystem } from '../game/systems/AudioSystem.js'

export default function DialogueBox({ game }) {
  const [active, setActive] = useState(false)
  const [data, setData] = useState(null)

  useEffect(() => {
    if (!game) return

    // Read current values in case events already fired before mount
    const curActive = game.registry.get('dialogueActive')
    const curData = game.registry.get('dialogueData')
    if (curActive) setActive(true)
    if (curData) setData(curData)

    const onChange = (_, key, value) => {
      if (key === 'dialogueActive') setActive(value)
      if (key === 'dialogueData') setData(value)
    }

    // Listen for both setdata (first-time key) and changedata (subsequent updates)
    game.registry.events.on('changedata', onChange)
    game.registry.events.on('setdata', onChange)
    return () => {
      game.registry.events.off('changedata', onChange)
      game.registry.events.off('setdata', onChange)
    }
  }, [game])

  if (!active || !data) return null

  const handleChoice = (option, index) => {
    AudioSystem.playMenuConfirm()
    // Notify the game scene
    const scene = game.scene.getScene('Level1Scene')
    if (scene && scene.dialogueSystem) {
      scene.dialogueSystem.handleChoice(index, option.result)
    }
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-auto">
      <div className="bg-black/95 border-2 border-yellow-500 rounded w-full h-full flex flex-col justify-center"
        style={{ fontFamily: '"Press Start 2P", monospace', padding: 'clamp(12px, 4vw, 32px)' }}>

        {/* Speaker */}
        <div className="mb-4" style={{ color: '#E8B800', fontSize: 'clamp(14px, 3.5vw, 22px)' }}>
          {data.speaker}
        </div>

        {/* Text */}
        <div className="text-white mb-8" style={{ fontSize: 'clamp(11px, 2.5vw, 16px)', lineHeight: '1.8' }}>
          {data.text}
        </div>

        {/* Options */}
        <div className="flex flex-col gap-4">
          {data.options.map((option, i) => (
            <button
              key={i}
              onClick={() => handleChoice(option, i)}
              className="text-left px-5 py-4 border-2 border-gray-600 hover:border-cyan-400 hover:text-cyan-400 text-gray-300 transition-colors cursor-pointer"
              style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 'clamp(9px, 2vw, 14px)' }}
            >
              {String.fromCharCode(65 + i)}) {option.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
