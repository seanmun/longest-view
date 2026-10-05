# Longest View: Sam Hinkie's Revenge (3D)

Third-person story adventure (camera behind Hinkie) in the browser, desktop and phone. Satire of
the Process-era 76ers; Hinkie fights through hostile fans with explosive
ping pong balls. Doubles as a light ad for mnsfantasy.com (not "MNS.COM").

The 2D Phaser version is in git history (before the 3D rewrite) for story
and dialogue reference. Its old build spec lives there too; treat it as
direction, not law.

## Stack

Vite + React 19, React Three Fiber, drei, Rapier physics, Tailwind for UI
overlays. No backend yet. A leaderboard, when it comes, goes through a
server-side `/api` function using `DATABASE_URL` — never a `VITE_*`
database URL, which would ship credentials to the browser.

## Layout

- `src/game/` — 3D scene: `Player` (Hinkie + orbit camera), `World`, `Placeholders`, `input`
- `src/ui/` — React overlays: desktop and touch controls

## Rules

- **Placeholders are real-scale.** Every stand-in shape matches its final
  Meshy model's size and position; swapping in a GLB changes nothing else.
- **Meshy flow:** Sean generates (bobblehead style) and drops the raw GLB
  into `models-raw/` (gitignored; Meshy exports run ~40 MB). Claude shrinks
  it to `public/models/<name>.glb` with gltf-transform — `weld`, then
  `simplify` to ~20k triangles, `resize` textures to 1024, `webp` — and
  wires it in via `Model.jsx` (fits height, feet at y=0, placeholder as
  the loading fallback). Characters without a rig get a code waddle.
- **Units are meters.** People ~1.8m, eye height ~1.6m, walk 4 m/s.
- **Phone is first-class.** Every feature works with the touch controls.
  Large readable text (18px base), no dead ends.
- One system changed at a time; say the plan before changing feel
  (speeds, sensitivity, camera) and get approval on exact values.

## Level 1 build order

1. Movement sandbox
2. Concourse layout (ring around the bowl, START / FINISH at the tunnel)
3. Dialogue system (convince 6 fans; cast and lines in `src/game/level1.js`)
4. Binder puzzle (3 pages unlock the locker-room door; walking in completes the level)
5. Fan mob encounter (5 fans wall off the door; ping pong balls pop into confetti, dizzy stars, they flee into the tunnel)
6. Intro + end card (`src/ui/Intro.jsx`, `EndCard` in `src/ui/Hud.jsx`)
7. Meshy models
8. Sound (synthesized in `src/game/audio.js`, no files; on/off toggle top-right)
