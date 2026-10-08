// Scoring. Everything is computed from game state, so it's always consistent.
import { FAN_COUNT, PEOPLE, MOB } from './level1.js'

export const POINTS = {
  fan: 1000, // per person won over
  antiFan: 500, // per anti-fan sent packing
  analyst: 500, // bonus for the right call with the analyst
  hit: -250, // per hit Hinkie takes
  speedMax: 3000, // speed bonus at 0:00, falling...
  speedPerSecond: 10, // ...this much per second (zero at 5:00)
}

export function scoreParts(s, now = performance.now()) {
  const fans = PEOPLE.filter((p) => p.fan && s.flags[p.id]).length
  const antiFans = MOB.length - s.mobLeft
  const seconds = s.startedAt ? ((s.finishedAt ?? now) - s.startedAt) / 1000 : 0
  const parts = {
    fans, antiFans, seconds, hits: s.hits,
    fanPoints: fans * POINTS.fan,
    antiFanPoints: antiFans * POINTS.antiFan,
    analystPoints: s.analystRight ? POINTS.analyst : 0,
    hitPoints: s.hits * POINTS.hit,
    speedPoints: s.finishedAt ? Math.max(0, Math.round(POINTS.speedMax - seconds * POINTS.speedPerSecond)) : 0,
  }
  parts.total = Math.max(0, parts.fanPoints + parts.antiFanPoints + parts.analystPoints + parts.hitPoints + parts.speedPoints)
  return parts
}

export const FANS_TOTAL = FAN_COUNT

const BEST_KEY = 'longest-view-best'
export function readBest() {
  try { return Number(localStorage.getItem(BEST_KEY)) || 0 } catch { return 0 }
}
export function saveBest(score) {
  try { if (score > readBest()) localStorage.setItem(BEST_KEY, String(score)) } catch { /* storage blocked */ }
}
