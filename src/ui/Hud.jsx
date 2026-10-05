// Progress counters, short messages, the locker-room door hint, and the
// level-complete screen.
import { useEffect, useState } from 'react'
import { useGame } from '../game/state.js'
import { FAN_COUNT, PEOPLE, PAGES } from '../game/level1.js'

const TOAST_MS = 2800

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
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-10 flex justify-center px-4">
      <div className="rounded-xl border-2 border-[#E8B800] bg-black/80 max-w-[60vw] px-5 py-3 text-center text-xl text-white">{visible}</div>
    </div>
  )
}

function formatTime(ms) {
  const total = Math.max(0, Math.round(ms / 1000))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

function EndCard({ convinced }) {
  const startedAt = useGame((s) => s.startedAt)
  const finishedAt = useGame((s) => s.finishedAt)

  // Desktop: hand the mouse back so the buttons can be clicked
  useEffect(() => {
    if (document.pointerLockElement) document.exitPointerLock()
  }, [])

  return (
    <div className="fixed inset-0 z-30 overflow-y-auto bg-black/90 text-center text-white">
     <div className="flex min-h-full flex-col items-center justify-center gap-4 p-6 [@media(max-height:500px)]:gap-2 [@media(max-height:500px)]:p-3">
      <h1 className="title text-lg leading-relaxed text-[#E8B800] [@media(max-height:500px)]:text-sm">LEVEL 1 COMPLETE</h1>
      <p className="text-2xl [@media(max-height:500px)]:text-xl">
        {convinced === 0 ? 'Nobody understands yet. That\'s the Process.'
          : convinced === FAN_COUNT ? 'Every single fan believes. Philadelphia is ready.'
          : 'The fans don\'t understand yet. But some of them do.'}
      </p>
      <p className="text-xl">
        Time <span className="text-[#E8B800]">{formatTime(finishedAt - startedAt)}</span>
        <span className="mx-3 text-white/40">·</span>
        Fans convinced <span className="text-[#E8B800]">{convinced} / {FAN_COUNT}</span>
      </p>
      <div className="rounded-2xl border-2 border-[#E8B800] bg-[#0f1830] px-6 py-4 [@media(max-height:500px)]:py-2">
        <p className="text-xl [@media(max-height:500px)]:text-lg">While Hinkie rebuilds Philly, rebuild your fantasy roster.</p>
        <p className="title mt-2 text-sm leading-relaxed text-[#E8B800] [@media(max-height:500px)]:mt-1 [@media(max-height:500px)]:text-xs">MNSFANTASY.COM — MONEY NEVER SLEEPS</p>
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
  const pages = useGame((s) => s.pages)
  const nearDoor = useGame((s) => s.nearDoor)
  const doorOpen = useGame((s) => s.doorOpen)
  const complete = useGame((s) => s.complete)
  const mobLeft = useGame((s) => s.mobLeft)

  const convinced = PEOPLE.filter((p) => p.fan && flags[p.id]).length
  const found = Object.keys(pages).length
  const missing = PAGES.length - found

  if (complete) return <EndCard convinced={convinced} />

  return (
    <>
      <div className="pointer-events-none fixed left-3 top-3 z-10 rounded-lg bg-black/60 px-4 py-2 text-lg leading-snug text-white">
        <div>Fans convinced: <span className="text-[#E8B800]">{convinced} / {FAN_COUNT}</span></div>
        <div>Binder pages: <span className="text-[#E8B800]">{found} / {PAGES.length}</span></div>
      </div>

      <Toast />

      {nearDoor && !doorOpen && (mobLeft > 0 || missing > 0) && (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-10 flex justify-center px-4">
          <div className="rounded-xl bg-black/80 max-w-[60vw] px-5 py-3 text-center text-xl text-white">
            {mobLeft > 0
              ? 'The mob is blocking the door! Throw ping pong balls at them.'
              : `Locked. Find ${missing} more binder ${missing === 1 ? 'page' : 'pages'} around the concourse.`}
          </div>
        </div>
      )}
      {nearDoor && doorOpen && (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-10 flex justify-center px-4">
          <div className="rounded-xl bg-black/80 max-w-[60vw] px-5 py-3 text-center text-xl text-[#E8B800]">The locker room is open. Walk in.</div>
        </div>
      )}
    </>
  )
}
