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

  if (complete) {
    return (
      <div className="fixed inset-0 z-30 flex flex-col items-center justify-center gap-5 bg-black/85 p-6 text-center text-white">
        <h1 className="title text-xl leading-relaxed text-[#E8B800]">LEVEL 1 COMPLETE</h1>
        <p className="text-2xl">
          {convinced === 0 ? 'Nobody understands yet. That\'s the Process.'
            : convinced === FAN_COUNT ? 'Every single fan believes. Philadelphia is ready.'
            : 'The fans don\'t understand yet. But some of them do.'}
        </p>
        <p className="text-xl">Fans convinced: <span className="text-[#E8B800]">{convinced} / {FAN_COUNT}</span></p>
        <button
          className="min-h-14 rounded-2xl bg-[#E8B800] px-8 text-xl font-bold text-black active:bg-[#c99f00]"
          onClick={() => window.location.reload()}
        >
          Play again
        </button>
      </div>
    )
  }

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
