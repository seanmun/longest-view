// Conversation actions. A talk is { id, reply }: reply is null while choosing,
// or the person's answer once Hinkie has picked a line.
import { getState, setState } from './state.js'
import { PEOPLE } from './level1.js'
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
    const person = personById(talk.id)
    if (person.fan) { const [x, , z] = polar(person.r, person.angle); join(talk.id, x, z) }
  }
  else sfx.bad()
  setState((s) => ({
    talk: { id: talk.id, reply: choice.reply },
    flags: choice.win ? { ...s.flags, [talk.id]: true } : s.flags,
  }))
}

export function closeTalk() {
  setState({ talk: null })
}
