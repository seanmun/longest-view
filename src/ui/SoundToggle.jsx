// Sound on/off, remembered on this device.
import { useState } from 'react'
import { isMuted, setMuted, unlockAudio } from '../game/audio.js'

export default function SoundToggle() {
  const [muted, setLocal] = useState(isMuted)
  return (
    <button
      className="fixed right-3 top-3 z-10 min-h-12 rounded-lg bg-black/60 px-4 text-lg text-white active:bg-black/80"
      aria-pressed={!muted}
      onClick={() => { setMuted(!muted); setLocal(!muted); unlockAudio() }}
    >
      {muted ? 'Sound: Off' : 'Sound: On'}
    </button>
  )
}
