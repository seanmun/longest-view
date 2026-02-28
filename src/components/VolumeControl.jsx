import { useState } from 'react'
import { AudioSystem } from '../game/systems/AudioSystem.js'

export default function VolumeControl() {
  const [volume, setVolume] = useState(50)
  const [muted, setMuted] = useState(false)
  const [open, setOpen] = useState(false)

  const handleVolumeChange = (val) => {
    setVolume(val)
    setMuted(false)
    AudioSystem.setMasterVolume(val / 100)
  }

  const toggleMute = () => {
    if (muted) {
      AudioSystem.setMasterVolume(volume / 100)
      setMuted(false)
    } else {
      AudioSystem.setMasterVolume(0)
      setMuted(true)
    }
  }

  return (
    <div className="absolute bottom-3 right-3 z-50 pointer-events-auto"
      style={{ fontFamily: '"Press Start 2P", monospace' }}>

      {open ? (
        <div className="bg-black/90 border border-gray-600 rounded p-4 flex flex-col gap-3 items-center">
          <button
            onClick={toggleMute}
            className="text-[14px] cursor-pointer hover:text-yellow-400 transition-colors"
            style={{ color: muted ? '#CC2200' : '#E8B800' }}
          >
            {muted ? 'MUTED' : 'SOUND'}
          </button>

          <input
            type="range"
            min="0"
            max="100"
            value={muted ? 0 : volume}
            onChange={(e) => handleVolumeChange(Number(e.target.value))}
            className="w-28 h-2 accent-yellow-500 cursor-pointer"
            style={{ WebkitAppearance: 'none', appearance: 'none' }}
          />

          <div className="text-[10px] text-gray-400">
            {muted ? 0 : volume}%
          </div>

          <button
            onClick={() => setOpen(false)}
            className="text-[10px] text-gray-400 hover:text-white cursor-pointer transition-colors"
          >
            CLOSE
          </button>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="text-[18px] cursor-pointer hover:text-yellow-400 transition-colors bg-black/50 px-3 py-2 rounded"
          style={{ color: muted ? '#CC2200' : '#888888' }}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      )}
    </div>
  )
}
