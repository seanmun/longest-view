# Longest View: Sam Hinkie's Revenge (3D)

Third-person story adventure (camera behind Hinkie) in the browser, desktop and phone. Satire of
the Process-era 76ers; Hinkie fights through hostile fans with explosive
ping pong balls. Doubles as a light ad for mnsfantasy.com (not "MNS.COM").

The 2D Phaser version is in git history (before the 3D rewrite) for story
and dialogue reference. Its old build spec lives there too; treat it as
direction, not law.

## Stack

Vite + React 19, React Three Fiber, drei, Rapier physics, Tailwind for UI
overlays. Leaderboard: `api/scores.js` (Vercel function) reads
`DATABASE_URL` server-side, table `longest_view_scores` (`db/*.sql`, run by
Sean in Neon). Never a `VITE_*` database URL, which would ship credentials
to the browser. The legacy `leaderboard` table is the old 2D game's: don't
touch it. `npm run dev` can't serve `/api`; use `vercel dev`.

## Layout

- `src/game/` — 3D scene: `Player` (Hinkie + orbit camera), `World`, `Placeholders`, `input`
- `src/ui/` — React overlays: desktop and touch controls

## Rules

- **Placeholders are real-scale.** Every stand-in shape matches its final
  Meshy model's size and position; swapping in a GLB changes nothing else.
- **Meshy flow:** Sean drops raw Meshy exports (zip or folder) into
  `models-raw/` (gitignored). Process with
  `node tools/process-model.mjs <name> models-raw/<zip> walk=Walking run=Running happy=Hip_Hop ...`
  (merges clips by bone name, simplifies to ~24k triangles, 1024px WebP).
  Load via `Model.jsx` (fits height, feet at y=0) and add to `Preload.jsx`.
  Real people are prompted as caricatures by description, never photos.
- **Units are meters.** People ~1.8m, eye height ~1.6m, walk 4 m/s.
- **Phone is first-class.** Every feature works with the touch controls.
  Large readable text (18px base), no dead ends.
- One system changed at a time; say the plan before changing feel
  (speeds, sensitivity, camera) and get approval on exact values.

## Levels

- **Level 1, lower concourse** (`World.jsx`, `level1.js`, `questions.js`):
  five one-shot questions recruit apostles; anti-fans at the glass exit.
- **Level 2, parking lot** (`Level2.jsx`, `levels.js`): 5 hearts (hit =
  -250, flashing invulnerability; 0 hearts = back up at the last
  checkpoint). PJ + Rick brawl at the doors; Badman, Stine, Tea Mike wait
  by Xfinity Live!. The Fanatic Duo (Eskin + Angelo, `duo.glb`) can't drop
  below 50% until the Two Process Guys arrive (3 hearts left, 2s stuck at
  the floor, or 10s), then RTRS joins the apostles.
- Testing: `?level=2&apostles=all`, plus `&z=-42` to spawn at the boss.

## Level 1 build order

1. Movement sandbox
2. Concourse layout (ring around the bowl, START / FINISH at the tunnel)
3. Dialogue: one-shot questions, copy in `src/game/questions.js`; cast and clusters in `src/game/level1.js`; scoring in `src/game/score.js`
4. ~~Binder puzzle~~ (cut). Level ends at glass exit doors once the anti-fans are gone
5. Fan mob encounter (5 fans wall off the door; ping pong balls pop into confetti, dizzy stars, they flee into the tunnel)
6. Intro + end card (`src/ui/Intro.jsx`, `EndCard` in `src/ui/Hud.jsx`)
7. Meshy models
8. Sound (synthesized in `src/game/audio.js`, no files; on/off toggle top-right)
