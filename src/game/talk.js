// Conversation actions. A talk is { id, reply }: reply is null while choosing,
// or the person's answer once Hinkie has picked a line.
import { getState, setState } from './state.js'
import { PEOPLE, clusterOf } from './level1.js'
import { sfx } from './audio.js'
import { join } from './follow.js'
import { polar } from './ring.js'

export const personById = (id) => PEOPLE.find((p) => p.id === id)

export function openTalk() {
  const { nearby, talk, flags } = getState()
  if (!nearby || talk) return
  sfx.blip()
  // Already convinced: skip the question, go straight to their happy line
  setState({ talk: { id: nearby, reply: flags[nearby] ? personById(nearby).after : null } })
}

export function choose(index) {
  const { talk } = getState()
  if (!talk || talk.reply) return
  const choice = personById(talk.id).choices[index]
  if (!choice) return
  if (choice.win) {
    sfx.good()
    // Win over the fan and everyone standing with them
    for (const p of clusterOf(talk.id)) if (p.fan) { const [x, , z] = polar(p.r, p.angle); join(p.id, x, z) }
  }
  else sfx.bad()
  const won = choice.win ? Object.fromEntries(clusterOf(talk.id).map((p) => [p.id, true])) : {}
  setState((s) => ({
    talk: { id: talk.id, reply: choice.reply },
    flags: { ...s.flags, ...won },
  }))
}

export function closeTalk() {
  setState({ talk: null })
}
