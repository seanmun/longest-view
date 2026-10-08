// Conversation actions. Each question is asked once.
// A talk is { id, order, picked, page }:
//   order  - answer indexes in the shuffled order shown
//   picked - index of Hinkie's answer, or null while choosing
//   page   - 'ask' | 'reaction' | 'explain' | 'snub'
import { getState, setState } from './state.js'
import { PEOPLE, clusterOf } from './level1.js'
import { QUESTIONS } from './questions.js'
import { sfx } from './audio.js'
import { join } from './follow.js'
import { polar } from './ring.js'

export const personById = (id) => PEOPLE.find((p) => p.id === id)
export const questionFor = (id) => QUESTIONS[personById(id)?.q]

function shuffled(n) {
  const a = Array.from({ length: n }, (_, i) => i)
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}

export function openTalk() {
  const { nearby, talk, asked } = getState()
  if (!nearby || talk) return
  const q = questionFor(nearby)
  if (!q) return
  sfx.blip()
  // Already asked (and not won, or they'd be following): the eye-roll
  if (asked[nearby]) { setState({ talk: { id: nearby, order: [], picked: null, page: 'snub' } }); return }
  setState({ talk: { id: nearby, order: shuffled(q.answers.length), picked: null, page: 'ask' } })
}

export function choose(slot) {
  const { talk } = getState()
  if (!talk || talk.page !== 'ask') return
  const index = talk.order[slot]
  const q = questionFor(talk.id)
  const answer = q.answers[index]
  if (!answer) return

  const won = {}
  if (answer.correct) {
    sfx.good()
    // Win over the fan and everyone standing with them
    for (const p of clusterOf(talk.id)) {
      won[p.id] = true
      if (p.fan) { const [x, , z] = polar(p.r, p.angle); join(p.id, x, z) }
    }
  } else {
    sfx.bad()
  }
  setState((s) => ({
    talk: { ...talk, picked: index, page: 'reaction' },
    flags: { ...s.flags, ...won },
    asked: { ...s.asked, ...Object.fromEntries(clusterOf(talk.id).map((p) => [p.id, true])) },
    analystRight: talk.id === 'analyst' ? !!answer.correct : s.analystRight,
  }))
}

// OK on a reaction: show the explainer if there is one, otherwise close
export function advance() {
  const { talk } = getState()
  if (!talk) return
  if (talk.page === 'reaction' && questionFor(talk.id).explain) setState({ talk: { ...talk, page: 'explain' } })
  else setState({ talk: null })
}

export function closeTalk() {
  setState({ talk: null })
}
