import { useState, useEffect } from 'react'
import { AudioSystem } from '../game/systems/AudioSystem.js'

export default function DialogueBox({ game }) {
  const [active, setActive] = useState(false)
  const [data, setData] = useState(null)

  useEffect(() => {
    if (!game) return

    const onChange = (_, key, value) => {
      if (key === 'dialogueActive') setActive(value)
      if (key === 'dialogueData') setData(value)
    }

    game.registry.events.on('changedata', onChange)
    return () => game.registry.events.off('changedata', onChange)
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
    <div className="absolute inset-0 flex items-end justify-center z-50 pointer-events-auto pb-8">
      <div className="bg-black/95 border-2 border-yellow-500 rounded p-4 max-w-xl w-full mx-4"
        style={{ fontFamily: '"Press Start 2P", monospace' }}>

        {/* Speaker */}
        <div className="text-[10px] mb-2" style={{ color: '#E8B800' }}>
          {data.speaker}
        </div>

        {/* Text */}
        <div className="text-[8px] text-white mb-4 leading-relaxed">
          {data.text}
        </div>

        {/* Options */}
        <div className="flex flex-col gap-2">
          {data.options.map((option, i) => (
            <button
              key={i}
              onClick={() => handleChoice(option, i)}
              className="text-left text-[7px] px-3 py-2 border border-gray-600 hover:border-cyan-400 hover:text-cyan-400 text-gray-300 transition-colors cursor-pointer"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              {String.fromCharCode(65 + i)}) {option.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
