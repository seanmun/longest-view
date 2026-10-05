// Tiny game-state store shared by the 3D scene and the React overlays.
import { useSyncExternalStore } from 'react'

// Testing spawns (?at=) skip the intro
const skipIntro = new URLSearchParams(window.location.search).has('at')

let state = {
  intro: !skipIntro, // opening cutscene showing
  startedAt: skipIntro ? performance.now() : null, // ms, when play began
  finishedAt: null, // ms, when Hinkie walked into the locker room
  nearby: null, // id of the person in talking range
  talk: null, // { id, reply } while a conversation is open
  flags: {}, // id -> true once that person is convinced
  pages: {}, // binder page id -> true once picked up
  nearDoor: false, // standing at the locker-room door
  doorOpen: false,
  complete: false, // walked through the open door
  mobLeft: 5, // mob members still at the door
  mobSeen: false, // the "mob blocks the door" hint has shown
  toast: null, // { text, key } short message; key changes on every new toast
}

// Hinkie's floor position, written by the Player every frame. Not React state.
export const player = { x: 0, z: 0, y: 1, yaw: 0 }
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

export function toast(text) {
  setState({ toast: { text, key: Date.now() } })
}
