// Conversation UI: TALK button, dialogue box, and the fans-convinced counter.
import { useEffect } from 'react'
import { useGame } from '../game/state.js'
import { openTalk, choose, closeTalk, personById } from '../game/talk.js'
import { FAN_COUNT, PEOPLE } from '../game/level1.js'

function relock(isTouch) {
  if (isTouch) return
  try { document.body.requestPointerLock()?.catch?.(() => {}) } catch { /* user clicks to resume */ }
}

export default function Talk({ isTouch }) {
  const nearby = useGame((s) => s.nearby)
  const talk = useGame((s) => s.talk)
  const flags = useGame((s) => s.flags)
  const talking = talk != null

  // Desktop: free the mouse so choices can be clicked
  useEffect(() => {
    if (talking && !isTouch && document.pointerLockElement) document.exitPointerLock()
  }, [talking, isTouch])

  useEffect(() => {
    const onKey = (e) => {
      if (e.repeat) return
      if (!talk) {
        if (e.code === 'KeyE') openTalk()
      } else if (talk.reply) {
        if (['KeyE', 'Enter', 'Space'].includes(e.code)) { closeTalk(); relock(isTouch) }
      } else if (/^Digit[1-9]$/.test(e.code)) {
        choose(Number(e.code.slice(5)) - 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [talk, isTouch])

  const convinced = PEOPLE.filter((p) => p.fan && flags[p.id]).length
  const person = talk && personById(talk.id)

  return (
    <>
      <div className="pointer-events-none fixed left-3 top-3 z-10 rounded-lg bg-black/60 px-4 py-2 text-lg text-white">
        {convinced === FAN_COUNT
          ? <span className="text-[#E8B800]">Every fan believes! Head to the locker room.</span>
          : <>Fans convinced: <span className="text-[#E8B800]">{convinced} / {FAN_COUNT}</span></>}
      </div>

      {nearby && !talking && (isTouch ? (
        <button
          className="fixed bottom-20 right-6 z-10 min-h-16 rounded-2xl border-2 border-[#E8B800] bg-[#2A3F6E] px-8 text-xl font-bold text-white active:bg-[#1B2A4A]"
          onClick={openTalk}
        >
          TALK
        </button>
      ) : (
        <div className="pointer-events-none fixed bottom-8 left-1/2 z-10 -translate-x-1/2 rounded-lg bg-black/70 px-5 py-3 text-xl text-white">
          Press <span className="font-bold text-[#E8B800]">E</span> to talk to {personById(nearby).name.toLowerCase()}
        </div>
      ))}

      {person && (
        <div className="fixed inset-x-0 bottom-0 z-20 flex justify-center p-3">
          <div className="w-full max-w-2xl rounded-2xl border-2 border-[#E8B800] bg-[#0f1830]/95 p-4 text-white shadow-2xl">
            <div className="mb-1 text-base font-bold tracking-wide text-[#E8B800]">{person.name}</div>
            <p className="mb-3 text-xl leading-snug">{talk.reply ?? person.line}</p>
            {talk.reply ? (
              <button
                className="min-h-12 w-full rounded-xl bg-[#E8B800] px-4 text-lg font-bold text-black active:bg-[#c99f00]"
                onClick={() => { closeTalk(); relock(isTouch) }}
              >
                OK
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                {person.choices.map((c, i) => (
                  <button
                    key={c.label}
                    className="min-h-12 rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-left text-lg active:bg-white/25"
                    onClick={() => choose(i)}
                  >
                    {!isTouch && <span className="mr-2 text-[#E8B800]">{i + 1}.</span>}
                    {c.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
