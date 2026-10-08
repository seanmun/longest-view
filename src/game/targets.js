// Hooks between systems that would otherwise import each other in a circle
// (balls -> mob -> people -> balls). Mob.jsx fills these in when it loads.
export const targets = {
  // Did a ball at (x, y, z) hit a mob member? (true pops the ball)
  hit: () => false,
  // Closest mob member still standing their ground within `range`, or null
  nearest: () => null,
}
