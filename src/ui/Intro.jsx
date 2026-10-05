// Opening cutscene: lines appear one at a time on black, then "Let's begin".
import { useEffect, useState } from 'react'
import { setState, useGame } from '../game/state.js'

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
    if (!isTouch) {
      try { document.body.requestPointerLock()?.catch?.(() => {}) } catch { /* click again to look */ }
    }
  }

  const done = shown >= LINES.length
  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-black p-6 text-center text-white [@media(max-height:500px)]:gap-1.5 [@media(max-height:500px)]:p-3">
      <h1 className="title mb-4 text-lg leading-relaxed text-[#E8B800] [@media(max-height:500px)]:mb-1 [@media(max-height:500px)]:text-sm">LONGEST VIEW<br />SAM HINKIE'S REVENGE</h1>
      {LINES.slice(0, shown).map((line) => (
        <p key={line} className="animate-[fadein_0.8s_ease-out] text-2xl [@media(max-height:500px)]:text-xl">{line}</p>
      ))}
      <button
        className={`mt-4 [@media(max-height:500px)]:mt-2 min-h-14 rounded-2xl bg-[#E8B800] px-10 text-xl font-bold text-black transition-opacity active:bg-[#c99f00] ${done ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={begin}
      >
        Let's begin
      </button>
      {!done && (
        <button className="absolute right-4 top-4 min-h-12 rounded-xl border border-white/40 px-5 text-lg text-white/80" onClick={begin}>
          Skip
        </button>
      )}
      {!isTouch && done && <p className="text-base text-white/70">WASD to walk · Mouse to look · Click or F to throw · E to talk</p>}
    </div>
  )
}
