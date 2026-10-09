// Arcade-style top 10: the list, the name entry on the final card, and the
// Top Scores popup on the start screen.
import { useEffect, useState } from 'react'
import { fetchTop, submitScore, lastName, rememberName } from '../game/leaderboard.js'

const SHORT = '[@media(max-height:500px)]:'

export function Board({ rows, mine }) {
  if (!rows.length) return <p className="text-lg text-white/70">No scores yet. Be the first.</p>
  return (
    <ol className={`w-full text-left text-lg ${SHORT}text-base`}>
      {rows.map((r, i) => {
        const me = mine && r.name === mine.name && r.score === mine.score
        return (
          <li key={i} className={`flex items-baseline gap-3 rounded-md px-2 py-0.5 ${me ? 'bg-[#E8B800] text-black' : ''}`}>
            <span className={`title w-8 text-sm ${me ? '' : 'text-[#E8B800]'}`}>{i + 1}</span>
            <span className="flex-1 truncate">{r.name}</span>
            <span className="tabular-nums font-bold">{r.score.toLocaleString()}</span>
          </li>
        )
      })}
    </ol>
  )
}

// Final score card: type a name, post it, see where you landed
export function SubmitScore({ run }) {
  const [name, setName] = useState(lastName)
  const [status, setStatus] = useState('idle') // idle | sending | done | error
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  async function send(e) {
    e.preventDefault()
    const clean = name.trim()
    if (!clean) return
    setStatus('sending')
    try {
      const data = await submitScore({ ...run, name: clean })
      rememberName(clean)
      setResult({ ...data, mine: { name: clean, score: run.score } })
      setStatus('done')
    } catch (err) {
      setError(err.message === 'unavailable' ? "Couldn't reach the leaderboard. Try again." : err.message)
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <div className="w-full max-w-md rounded-2xl border-2 border-[#E8B800] bg-[#0f1830] px-5 py-3">
        <div className="title mb-2 text-sm text-[#E8B800]">TOP SCORES</div>
        <Board rows={result.top} mine={result.mine} />
        <p className="mt-2 text-lg">You're <span className="font-bold text-[#E8B800]">#{result.rank}</span> all time.</p>
      </div>
    )
  }
  return (
    <form onSubmit={send} className="flex w-full max-w-md flex-col gap-2 rounded-2xl border-2 border-[#E8B800] bg-[#0f1830] px-5 py-3">
      <label htmlFor="lv-name" className="title text-sm text-[#E8B800]">ENTER YOUR NAME</label>
      <div className="flex gap-2">
        <input
          id="lv-name"
          value={name}
          onChange={(e) => setName(e.target.value.replace(/[^A-Za-z0-9 _-]/g, '').slice(0, 12))}
          maxLength={12}
          autoComplete="nickname"
          placeholder="Your name"
          className="min-h-12 min-w-0 flex-1 rounded-xl border border-white/30 bg-black/40 px-3 text-xl text-white placeholder:text-white/40"
        />
        <button
          type="submit"
          disabled={!name.trim() || status === 'sending'}
          className="min-h-12 rounded-xl bg-[#E8B800] px-5 text-lg font-bold text-black disabled:opacity-50 active:bg-[#c99f00]"
        >
          {status === 'sending' ? '…' : 'Post score'}
        </button>
      </div>
      {status === 'error' && <p className="text-base text-[#ff7a8a]">{error}</p>}
    </form>
  )
}

// Start screen: a button that opens the current top 10
export function TopScoresButton() {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    if (!open) return
    setRows(null)
    setFailed(false)
    fetchTop().then(setRows, () => setFailed(true))
  }, [open])
  return (
    <>
      <button
        className="absolute left-4 top-4 min-h-12 rounded-xl border border-[#E8B800]/60 px-5 text-lg text-[#E8B800]"
        onClick={() => setOpen(true)}
      >
        Top scores
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" onClick={() => setOpen(false)}>
          <div className={`w-full max-w-md rounded-2xl border-2 border-[#E8B800] bg-[#0f1830] p-5 ${SHORT}p-3`} onClick={(e) => e.stopPropagation()}>
            <div className="title mb-3 text-sm text-[#E8B800]">TOP SCORES</div>
            {failed ? <p className="text-lg text-white/70">Couldn't reach the leaderboard.</p>
              : rows ? <Board rows={rows} /> : <p className="text-lg text-white/70">Loading…</p>}
            <button className="mt-4 min-h-12 w-full rounded-xl bg-[#E8B800] text-lg font-bold text-black" onClick={() => setOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </>
  )
}
