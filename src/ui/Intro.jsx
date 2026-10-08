// Opening cutscene: lines appear one at a time on black, then "Let's begin".
import { useEffect, useState } from 'react'
import { useProgress } from '@react-three/drei'
import { setState, useGame } from '../game/state.js'
import { unlockAudio } from '../game/audio.js'

const LINES = [
  'Philadelphia, 2013.',
  'Sam Hinkie has a plan.',
  'Nobody else understands it yet.',
  '...',
  'Time to trust the Process.',
]
const LINE_MS = 1700

export default function Intro({ isTouch }) {
  const intro = useGame((s) => s.intro)
  const loaded = useGame((s) => s.loaded)
  const { progress } = useProgress()
  const [shown, setShown] = useState(1)

  useEffect(() => {
    if (!intro || shown >= LINES.length) return
    const t = setTimeout(() => setShown((n) => n + 1), LINE_MS)
    return () => clearTimeout(t)
  }, [intro, shown])

  if (!intro) return null

  // Desktop: the click that starts the game also captures the mouse
  function begin() {
    setState({ intro: false, startedAt: performance.now() })
    unlockAudio() // starts the music now that play has begun
    if (!isTouch) {
      try { document.body.requestPointerLock()?.catch?.(() => {}) } catch { /* click again to look */ }
    }
  }

  const done = shown >= LINES.length
  const ready = done && loaded
  // Skip jumps to the end of the text; play still waits for the models
  const skip = () => (loaded ? begin() : setShown(LINES.length))
  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-black p-6 text-center text-white [@media(max-height:500px)]:gap-1.5 [@media(max-height:500px)]:p-3">
      <h1 className="title mb-4 text-lg leading-relaxed text-[#E8B800] [@media(max-height:500px)]:mb-1 [@media(max-height:500px)]:text-sm">LONGEST VIEW<br />SAM HINKIE'S REVENGE</h1>
      {LINES.slice(0, shown).map((line) => (
        <p key={line} className="animate-[fadein_0.8s_ease-out] text-2xl [@media(max-height:500px)]:text-xl">{line}</p>
      ))}
      {ready ? (
        <button
          className="mt-4 min-h-14 animate-[fadein_0.5s_ease-out] rounded-2xl bg-[#E8B800] px-10 text-xl font-bold text-black active:bg-[#c99f00] [@media(max-height:500px)]:mt-2"
          onClick={begin}
        >
          Let's begin
        </button>
      ) : (
        // Holds the button's spot so nothing jumps when it appears
        <div className="mt-4 flex min-h-14 w-64 max-w-[80vw] flex-col justify-center [@media(max-height:500px)]:mt-2">
          {done && (
            <>
              <div className="mb-1 text-base text-white/70">Loading the arena… {Math.round(progress)}%</div>
              <div className="h-2 overflow-hidden rounded-full bg-white/15">
                <div className="h-full rounded-full bg-[#E8B800] transition-[width]" style={{ width: `${progress}%` }} />
              </div>
            </>
          )}
        </div>
      )}
      {!done && (
        <button className="absolute right-4 top-4 min-h-12 rounded-xl border border-white/40 px-5 text-lg text-white/80" onClick={skip}>
          Skip
        </button>
      )}
      {!isTouch && ready && <p className="text-base text-white/70">WASD to walk · Mouse to look · Click or F to throw · E to talk</p>}
    </div>
  )
}
