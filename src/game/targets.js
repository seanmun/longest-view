// Hooks between systems that would otherwise import each other in a circle
// (balls -> enemies -> people -> balls). Each level fills these in.
import { R_IN, R_OUT } from './ring.js'

export const targets = {
  // Did a ball at (x, y, z) hit an enemy? (true pops the ball)
  hit: () => false,
  // Closest enemy still fighting within `range`, or null: { x, z }
  nearest: () => null,
  // Did a ball at (x, y, z) hit the level's walls or ceiling?
  wall: (x, y, z) => { const r = Math.hypot(x, z); return r < R_IN + 0.1 || r > R_OUT - 0.1 || y > 4.4 },
}
