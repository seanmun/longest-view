// Score and progress, short messages, the exit-door hint, and the
// level-complete scoreboard.
import { useEffect, useState } from 'react'
import { useGame, getState } from '../game/state.js'
import { FAN_COUNT, PEOPLE } from '../game/level1.js'
import { scoreParts, readBest, saveBest } from '../game/score.js'

const TOAST_MS = 2800
const SHORT = '[@media(max-height:500px)]:'

function Toast() {
  const toast = useGame((s) => s.toast)
  const [visible, setVisible] = useState(null)
  useEffect(() => {
    if (!toast) return
    setVisible(toast.text)
    const t = setTimeout(() => setVisible(null), TOAST_MS)
    return () => clearTimeout(t)
  }, [toast])
  if (!visible) return null
  return <Banner gold>{visible}</Banner>
}

function Banner({ children, gold }) {
  return (
    <div className={`pointer-events-none fixed inset-x-0 top-28 z-10 flex justify-center px-4 ${SHORT}top-3`}>
      <div className={`max-w-[90vw] rounded-xl bg-black/80 px-4 py-2 text-center text-lg text-white ${SHORT}max-w-[40vw] ${gold ? 'border-2 border-[#E8B800]' : ''}`}>
        {children}
      </div>
    </div>
  )
}

function formatTime(seconds) {
  const total = Math.max(0, Math.round(seconds))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

function Row({ label, detail, points }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span>{label} <span className="text-white/60">{detail}</span></span>
      <span className={points < 0 ? 'text-[#ff7a8a]' : 'text-[#E8B800]'}>{points >= 0 ? `+${points}` : points}</span>
    </div>
  )
}

function EndCard() {
  const [parts] = useState(() => scoreParts(getState()))
  const [best] = useState(() => readBest())
  useEffect(() => { saveBest(parts.total) }, [parts.total])

  // Desktop: hand the mouse back so the buttons can be clicked
  useEffect(() => {
    if (document.pointerLockElement) document.exitPointerLock()
  }, [])

  return (
    <div className="fixed inset-0 z-30 overflow-y-auto bg-black/90 text-center text-white">
      <div className={`flex min-h-full flex-col items-center justify-center gap-4 p-6 ${SHORT}gap-2 ${SHORT}p-3`}>
        <h1 className={`title text-lg leading-relaxed text-[#E8B800] ${SHORT}text-sm`}>LEVEL 1 COMPLETE</h1>
        <p className={`text-2xl ${SHORT}text-lg`}>
          {parts.fans === 0 ? "Nobody believes yet. That's the Process."
            : parts.fans === FAN_COUNT ? 'Every apostle is with you. Philadelphia is ready.'
            : `${parts.fans} apostles are with you.`}
        </p>

        <div className={`w-full max-w-md rounded-2xl bg-white/5 px-5 py-3 text-left text-lg ${SHORT}py-2 ${SHORT}text-base`}>
          <Row label="Apostles" detail={`${parts.fans} / ${FAN_COUNT}`} points={parts.fanPoints} />
          <Row label="Anti-fans beaten" detail={`${parts.antiFans}`} points={parts.antiFanPoints} />
          <Row label="Speed" detail={formatTime(parts.seconds)} points={parts.speedPoints} />
          {parts.hits > 0 && <Row label="Hits taken" detail={`${parts.hits}`} points={parts.hitPoints} />}
          <div className="mt-1 flex items-baseline justify-between border-t border-white/20 pt-1 text-xl font-bold">
            <span>Score</span>
            <span className="text-[#E8B800]">{parts.total.toLocaleString()}</span>
          </div>
          <div className="text-right text-base text-white/60">
            {parts.total > best ? 'New personal best!' : `Your best: ${best.toLocaleString()}`}
          </div>
        </div>

        <p className={`title text-sm leading-relaxed text-white/80 ${SHORT}text-xs`}>TO BE CONTINUED… NEXT: THE PARKING LOT</p>

        <div className={`rounded-2xl border-2 border-[#E8B800] bg-[#0f1830] px-6 py-3 ${SHORT}py-2`}>
          <p className={`text-lg ${SHORT}text-base`}>While Hinkie rebuilds Philly, rebuild your fantasy roster.</p>
          <p className={`title mt-2 text-xs leading-relaxed text-[#E8B800] ${SHORT}mt-1`}>MNSFANTASY.COM — MONEY NEVER SLEEPS</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <a
            href="https://mnsfantasy.com"
            target="_blank"
            rel="noopener"
            className="flex min-h-14 items-center rounded-2xl bg-[#E8B800] px-8 text-xl font-bold text-black active:bg-[#c99f00]"
          >
            Visit MNS Fantasy
          </a>
          <button
            className="min-h-14 rounded-2xl border-2 border-white/60 px-8 text-xl font-bold text-white active:bg-white/20"
            onClick={() => window.location.reload()}
          >
            Play again
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Hud() {
  const flags = useGame((s) => s.flags)
  const mobLeft = useGame((s) => s.mobLeft)
  const hits = useGame((s) => s.hits)
  const nearDoor = useGame((s) => s.nearDoor)
  const doorOpen = useGame((s) => s.doorOpen)
  const complete = useGame((s) => s.complete)

  if (complete) return <EndCard />

  const convinced = PEOPLE.filter((p) => p.fan && flags[p.id]).length
  const live = scoreParts({ flags, mobLeft, hits, startedAt: null, finishedAt: null })

  return (
    <>
      <div className="pointer-events-none fixed left-3 top-3 z-10 rounded-lg bg-black/60 px-4 py-2 text-lg leading-snug text-white">
        <div>Score: <span className="text-[#E8B800]">{live.total.toLocaleString()}</span></div>
        <div>Apostles: <span className="text-[#E8B800]">{convinced} / {FAN_COUNT}</span></div>
      </div>

      <Toast />

      {nearDoor && !doorOpen && mobLeft > 0 && <Banner>The anti-fans are blocking the exit! Throw ping pong balls at them.</Banner>}
      {nearDoor && doorOpen && <Banner>The exit is open. Walk out.</Banner>}
    </>
  )
}
