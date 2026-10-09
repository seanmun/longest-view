// Leaderboard API (Vercel serverless function).
//   GET  /api/scores            -> { top: [...10] }
//   POST /api/scores {name, score, level, apostles, seconds} -> { rank, top }
// Reads DATABASE_URL from the Vercel project settings. No fallback: a missing
// URL fails loudly instead of quietly writing somewhere else.
import { neon } from '@neondatabase/serverless'

const TOP = 10
const MAX_SCORE = 30000 // well above the best possible run (~22,000)
const NAME_RE = /^[A-Za-z0-9 _-]{1,12}$/
const BLOCKED = /(fuck|shit|cunt|nigg|fag|bitch|rape|nazi)/i

function db() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')
  return neon(url)
}

const top = (sql) => sql`
  SELECT name, score, level, apostles, seconds
  FROM longest_view_scores
  ORDER BY score DESC, created_at ASC
  LIMIT ${TOP}`

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  try {
    if (req.method === 'GET') {
      return res.status(200).json({ top: await top(db()) })
    }
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body ?? {})
      const name = String(body.name ?? '').trim().replace(/\s+/g, ' ')
      const score = Math.round(Number(body.score))
      const level = Number(body.level)
      const apostles = Math.round(Number(body.apostles) || 0)
      const seconds = Math.round(Number(body.seconds) || 0)
      if (!NAME_RE.test(name) || BLOCKED.test(name)) return res.status(400).json({ error: 'Pick a different name (1-12 letters or numbers).' })
      if (!Number.isFinite(score) || score < 0 || score > MAX_SCORE) return res.status(400).json({ error: 'Invalid score.' })
      if (level !== 1 && level !== 2) return res.status(400).json({ error: 'Invalid level.' })
      if (apostles < 0 || apostles > 20 || seconds < 0 || seconds > 86400) return res.status(400).json({ error: 'Invalid run.' })

      const sql = db()
      await sql`INSERT INTO longest_view_scores (name, score, level, apostles, seconds)
                VALUES (${name}, ${score}, ${level}, ${apostles}, ${seconds})`
      const [{ rank }] = await sql`SELECT COUNT(*)::int + 1 AS rank FROM longest_view_scores WHERE score > ${score}`
      return res.status(200).json({ rank, top: await top(sql) })
    }
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Leaderboard is unavailable right now.' })
  }
}
