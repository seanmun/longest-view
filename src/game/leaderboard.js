// Talks to /api/scores (a Vercel function; `npm run dev` can't serve it,
// use `vercel dev` locally).
const NAME_KEY = 'longest-view-name'

export async function fetchTop() {
  const r = await fetch('/api/scores')
  if (!r.ok) throw new Error('unavailable')
  return (await r.json()).top
}

export async function submitScore(run) {
  const r = await fetch('/api/scores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(run),
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(data.error || 'unavailable')
  return data // { rank, top }
}

export function lastName() {
  try { return localStorage.getItem(NAME_KEY) || '' } catch { return '' }
}
export function rememberName(name) {
  try { localStorage.setItem(NAME_KEY, name) } catch { /* storage blocked */ }
}
