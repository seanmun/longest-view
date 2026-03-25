import { neon } from '@neondatabase/serverless'

const STORAGE_KEY = 'longest-view-scores'

// Initialize Neon SQL client
const dbUrl = import.meta.env.VITE_DATABASE_URL
const sql = dbUrl ? neon(dbUrl) : null

export async function saveScore(initials, score, timeSeconds) {
  const entry = {
    initials: initials.toUpperCase(),
    score,
    time: timeSeconds,
    date: Date.now()
  }

  // Always save to localStorage as backup
  const scores = getLocalScores(100)
  scores.push(entry)
  scores.sort((a, b) => b.score - a.score)
  const trimmed = scores.slice(0, 100)

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  } catch (e) {
    // localStorage full or unavailable
  }

  // Save to Neon
  if (sql) {
    try {
      await sql`
        INSERT INTO leaderboard (initials, score, time_seconds)
        VALUES (${entry.initials}, ${score}, ${timeSeconds})
      `
    } catch (e) {
      console.warn('Neon save failed:', e.message)
    }
  }

  return entry
}

export async function getTopScores(limit = 10) {
  // Try Neon first
  if (sql) {
    try {
      const rows = await sql`
        SELECT initials, score, time_seconds as time
        FROM leaderboard
        ORDER BY score DESC
        LIMIT ${limit}
      `
      if (rows.length > 0) return rows
    } catch (e) {
      console.warn('Neon fetch failed:', e.message)
    }
  }

  // Fallback to localStorage
  return getLocalScores(limit)
}

function getLocalScores(limit = 10) {
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
