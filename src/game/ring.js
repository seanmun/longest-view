// Level 1 ring geometry. Angles run around the ring from +Z toward +X
// (three.js cylinder convention); the lap starts at angle 0.
export const R_IN = 26 // inner wall (arena side)
export const R_OUT = 36 // outer wall
export const R_MID = (R_IN + R_OUT) / 2

// Position on the ring floor at radius r, angle a
export function polar(r, a, y = 0) {
  return [r * Math.sin(a), y, r * Math.cos(a)]
}
