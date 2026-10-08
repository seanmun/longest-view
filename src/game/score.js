// Scoring. Everything is computed from game state, so it's always consistent.
import { FAN_COUNT, PEOPLE, MOB } from './level1.js'

export const POINTS = {
  fan: 1000, // per person won over
  antiFan: 500, // per anti-fan sent packing
  hit: -250, // per hit Hinkie takes
  speedMax: 3000, // speed bonus at 0:00, falling...
  speedPerSecond: 10, // ...this much per second (zero at 5:00)
  boss: 2000, // the Radio Monster
}

export function scoreParts(s, now = performance.now()) {
  const fans = PEOPLE.filter((p) => p.fan && s.flags[p.id]).length
  const antiFans = MOB.length - s.mobLeft
  const seconds = s.startedAt ? ((s.finishedAt ?? now) - s.startedAt) / 1000 : 0
  const parts = {
    fans, antiFans, seconds, hits: s.hits,
    fanPoints: fans * POINTS.fan,
    antiFanPoints: antiFans * POINTS.antiFan,
    hitPoints: s.hits * POINTS.hit,
    speedPoints: s.finishedAt ? Math.max(0, Math.round(POINTS.speedMax - seconds * POINTS.speedPerSecond)) : 0,
  }
  parts.total = Math.max(0, parts.fanPoints + parts.antiFanPoints + parts.hitPoints + parts.speedPoints)
  return parts
}

export const FANS_TOTAL = FAN_COUNT

// Level 2: parking-lot anti-fans, the Radio Monster, hits, speed
export function level2Parts(s, now = performance.now()) {
  const seconds = s.startedAt ? ((s.finishedAt ?? now) - s.startedAt) / 1000 : 0
  const parts = {
    antiFans: s.enemiesBeaten, seconds, hits: s.hits,
    antiFanPoints: s.enemiesBeaten * POINTS.antiFan,
    bossPoints: s.bossBeaten ? POINTS.boss : 0,
    hitPoints: s.hits * POINTS.hit,
    speedPoints: s.finishedAt ? Math.max(0, Math.round(POINTS.speedMax - seconds * POINTS.speedPerSecond)) : 0,
  }
  parts.total = Math.max(0, parts.antiFanPoints + parts.bossPoints + parts.hitPoints + parts.speedPoints)
  return parts
}

// Running total across levels
export function totalScore(s, now) {
  if (s.level === 1) return scoreParts(s, now).total
  return (s.l1?.total ?? 0) + level2Parts(s, now).total
}

const BEST_KEY = 'longest-view-best'
export function readBest() {
  try { return Number(localStorage.getItem(BEST_KEY)) || 0 } catch { return 0 }
}
export function saveBest(score) {
  try { if (score > readBest()) localStorage.setItem(BEST_KEY, String(score)) } catch { /* storage blocked */ }
}
