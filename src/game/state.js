// Tiny game-state store shared by the 3D scene and the React overlays.
import { useSyncExternalStore } from 'react'

// Testing: ?at= spawns somewhere on the ring, ?level=2 starts in the parking lot.
// Either skips the intro.
const params = new URLSearchParams(window.location.search)
const startLevel = Number(params.get('level')) === 2 ? 2 : 1
const skipIntro = params.has('at') || startLevel === 2

let state = {
  level: startLevel, // 1 lower concourse, 2 parking lot
  l1: null, // Level 1 score parts, frozen when it's finished (see score.js)
  intro: !skipIntro, // opening cutscene showing
  loaded: false, // every model downloaded and the scene is up
  startedAt: skipIntro ? performance.now() : null, // ms, when play began
  finishedAt: null, // ms, when Hinkie walked out the exit doors
  nearby: null, // id of the person in talking range
  talk: null, // see talk.js, while a conversation is open
  flags: {}, // id -> true once that person is convinced
  asked: {}, // id -> true once their one question has been answered
  hits: 0, // times Hinkie got hit (costs points)
  nearDoor: false, // standing at the exit doors
  doorOpen: false,
  complete: false, // walked out the open doors
  mobLeft: 5, // mob members still at the door
  mobSeen: false, // the "mob blocks the door" hint has shown
  toast: null, // { text, key } short message; key changes on every new toast
  // Level 2
  hearts: 5,
  invulnUntil: 0, // ms: flashing after a hit, can't be hit again
  enemiesBeaten: 0, // parking-lot anti-fans sent packing
  bossHp: null, // 0..1 while the Radio Monster fight is on screen
  bossBeaten: false,
  rescued: false, // RTRS showed up
}

// Hinkie's floor position, written by the Player every frame. Not React state.
export const player = {
  x: 0, z: 0, y: 1, yaw: 0,
  teleport: null, // { x, z }: the Player moves the body here next frame
  knock: null, // { vx, vz, until }: shove from a hit, added to his walk
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

export function toast(text) {
  setState({ toast: { text, key: Date.now() } })
}
