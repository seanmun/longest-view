// Convinced fans follow Hinkie in a line. Hinkie drops breadcrumbs as he
// walks; each follower heads for the point on that trail SPACING meters
// further back than the one ahead of it, so the line bends with the
// concourse instead of cutting through walls.
import { player } from './state.js'

const SPACING = 1.4 // m between people in the line
const CRUMB = 0.25 // m between breadcrumbs
const MAX_CRUMBS = 400 // ~100 m of trail
const WALK = 4.5 // m/s
const CATCH_UP = 7 // m/s when far behind

const trail = [] // newest first
export const order = [] // follower ids, in the order they joined
export const followers = {} // id -> { x, z, yaw, speed }

export const isFollowing = (id) => id in followers

export function join(id, x, z) {
  if (isFollowing(id)) return
  order.push(id)
  followers[id] = { x, z, yaw: 0, speed: 0 }
}

// The point `dist` meters back along Hinkie's trail
function behind(dist) {
  let px = player.x
  let pz = player.z
  for (const c of trail) {
    const step = Math.hypot(c.x - px, c.z - pz)
    if (step >= dist) {
      const t = dist / step
      return { x: px + (c.x - px) * t, z: pz + (c.z - pz) * t }
    }
    dist -= step
    px = c.x
    pz = c.z
  }
  return null // trail doesn't reach that far back yet
}

export function updateFollowers(dt) {
  const last = trail[0]
  if (!last || Math.hypot(player.x - last.x, player.z - last.z) > CRUMB) {
    trail.unshift({ x: player.x, z: player.z })
    if (trail.length > MAX_CRUMBS) trail.pop()
  }
  order.forEach((id, i) => {
    const f = followers[id]
    const target = behind((i + 1) * SPACING)
    if (!target) { f.speed = 0; return } // wait until Hinkie has walked far enough to make room
    const dx = target.x - f.x
    const dz = target.z - f.z
    const d = Math.hypot(dx, dz)
    if (d < 0.05) { f.speed = 0; return }
    const move = Math.min(d, (d > 4 ? CATCH_UP : WALK) * dt)
    f.x += (dx / d) * move
    f.z += (dz / d) * move
    f.yaw = Math.atan2(dx, dz)
    f.speed = move / dt
  })
}
