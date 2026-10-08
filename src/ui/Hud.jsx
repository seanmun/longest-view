// Score and progress, short messages, the exit-door hint, and the
// level-complete scoreboard.
import { useEffect, useState } from 'react'
import { useGame, getState } from '../game/state.js'
import { FAN_COUNT, PEOPLE } from '../game/level1.js'
import { scoreParts, level2Parts, totalScore, readBest, saveBest } from '../game/score.js'
import { startLevel2 } from '../game/levels.js'

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

function EndCard({ level }) {
  const [state] = useState(() => getState())
  const l1 = level === 1 ? scoreParts(state) : state.l1
  const l2 = level === 2 ? level2Parts(state) : null
  const total = totalScore(state)
  const [best] = useState(() => readBest())
  useEffect(() => { saveBest(total) }, [total])

  // Desktop: hand the mouse back so the buttons can be clicked
  useEffect(() => {
    if (document.pointerLockElement) document.exitPointerLock()
  }, [])

  return (
    <div className="fixed inset-0 z-30 overflow-y-auto bg-black/90 text-center text-white">
      <div className={`flex min-h-full flex-col items-center justify-center gap-4 p-6 ${SHORT}gap-2 ${SHORT}p-3`}>
        <h1 className={`title text-lg leading-relaxed text-[#E8B800] ${SHORT}text-sm`}>LEVEL {level} COMPLETE</h1>
        <p className={`text-2xl ${SHORT}text-lg`}>
          {level === 2 ? 'The Radio Monster is off the air. Xfinity Live! awaits.'
            : l1.fans === 0 ? "Nobody believes yet. That's the Process."
            : l1.fans === FAN_COUNT ? 'Every apostle is with you. Philadelphia is ready.'
            : `${l1.fans} apostles are with you.`}
        </p>

        <div className={`w-full max-w-md rounded-2xl bg-white/5 px-5 py-3 text-left text-lg ${SHORT}py-2 ${SHORT}text-base`}>
          {level === 1 ? (
            <>
              <Row label="Apostles" detail={`${l1.fans} / ${FAN_COUNT}`} points={l1.fanPoints} />
              <Row label="Anti-fans beaten" detail={`${l1.antiFans}`} points={l1.antiFanPoints} />
              <Row label="Speed" detail={formatTime(l1.seconds)} points={l1.speedPoints} />
              {l1.hits > 0 && <Row label="Hits taken" detail={`${l1.hits}`} points={l1.hitPoints} />}
            </>
          ) : (
            <>
              <Row label="Level 1" detail="" points={l1?.total ?? 0} />
              <Row label="Anti-fans beaten" detail={`${l2.antiFans}`} points={l2.antiFanPoints} />
              <Row label="Radio Monster" detail="" points={l2.bossPoints} />
              <Row label="Speed" detail={formatTime(l2.seconds)} points={l2.speedPoints} />
              {l2.hits > 0 && <Row label="Hits taken" detail={`${l2.hits}`} points={l2.hitPoints} />}
            </>
          )}
          <div className="mt-1 flex items-baseline justify-between border-t border-white/20 pt-1 text-xl font-bold">
            <span>Score</span>
            <span className="text-[#E8B800]">{total.toLocaleString()}</span>
          </div>
          <div className="text-right text-base text-white/60">
            {total > best ? 'New personal best!' : `Your best: ${best.toLocaleString()}`}
          </div>
        </div>

        {level === 1 ? (
          <button
            className="min-h-14 rounded-2xl bg-[#E8B800] px-10 text-xl font-bold text-black active:bg-[#c99f00]"
            onClick={startLevel2}
          >
            Continue to the parking lot
          </button>
        ) : (
          <>
            <p className={`title text-sm leading-relaxed text-white/80 ${SHORT}text-xs`}>TO BE CONTINUED… NEXT: THE COLANGELOS</p>
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
          </>
        )}
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
  const level = useGame((s) => s.level)
  const hearts = useGame((s) => s.hearts)
  const bossHp = useGame((s) => s.bossHp)
  const enemiesBeaten = useGame((s) => s.enemiesBeaten)
  const bossBeaten = useGame((s) => s.bossBeaten)

  if (complete) return <EndCard key={level} level={level} />

  const convinced = PEOPLE.filter((p) => p.fan && flags[p.id]).length
  const live = totalScore({ ...getState(), flags, mobLeft, hits, enemiesBeaten, bossBeaten, startedAt: null, finishedAt: null })

  return (
    <>
      <div className="pointer-events-none fixed left-3 top-3 z-10 rounded-lg bg-black/60 px-4 py-2 text-lg leading-snug text-white">
        <div>Score: <span className="text-[#E8B800]">{live.toLocaleString()}</span></div>
        <div>Apostles: <span className="text-[#E8B800]">{convinced} / {FAN_COUNT}</span></div>
        {level === 2 && (
          <div aria-label={`${hearts} of 5 hearts`} className="text-xl tracking-wider">
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} className={i < hearts ? 'text-[#ED174C]' : 'text-white/25'}>♥</span>
            ))}
          </div>
        )}
      </div>

      {bossHp != null && (
        <div className={`pointer-events-none fixed inset-x-0 top-3 z-10 flex justify-center ${SHORT}top-auto ${SHORT}bottom-3`}>
          <div className="w-[min(70vw,24rem)] rounded-lg bg-black/70 px-3 py-1.5">
            <div className="mb-1 text-center text-base font-bold tracking-wide text-[#ff7a5a]">TWO-HEADED RADIO MONSTER</div>
            <div className="h-3 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-[#ff5a2a] transition-[width]" style={{ width: `${bossHp * 100}%` }} />
            </div>
          </div>
        </div>
      )}

      <Toast />

      {nearDoor && !doorOpen && mobLeft > 0 && <Banner>The anti-fans are blocking the exit! Throw ping pong balls at them.</Banner>}
      {nearDoor && doorOpen && <Banner>The exit is open. Walk out.</Banner>}
    </>
  )
}
