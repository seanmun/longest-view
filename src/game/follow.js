// Convinced fans follow Hinkie as a loose crowd. Hinkie drops breadcrumbs as
// he walks; each follower owns a spot some distance back along that trail
// and off to one side, so the crowd bends with the concourse instead of
// cutting through walls. Followers steer smoothly toward their spot, keep a
// little space from each other and from Hinkie, and pick a gait (idle /
// walk / run) with hysteresis so their animation doesn't flicker.
import { player } from './state.js'
import { R_IN, R_OUT } from './ring.js'

// Keeps a follower's spot inside the level's walkable area. Each level sets it.
export const bounds = {
  clamp: (x, z) => {
    const r = Math.hypot(x, z)
    const c = Math.min(R_OUT - 0.7, Math.max(R_IN + 0.7, r))
    return [x * c / r, z * c / r]
  },
}

const CRUMB = 0.25 // m between breadcrumbs
const MAX_CRUMBS = 400 // ~100 m of trail
const BACK_MIN = 1.8 // m behind Hinkie for the closest spot
const BACK_STEP = 0.9 // m further back per extra follower (on average)
const SIDE_MAX = 1.4 // m either side of the trail
const MAX_SPEED = 6.5 // m/s, enough to catch up with a running Hinkie
const ACCEL = 9 // m/s² toward the desired velocity
const ARRIVE = 1.6 // m/s of desired speed per meter from the spot
const PERSONAL_SPACE = 0.9 // m kept between followers, and from Hinkie
const TURN = 8 // how fast they turn to face where they're going
const VOLLEY_SHARE = 0.3 // chance each apostle joins in when Hinkie throws
const VOLLEY_DELAY = [0.12, 0.75] // s, random delay before each one throws

const trail = [] // newest first
export const order = [] // follower ids, in the order they joined
export const followers = {} // id -> state, see join()

export const isFollowing = (id) => id in followers

export function join(id, x, z) {
  if (isFollowing(id)) return
  const n = order.length
  order.push(id)
  followers[id] = {
    x, z, vx: 0, vz: 0, yaw: 0, speed: 0, gait: 'idle',
    joinedAt: performance.now(),
    back: BACK_MIN + n * BACK_STEP + Math.random() * 0.6,
    side: (n % 2 ? 1 : -1) * (0.3 + Math.random() * (SIDE_MAX - 0.3)),
    phase: Math.random() * Math.PI * 2, // so each one's spot drifts on its own
  }
}

// The point `dist` meters back along Hinkie's trail, and the trail direction there
function behind(dist) {
  let px = player.x
  let pz = player.z
  for (const c of trail) {
    const step = Math.hypot(c.x - px, c.z - pz)
    if (step >= dist) {
      const t = dist / step
      return { x: px + (c.x - px) * t, z: pz + (c.z - pz) * t, dx: (px - c.x) / step, dz: (pz - c.z) / step }
    }
    dist -= step
    px = c.x
    pz = c.z
  }
  return null // trail doesn't reach that far back yet
}

// Hinkie threw: roughly 30% of the crowd throw too, each a beat apart.
// Followers pick this up in their own frame loop (Placeholders.jsx).
export function volley(time) {
  for (const id of order) {
    const f = followers[id]
    if (f.throwAt || Math.random() > VOLLEY_SHARE) continue
    f.throwAt = time + VOLLEY_DELAY[0] + Math.random() * (VOLLEY_DELAY[1] - VOLLEY_DELAY[0])
  }
}

// Move the whole crowd (new level, or Hinkie respawning): drop them just
// behind Hinkie and start a fresh trail.
export function relocate(x, z, backX = 0, backZ = 1) {
  trail.length = 0
  order.forEach((id, i) => {
    const f = followers[id]
    f.x = x + backX * (1.5 + i * 0.8) + ((i % 3) - 1) * 0.9
    f.z = z + backZ * (1.5 + i * 0.8)
    f.vx = 0
    f.vz = 0
  })
}

const angleTo = (from, to) => Math.atan2(Math.sin(to - from), Math.cos(to - from))

export function updateFollowers(rawDt, time) {
  const dt = Math.min(rawDt, 0.05)
  const last = trail[0]
  if (!last || Math.hypot(player.x - last.x, player.z - last.z) > CRUMB) {
    trail.unshift({ x: player.x, z: player.z })
    if (trail.length > MAX_CRUMBS) trail.pop()
  }

  for (const id of order) {
    const f = followers[id]

    // Where this follower wants to be: their spot behind Hinkie, drifting a little
    const spot = behind(f.back + Math.sin(time * 0.5 + f.phase) * 0.3)
    let tx = f.x
    let tz = f.z
    if (spot) {
      const side = f.side + Math.sin(time * 0.37 + f.phase * 2) * 0.25
      tx = spot.x - spot.dz * side // perpendicular to the trail
      tz = spot.z + spot.dx * side
      ;[tx, tz] = bounds.clamp(tx, tz) // keep the spot inside the level
    }

    // Arrive: fast when far, easing in close
    let dx = tx - f.x
    let dz = tz - f.z
    const d = Math.hypot(dx, dz)
    const want = Math.min(MAX_SPEED, d * ARRIVE)
    let wx = d > 0.05 ? (dx / d) * want : 0
    let wz = d > 0.05 ? (dz / d) * want : 0

    // Personal space from Hinkie and the rest of the crowd
    const push = (ox, oz) => {
      const sx = f.x - ox
      const sz = f.z - oz
      const s = Math.hypot(sx, sz)
      if (s > 0.001 && s < PERSONAL_SPACE) {
        const k = ((PERSONAL_SPACE - s) / PERSONAL_SPACE) * 3
        wx += (sx / s) * k
        wz += (sz / s) * k
      }
    }
    push(player.x, player.z)
    for (const other of order) if (other !== id) push(followers[other].x, followers[other].z)

    // Smoothly change velocity, then move
    const ax = wx - f.vx
    const az = wz - f.vz
    const a = Math.hypot(ax, az)
    const step = Math.min(a, ACCEL * dt)
    if (a > 0) { f.vx += (ax / a) * step; f.vz += (az / a) * step }
    f.x += f.vx * dt
    f.z += f.vz * dt
    f.speed = Math.hypot(f.vx, f.vz)

    // Face where they're throwing, else where they're going, else Hinkie
    const face = f.aimUntil > time ? f.aimYaw
      : f.speed > 0.4 ? Math.atan2(f.vx, f.vz) : Math.atan2(player.x - f.x, player.z - f.z)
    f.yaw += angleTo(f.yaw, face) * Math.min(1, TURN * dt)

    // Gait with hysteresis so clips don't flicker at the boundaries
    if (f.gait === 'idle' && f.speed > 0.7) f.gait = 'walk'
    else if (f.gait === 'walk' && f.speed < 0.35) f.gait = 'idle'
    else if (f.gait === 'walk' && f.speed > 4.6) f.gait = 'run'
    else if (f.gait === 'run' && f.speed < 3.6) f.gait = 'walk'
  }
}
