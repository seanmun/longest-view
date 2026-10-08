// Moving between levels, taking hits, and getting back up.
import { getState, setState, player, toast } from './state.js'
import { scoreParts } from './score.js'
import { relocate } from './follow.js'
import { startMusic } from './audio.js'

// Parking lot layout (meters). The arena's doors are at z = 0; the lot runs
// toward -z to Xfinity Live!.
export const LOT = {
  minX: -26, maxX: 26,
  minZ: -128, maxZ: 1,
  spawn: { x: 0, z: -4 },
  bossZ: -55, // Radio Monster stands here
  fightZ: -40, // walking past this starts the boss fight
  goalZ: -118, // the front doors of Xfinity Live!
}

const HURT_INVULN = 1200 // ms of flashing after a hit
const KNOCK_SPEED = 6 // m/s shove away from whatever hit him
const KNOCK_TIME = 250 // ms

// Level 1 is done: freeze its score and walk out into the lot
export function startLevel2() {
  const s = getState()
  setState({
    level: 2,
    l1: scoreParts(s),
    complete: false,
    startedAt: performance.now(),
    finishedAt: null,
    hits: 0,
    hearts: 5,
    invulnUntil: 0,
    talk: null,
    nearby: null,
    nearDoor: false,
  })
  player.teleport = { ...LOT.spawn }
  relocate(LOT.spawn.x, LOT.spawn.z)
  startMusic()
}

// Furthest point reached that Hinkie gets back up at after losing all hearts
export function checkpoint() {
  const s = getState()
  if (s.bossBeaten) return { x: 0, z: -72 }
  if (player.z < LOT.fightZ + 2 || s.bossHp != null) return { x: 0, z: LOT.fightZ + 2 }
  return { ...LOT.spawn }
}

// Something hit Hinkie, coming from (fromX, fromZ)
export function hurt(fromX, fromZ) {
  const s = getState()
  const now = performance.now()
  if (s.complete || now < s.invulnUntil) return false
  const dx = player.x - fromX
  const dz = player.z - fromZ
  const d = Math.hypot(dx, dz) || 1
  player.knock = { vx: (dx / d) * KNOCK_SPEED, vz: (dz / d) * KNOCK_SPEED, until: now + KNOCK_TIME }
  const hearts = s.hearts - 1
  if (hearts > 0) {
    setState({ hearts, hits: s.hits + 1, invulnUntil: now + HURT_INVULN })
    return true
  }
  // Out of hearts: back on his feet at the last checkpoint
  const at = checkpoint()
  setState({ hearts: 5, hits: s.hits + 1, invulnUntil: now + HURT_INVULN * 2 })
  player.teleport = at
  player.knock = null
  relocate(at.x, at.z)
  toast('Down, but not out. Trust the Process.')
  return true
}
