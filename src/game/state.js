// Tiny game-state store shared by the 3D scene and the React overlays.
import { useSyncExternalStore } from 'react'

let state = {
  nearby: null, // id of the person in talking range
  talk: null, // { id, reply } while a conversation is open
  flags: {}, // id -> true once that person is convinced
}
const listeners = new Set()

export const getState = () => state

export function setState(patch) {
  state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) }
  listeners.forEach((l) => l())
}

function subscribe(l) {
  listeners.add(l)
  return () => listeners.delete(l)
}

// selector must return a primitive or a stable reference
export const useGame = (selector) => useSyncExternalStore(subscribe, () => selector(state))
