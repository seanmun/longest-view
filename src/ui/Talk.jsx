// Conversation UI: TALK button and dialogue box. Each fan's question is asked
// once (see talk.js); copy lives in game/questions.js.
import { useEffect } from 'react'
import { useGame } from '../game/state.js'
import { openTalk, choose, advance, personById, questionFor } from '../game/talk.js'

const SHORT = '[@media(max-height:500px)]:'

function relock(isTouch) {
  if (isTouch) return
  try { document.body.requestPointerLock()?.catch?.(() => {}) } catch { /* user clicks to resume */ }
}

export default function Talk({ isTouch }) {
  const nearby = useGame((s) => s.nearby)
  const talk = useGame((s) => s.talk)
  const talking = talk != null

  // Desktop: free the mouse so answers can be clicked
  useEffect(() => {
    if (talking && !isTouch && document.pointerLockElement) document.exitPointerLock()
  }, [talking, isTouch])

  function next() {
    advance()
    if (!talk || talk.page !== 'reaction' || !questionFor(talk.id).explain) relock(isTouch)
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.repeat) return
      if (!talk) {
        if (e.code === 'KeyE') openTalk()
      } else if (talk.page === 'ask') {
        if (/^Digit[1-9]$/.test(e.code)) choose(Number(e.code.slice(5)) - 1)
      } else if (['KeyE', 'Enter', 'Space'].includes(e.code)) {
        next()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const person = talk && personById(talk.id)
  const q = talk && questionFor(talk.id)
  const picked = talk && talk.picked != null ? q.answers[talk.picked] : null
  const nearbyPerson = nearby && personById(nearby)

  return (
    <>
      {nearby && !talking && (isTouch ? (
        <button
          className="fixed bottom-44 right-6 z-10 min-h-16 rounded-2xl border-2 border-[#E8B800] bg-[#2A3F6E] px-8 text-xl font-bold text-white active:bg-[#1B2A4A]"
          onClick={openTalk}
        >
          TALK
        </button>
      ) : (
        <div className="pointer-events-none fixed bottom-8 left-1/2 z-10 -translate-x-1/2 rounded-lg bg-black/70 px-5 py-3 text-xl text-white">
          Press <span className="font-bold text-[#E8B800]">E</span> to talk to {(nearbyPerson.crew ?? nearbyPerson.name).toLowerCase()}
        </div>
      ))}

      {person && (
        <div className="fixed inset-x-0 bottom-0 z-20 flex max-h-full justify-center p-3">
          <div className={`max-h-[calc(100vh-1.5rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border-2 border-[#E8B800] bg-[#0f1830]/95 p-4 text-white shadow-2xl ${SHORT}p-3`}>
            <div className="mb-1 text-base font-bold tracking-wide text-[#E8B800]">{person.crew ?? person.name}</div>

            {talk.page === 'ask' && (
              <>
                <p className={`mb-3 text-xl leading-snug ${SHORT}mb-2 ${SHORT}text-lg`}>{q.ask}</p>
                <div className="flex flex-col gap-2">
                  {talk.order.map((index, slot) => (
                    <button
                      key={index}
                      className={`min-h-12 rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-left text-lg leading-snug active:bg-white/25 ${SHORT}min-h-10 ${SHORT}py-1.5 ${SHORT}text-base`}
                      onClick={() => choose(slot)}
                    >
                      {!isTouch && <span className="mr-2 text-[#E8B800]">{slot + 1}.</span>}
                      {q.answers[index].text}
                    </button>
                  ))}
                </div>
              </>
            )}

            {talk.page === 'reaction' && (
              <>
                <div className={`mb-2 inline-block rounded-md px-2 py-0.5 text-base font-bold ${picked.correct ? 'bg-[#E8B800] text-black' : 'bg-white/15 text-white/80'}`}>
                  {picked.correct
                    ? (person.fan ? 'CONVINCED' : 'RIGHT CALL')
                    : (person.fan ? 'NOT CONVINCED' : 'WRONG CALL')}
                </div>
                <p className={`mb-3 text-xl leading-snug ${SHORT}text-lg`}>{picked.reaction}</p>
              </>
            )}

            {talk.page === 'explain' && (
              <div className={`mb-3 flex flex-col gap-2 text-lg leading-snug ${SHORT}gap-1 ${SHORT}text-[15px] ${SHORT}leading-tight`}>
                <div className="text-base font-bold text-[#E8B800]">WHY</div>
                {q.explain.map((line) => <p key={line}>{line}</p>)}
              </div>
            )}

            {talk.page === 'snub' && <p className={`mb-3 text-xl leading-snug ${SHORT}text-lg`}>{q.snub}</p>}

            {talk.page !== 'ask' && (
              <button
                className="sticky bottom-0 min-h-12 w-full rounded-xl bg-[#E8B800] px-4 text-lg font-bold text-black shadow-[0_-8px_12px_#0f1830] active:bg-[#c99f00]"
                onClick={next}
              >
                {talk.page === 'reaction' && q.explain ? 'Why?' : 'OK'}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}
