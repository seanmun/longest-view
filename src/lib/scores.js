import { supabase } from './supabase.js'

const STORAGE_KEY = 'longest-view-scores'

export function saveScore(initials, score, timeSeconds) {
  const entry = {
    initials: initials.toUpperCase(),
    score,
    time: timeSeconds,
    date: Date.now()
  }

  const scores = getTopScores(100)
  scores.push(entry)
  scores.sort((a, b) => b.score - a.score)
  const trimmed = scores.slice(0, 100)

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  } catch (e) {
    // localStorage full or unavailable
  }

  // Optional Supabase sync
  if (supabase) {
    supabase.from('leaderboard').insert({
      username: initials,
      score,
      time_seconds: timeSeconds
    }).then(() => {}).catch(() => {})
  }

  return entry
}

export function getTopScores(limit = 10) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const scores = JSON.parse(raw)
    scores.sort((a, b) => b.score - a.score)
    return scores.slice(0, limit)
  } catch (e) {
    return []
  }
}
