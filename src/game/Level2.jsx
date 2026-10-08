// Level 2: the parking lot between the arena and Xfinity Live!.
// Two anti-fans jump Hinkie outside the doors while three run ahead. Mid-lot,
// the Two-Headed Radio Monster (Eskin + Angelo) blasts sound waves; Hinkie
// can't finish it alone until the RTRS monster (Spike + Levin) shows up and
// blasts back, then joins the apostles. Beat the last three anti-fans and
// walk up to Xfinity Live! to finish.
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { AdditiveBlending, Color, DoubleSide, Object3D, RingGeometry } from 'three'
import Model from './Model.jsx'
import { PersonModel, TwoHeaded } from './Placeholders.jsx'
import { COLORS } from './colors.js'
import { PEOPLE } from './level1.js'
import { getState, setState, useGame, player, toast } from './state.js'
import { targets } from './targets.js'
import { bounds, join } from './follow.js'
import { LOT, hurt } from './levels.js'
import { sfx, stopMusic } from './audio.js'

const params = new URLSearchParams(window.location.search)

// ---------------------------------------------------------------- the lot

const CAR_COLORS = ['#b23a48', '#e8e8e8', '#2b4f8c', '#1a1a1a', '#8a8f99', '#c9a227', '#3d6b4f', '#5b2a6e']
const CAR = { w: 1.9, h: 1.3, l: 4.4 }
const CARS = []
for (const rowZ of [-16, -24, -84, -92]) {
  for (const side of [-1, 1]) {
    for (let i = 0; i < 7; i++) {
      if ((i * 7 + rowZ) % 5 === 0) continue // a few empty stalls
      CARS.push({ x: side * (7.5 + i * 2.7), z: rowZ, color: CAR_COLORS[(i * 3 + Math.abs(rowZ)) % CAR_COLORS.length] })
    }
  }
}
const inCar = (x, z, pad = 0) => CARS.find((c) => Math.abs(x - c.x) < CAR.w / 2 + pad && Math.abs(z - c.z) < CAR.l / 2 + pad)

// Push a point out of any car it's inside (enemies don't have physics bodies)
function outOfCars(p, pad = 0.4) {
  const c = inCar(p.x, p.z, pad)
  if (!c) return
  const ox = CAR.w / 2 + pad - Math.abs(p.x - c.x)
  const oz = CAR.l / 2 + pad - Math.abs(p.z - c.z)
  if (ox < oz) p.x += Math.sign(p.x - c.x || 1) * ox
  else p.z += Math.sign(p.z - c.z || 1) * oz
}

function Cars() {
  const bodies = useRef()
  const cabins = useRef()
  useLayoutEffect(() => {
    const o = new Object3D()
    const color = new Color()
    CARS.forEach((c, i) => {
      o.position.set(c.x, CAR.h / 2, c.z)
      o.updateMatrix()
      bodies.current.setMatrixAt(i, o.matrix)
      bodies.current.setColorAt(i, color.set(c.color))
      o.position.set(c.x, CAR.h + 0.28, c.z - 0.2)
      o.updateMatrix()
      cabins.current.setMatrixAt(i, o.matrix)
    })
    bodies.current.instanceMatrix.needsUpdate = true
    bodies.current.instanceColor.needsUpdate = true
    cabins.current.instanceMatrix.needsUpdate = true
  }, [])
  return (
    <>
      <instancedMesh ref={bodies} args={[undefined, undefined, CARS.length]}>
        <boxGeometry args={[CAR.w, CAR.h, CAR.l]} />
        <meshStandardMaterial roughness={0.35} metalness={0.4} />
      </instancedMesh>
      <instancedMesh ref={cabins} args={[undefined, undefined, CARS.length]}>
        <boxGeometry args={[CAR.w - 0.2, 0.56, CAR.l * 0.5]} />
        <meshStandardMaterial color="#1c2733" roughness={0.1} metalness={0.6} />
      </instancedMesh>
      <RigidBody type="fixed" colliders={false}>
        {CARS.map((c, i) => <CuboidCollider key={i} args={[CAR.w / 2, CAR.h / 2 + 0.3, CAR.l / 2]} position={[c.x, CAR.h / 2 + 0.3, c.z]} />)}
      </RigidBody>
    </>
  )
}

function StallLines() {
  const ref = useRef()
  const lines = useMemo(() => {
    const out = []
    for (const rowZ of [-16, -24, -84, -92]) for (const side of [-1, 1]) for (let i = 0; i <= 7; i++) out.push([side * (6.15 + i * 2.7), rowZ])
    return out
  }, [])
  useLayoutEffect(() => {
    const o = new Object3D()
    lines.forEach(([x, z], i) => {
      o.position.set(x, 0.01, z)
      o.rotation.set(-Math.PI / 2, 0, 0)
      o.updateMatrix()
      ref.current.setMatrixAt(i, o.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  }, [lines])
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, lines.length]}>
      <planeGeometry args={[0.12, 5]} />
      <meshBasicMaterial color="#d8d8d0" />
    </instancedMesh>
  )
}

function Stadium({ position, radius, height, label }) {
  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[radius, radius * 1.08, height, 40, 1, true]} />
        <meshStandardMaterial color="#1b1f2e" side={DoubleSide} />
      </mesh>
      <mesh position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.5, 6, 40]} />
        <meshBasicMaterial color="#fff6d8" />
      </mesh>
      <Text position={[0, height + 5, 0]} fontSize={4.5} color="#cfd6ff" outlineWidth={0.1} outlineColor="#000">{label}</Text>
    </group>
  )
}

function Lot() {
  const goalOpen = useGame((s) => s.bossBeaten && s.enemiesBeaten >= ENEMIES.length)
  return (
    <>
      <color attach="background" args={['#070b22']} />
      <fog attach="fog" args={['#0b1030', 45, 190]} />
      <ambientLight intensity={0.55} color="#b8c0e0" />
      <hemisphereLight args={['#9aa8d8', '#3a3a44', 1.6]} />
      <directionalLight position={[-20, 40, 10]} intensity={1} color="#c8d0ff" />
      {[[-12, -30], [12, -55], [-12, -80], [12, -105]].map(([x, z]) => (
        <pointLight key={z} position={[x, 9, z]} intensity={260} distance={45} color="#ffe6b0" />
      ))}

      {/* Asphalt */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -65]}>
        <planeGeometry args={[160, 300]} />
        <meshStandardMaterial color="#3a3d46" />
      </mesh>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[80, 0.1, 150]} position={[0, -0.1, -65]} />
        {/* Invisible edges of the playable lot */}
        <CuboidCollider args={[0.5, 4, 70]} position={[LOT.minX - 0.5, 4, -64]} />
        <CuboidCollider args={[0.5, 4, 70]} position={[LOT.maxX + 0.5, 4, -64]} />
        <CuboidCollider args={[30, 4, 0.5]} position={[0, 4, LOT.minZ - 2]} />
      </RigidBody>
      <StallLines />
      {[-4, 4].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.01, -64]}>
          <planeGeometry args={[0.16, 128]} />
          <meshBasicMaterial color="#e8c547" />
        </mesh>
      ))}
      <Cars />

      {/* Light poles */}
      {[-12, 12].flatMap((x) => [-30, -55, -80, -105].map((z) => (
        <group key={`${x}${z}`} position={[x, 0, z]}>
          <mesh position={[0, 4.5, 0]}><cylinderGeometry args={[0.12, 0.16, 9, 8]} /><meshStandardMaterial color="#555a66" /></mesh>
          <mesh position={[0, 9.1, 0]}><boxGeometry args={[1.2, 0.25, 0.5]} /><meshBasicMaterial color="#fff2cc" /></mesh>
        </group>
      )))}

      {/* The arena behind Hinkie */}
      <RigidBody type="fixed" colliders={false} position={[0, 7, 3]}>
        <CuboidCollider args={[40, 7, 1]} />
        <mesh><boxGeometry args={[80, 14, 2]} /><meshStandardMaterial color="#2e3445" /></mesh>
      </RigidBody>
      <mesh position={[0, 1.35, 1.95]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[3.2, 2.7]} />
        <meshStandardMaterial color="#a8d0f0" transparent opacity={0.35} metalness={0.6} roughness={0.05} />
      </mesh>
      <Text position={[0, 9, 1.9]} rotation={[0, Math.PI, 0]} fontSize={1.6} color="#ffffff" outlineWidth={0.04} outlineColor="#000">WELLS FARGO CENTER</Text>

      {/* South Philly skyline */}
      <Stadium position={[-95, 0, -185]} radius={36} height={18} label="LINCOLN FINANCIAL FIELD" />
      <Stadium position={[105, 0, -175]} radius={30} height={13} label="CITIZENS BANK PARK" />

      {/* Xfinity Live! */}
      <RigidBody type="fixed" colliders={false} position={[0, 5, -137]}>
        <CuboidCollider args={[20, 5, 8]} />
        <mesh><boxGeometry args={[40, 10, 16]} /><meshStandardMaterial color="#23263a" /></mesh>
      </RigidBody>
      <Text position={[0, 7.6, -128.9]} fontSize={2.6} color="#ff5a76" outlineWidth={0.06} outlineColor="#7a0020">XFINITY LIVE!</Text>
      <mesh position={[0, 1.8, -128.9]}>
        <planeGeometry args={[6, 3.6]} />
        <meshBasicMaterial color={goalOpen ? '#ffd27a' : '#3a2a20'} />
      </mesh>
      {goalOpen && <pointLight position={[0, 3, -126]} intensity={60} distance={18} color="#ffd27a" />}
    </>
  )
}

// ---------------------------------------------------------------- anti-fans

const ENEMY_HP = 2
const ENEMY_SPEED = 3.2 // m/s; Hinkie walks 4
const AGGRO = 11 // m: they come at Hinkie once he's this close
const GRACE = 3 // s at the start of the level before anyone charges
const REACH = 1.1 // m: close enough to shove him
const STUN = 0.7 // s after a ball hits
const ATTACK_REST = 1.1 // s after a shove before they can shove again
const ENEMY_HIT_RADIUS = 0.6

// `ahead` ones run off to wait by Xfinity Live!
const ENEMIES = [
  { id: 'pj', name: 'PJ', model: 'pj', idle: 'stomp', x: -2.5, z: -19 },
  { id: 'rick', name: 'RICK', model: 'rick', idle: 'stomp', x: 2.5, z: -20 },
  { id: 'badman', name: 'BADMAN', model: 'badman', idle: 'stomp', x: 0, z: -104, height: 1.9, ahead: true },
  { id: 'stine', name: 'STINE', model: 'stine', idle: 'taunt', x: -4, z: -101, ahead: true },
  { id: 'teamike', name: 'TEA MIKE', model: 'teamike', idle: 'stomp', x: 4, z: -102, ahead: true },
]
const enemies = ENEMIES.map((e) => ({
  ...e, hp: ENEMY_HP, t: 0, rest: 0,
  // the ones running ahead start by the doors and sprint off
  state: e.ahead ? 'retreat' : 'idle',
  px: e.ahead ? e.x * 0.5 : e.x, pz: e.ahead ? -6 : e.z,
}))

function hitEnemy(x, y, z) {
  if (y > 2.1) return false
  for (const e of enemies) {
    if (e.state === 'gone' || e.state === 'flee' || e.state === 'retreat') continue
    if (Math.hypot(x - e.px, z - e.pz) < ENEMY_HIT_RADIUS) {
      e.hp--
      sfx.dizzy()
      // knocked back away from the ball's side
      const dx = e.px - x
      const dz = e.pz - z
      const d = Math.hypot(dx, dz) || 1
      e.px += (dx / d) * 0.8
      e.pz += (dz / d) * 0.8
      if (e.hp <= 0) {
        e.state = 'flee'
        e.fleeX = e.px < 0 ? LOT.minX - 3 : LOT.maxX + 3
        if (e.id === 'badman') sfx.giggle()
      } else {
        e.state = 'stun'
        e.t = 0
      }
      return true
    }
  }
  return false
}

function Enemy({ e }) {
  const root = useRef()
  const body = useRef()
  const anim = useRef({ name: e.idle, speed: 1 })
  const stars = useRef()
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const g = root.current
    if (!g) return
    if (getState().complete) return
    e.t += dt
    e.rest = Math.max(0, e.rest - dt)
    const dx = player.x - e.px
    const dz = player.z - e.pz
    const d = Math.hypot(dx, dz)
    const moveTo = (tx, tz, speed) => {
      const mx = tx - e.px
      const mz = tz - e.pz
      const md = Math.hypot(mx, mz)
      if (md < 0.05) return true
      const step = Math.min(md, speed * dt)
      e.px += (mx / md) * step
      e.pz += (mz / md) * step
      body.current.rotation.y = Math.atan2(mx, mz)
      return md < 0.3
    }

    if (e.state === 'retreat') {
      anim.current = { name: 'run', speed: 1.3 }
      if (moveTo(e.x, e.z, 6)) e.state = 'idle'
    } else if (e.state === 'idle') {
      anim.current = { name: e.idle, speed: 1 }
      body.current.rotation.y = Math.atan2(dx, dz)
      const started = getState().startedAt
      if (d < AGGRO && started && performance.now() - started > GRACE * 1000) e.state = 'chase'
    } else if (e.state === 'chase') {
      if (e.rest > 0) {
        anim.current = { name: e.idle, speed: 1 }
        body.current.rotation.y = Math.atan2(dx, dz)
      } else {
        anim.current = { name: 'run', speed: 1 }
        moveTo(player.x, player.z, ENEMY_SPEED)
        if (d < REACH && hurt(e.px, e.pz)) { e.rest = ATTACK_REST; sfx.bad() }
      }
    } else if (e.state === 'stun') {
      anim.current = { name: 'hit', speed: 1.4 }
      if (e.t > STUN) { e.state = 'chase'; e.rest = 0.3 }
    } else if (e.state === 'flee') {
      anim.current = { name: 'run', speed: 1.3 }
      if (moveTo(e.fleeX, e.pz, 6.5) || Math.abs(e.px) > 28) {
        e.state = 'gone'
        setState((s) => ({ enemiesBeaten: s.enemiesBeaten + 1 }))
      }
    }
    if (e.state !== 'flee' && e.state !== 'retreat') outOfCars(e)
    g.visible = e.state !== 'gone'
    g.position.set(e.px, 0, e.pz)
    stars.current.visible = e.state === 'stun'
    stars.current.rotation.y += dt * 5
  })
  const h = e.height ?? 1.8
  return (
    <group ref={root}>
      <group ref={body}>
        <Model name={e.model} height={h} anim={anim} fallback={<PersonModel color={COLORS.sixersRed} />} />
      </group>
      <group ref={stars} position={[0, h + 0.25, 0]}>
        {[0, 1, 2].map((i) => {
          const a = (i / 3) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.cos(a) * 0.4, 0, Math.sin(a) * 0.4]} rotation={[0, a, Math.PI / 4]}>
              <octahedronGeometry args={[0.13]} />
              <meshBasicMaterial color={COLORS.gold} />
            </mesh>
          )
        })}
      </group>
      <Billboard position={[0, h + 0.2, 0]}>
        <Text fontSize={0.22} color="white" outlineWidth={0.02} outlineColor={COLORS.sixersRed}>{e.name}</Text>
      </Billboard>
    </group>
  )
}

// ---------------------------------------------------------------- two-headed monsters


// ---------------------------------------------------------------- sound waves

const WAVE_SPEED = 7.5 // m/s
const WAVE_RANGE = 34 // m
const BOSS_ARC = (40 * Math.PI) / 180
const RTRS_ARC = (26 * Math.PI) / 180
const MAX_WAVES = 14
const waves = [] // { x, z, heading, arc, r, owner, hit, target }

// heading: radians in the x/z plane, direction (cos h, sin h)
function fireWave(x, z, tx, tz, owner) {
  if (waves.length >= MAX_WAVES) waves.shift()
  waves.push({ x, z, heading: Math.atan2(tz - z, tx - x), arc: owner === 'boss' ? BOSS_ARC : RTRS_ARC, r: 0.8, owner, hit: false })
}

function Waves() {
  const groups = useRef([])
  const bossGeo = useMemo(() => new RingGeometry(0.9, 1, 32, 1, -BOSS_ARC / 2, BOSS_ARC).rotateX(-Math.PI / 2), [])
  const rtrsGeo = useMemo(() => new RingGeometry(0.88, 1, 24, 1, -RTRS_ARC / 2, RTRS_ARC).rotateX(-Math.PI / 2), [])
  useFrame(() => {
    for (let i = 0; i < MAX_WAVES; i++) {
      const g = groups.current[i]
      const w = waves[i]
      if (!g) continue
      g.visible = !!w
      if (!w) continue
      g.position.set(w.x, 0, w.z)
      g.rotation.y = -w.heading
      g.scale.setScalar(w.r)
      const boss = w.owner === 'boss'
      g.children.forEach((m, k) => {
        m.visible = k < 3 ? boss : !boss
        m.material.opacity = (1 - w.r / WAVE_RANGE) * (0.8 - (k % 3) * 0.2)
      })
    }
  })
  const mat = (color) => <meshBasicMaterial color={color} transparent opacity={0.7} side={DoubleSide} depthWrite={false} blending={AdditiveBlending} />
  return Array.from({ length: MAX_WAVES }, (_, i) => (
    <group key={i} ref={(g) => { groups.current[i] = g }} visible={false}>
      {/* boss: angry red-orange, RTRS: cyan; three stacked arcs read as a sound wave */}
      {[0.5, 1.1, 1.7].map((y) => <mesh key={`b${y}`} geometry={bossGeo} position={[0, y / 1, 0]}>{mat('#ff5a2a')}</mesh>)}
      {[0.6, 1.2, 1.8].map((y) => <mesh key={`r${y}`} geometry={rtrsGeo} position={[0, y, 0]}>{mat('#2ee6ff')}</mesh>)}
    </group>
  ))
}

// ---------------------------------------------------------------- the boss fight

const BOSS = { x: 0, z: LOT.bossZ, hp: 1, state: 'waiting', fireIn: 2, floorTime: 0, fightTime: 0 }
const BOSS_FIRE_EVERY = 2.1 // s
const BOSS_HIT_RADIUS = 1.5
const BALL_DAMAGE = 0.03
const RTRS_DAMAGE = 0.08
const SOLO_FLOOR = 0.5 // can't push it below half on his own
const RTRS = { x: 0, z: 0, state: 'hidden', fireIn: 1 }
const RTRS_FIRE_EVERY = 1.6
const RESCUE_AFTER = 25 // s into the fight, if nothing else triggered it

function hitBoss(x, y, z) {
  if (BOSS.state !== 'fight' || y > 3.6) return false
  if (Math.hypot(x - BOSS.x, z - BOSS.z) > BOSS_HIT_RADIUS) return false
  damageBoss(BALL_DAMAGE)
  return true
}

function damageBoss(amount) {
  const floor = getState().rescued ? 0 : SOLO_FLOOR
  const before = BOSS.hp
  BOSS.hp = Math.max(floor, BOSS.hp - amount)
  if (before > floor && BOSS.hp === floor && floor > 0) toast("It's too loud! Hinkie can't take it alone...")
  if (BOSS.hp <= 0 && BOSS.state === 'fight') {
    BOSS.state = 'beaten'
    BOSS.t = 0
    sfx.door()
    toast('The Radio Monster is off the air!')
    // RTRS joins the apostles for the rest of the game
    setState((s) => ({ bossBeaten: true, flags: { ...s.flags, rtrs: true } }))
    join('rtrs', RTRS.x, RTRS.z)
    RTRS.state = 'joined'
  }
}

function Boss() {
  const root = useRef()
  const sway = useRef()
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const s = getState()
    if (s.complete) return
    const g = root.current
    const d = Math.hypot(player.x - BOSS.x, player.z - BOSS.z)

    if (BOSS.state === 'waiting' && player.z < LOT.fightZ) {
      BOSS.state = 'fight'
      toast('The Two-Headed Radio Monster! Dodge the sound waves!')
    }
    if (BOSS.state === 'fight') {
      BOSS.fightTime += dt
      if (BOSS.hp <= SOLO_FLOOR + 0.001) BOSS.floorTime += dt
      BOSS.fireIn -= dt
      if (BOSS.fireIn <= 0 && d < WAVE_RANGE) {
        BOSS.fireIn = BOSS_FIRE_EVERY * (s.rescued ? 1.3 : 1)
        fireWave(BOSS.x, BOSS.z, player.x, player.z, 'boss')
        sfx.bad()
      }
      // Rescue: low on hearts, stuck at the floor, or just taking too long
      if (!s.rescued && (s.hearts <= 2 || BOSS.floorTime > 5 || BOSS.fightTime > RESCUE_AFTER)) {
        setState({ rescued: true })
        RTRS.state = 'arriving'
        RTRS.x = player.x + 6
        RTRS.z = player.z + 12
        toast('Spike Eskin and Michael Levin to the rescue!')
        sfx.page()
      }
      const shown = Math.round(BOSS.hp * 100) / 100
      if (s.bossHp !== shown) setState({ bossHp: shown })
      sway.current.rotation.z = Math.sin(BOSS.fightTime * 3) * 0.06
      g.rotation.y = Math.atan2(player.x - BOSS.x, player.z - BOSS.z)
    }
    if (BOSS.state === 'beaten') {
      // shrinks off the air, then gone
      BOSS.t += dt
      const k = Math.max(0, 1 - BOSS.t / 1.2)
      g.scale.setScalar(k)
      if (k === 0) { BOSS.state = 'gone'; setState({ bossHp: null }) }
    }
    g.visible = BOSS.state !== 'gone'
  })
  return (
    <group ref={root} position={[BOSS.x, 0, BOSS.z]}>
      <group ref={sway}>
        <TwoHeaded color="#6b3fa0" names={['ESKIN', 'ANGELO']} height={3.4} />
      </group>
    </group>
  )
}

// RTRS arrives behind Hinkie, stands off his shoulder, and blasts the boss
function Rescuers() {
  const root = useRef()
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const g = root.current
    if (RTRS.state === 'arriving' || RTRS.state === 'helping') {
      // a spot a few meters to Hinkie's side, facing the boss
      const tx = player.x + (player.x > BOSS.x ? 3.5 : -3.5)
      const tz = player.z + 2
      const dx = tx - RTRS.x
      const dz = tz - RTRS.z
      const d = Math.hypot(dx, dz)
      if (d > 0.2) {
        const step = Math.min(d, (RTRS.state === 'arriving' ? 8 : 4.5) * dt)
        RTRS.x += (dx / d) * step
        RTRS.z += (dz / d) * step
      }
      if (RTRS.state === 'arriving' && d < 1.5) RTRS.state = 'helping'
      if (RTRS.state === 'helping' && BOSS.state === 'fight') {
        RTRS.fireIn -= dt
        if (RTRS.fireIn <= 0) {
          RTRS.fireIn = RTRS_FIRE_EVERY
          fireWave(RTRS.x, RTRS.z, BOSS.x, BOSS.z, 'rtrs')
        }
      }
      g.position.set(RTRS.x, 0, RTRS.z)
      g.rotation.y = Math.atan2(BOSS.x - RTRS.x, BOSS.z - RTRS.z)
    }
    g.visible = RTRS.state === 'arriving' || RTRS.state === 'helping'
  })
  return (
    <group ref={root} visible={false}>
      <TwoHeaded color="#1f8a8a" names={['SPIKE', 'LEVIN']} height={2.4} />
    </group>
  )
}

// Advance waves; boss waves hurt Hinkie, RTRS waves hurt the boss
function WaveLogic() {
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    if (getState().complete) return
    for (let i = waves.length - 1; i >= 0; i--) {
      const w = waves[i]
      w.r += WAVE_SPEED * dt
      if (w.owner === 'boss' && !w.hit) {
        const d = Math.hypot(player.x - w.x, player.z - w.z)
        const ang = Math.atan2(player.z - w.z, player.x - w.x)
        const off = Math.abs(Math.atan2(Math.sin(ang - w.heading), Math.cos(ang - w.heading)))
        if (Math.abs(d - w.r) < 0.55 && off < w.arc / 2) { w.hit = true; hurt(w.x, w.z) }
      }
      if (w.owner === 'rtrs' && !w.hit && BOSS.state === 'fight') {
        const d = Math.hypot(BOSS.x - w.x, BOSS.z - w.z)
        if (w.r >= d - 0.8) { w.hit = true; damageBoss(RTRS_DAMAGE); waves.splice(i, 1); continue }
      }
      if (w.r > WAVE_RANGE) waves.splice(i, 1)
    }
  })
  return null
}

// ---------------------------------------------------------------- ambience

// Background fans with regular-size heads, wandering their patch of the lot
const WANDERERS = [
  [-18, -36], [17, -42], [-20, -66], [19, -70], [-15, -110], [16, -112],
].map(([x, z], i) => ({ x, z, hx: x, hz: z, tx: x, tz: z, wait: i, color: CAR_COLORS[(i * 2 + 1) % CAR_COLORS.length] }))

function Wanderer({ w }) {
  const ref = useRef()
  const step = useRef(Math.random() * 6)
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const g = ref.current
    if (w.wait > 0) {
      w.wait -= dt
      if (w.wait <= 0) { w.tx = w.hx + (Math.random() - 0.5) * 8; w.tz = w.hz + (Math.random() - 0.5) * 8 }
    } else {
      const dx = w.tx - w.x
      const dz = w.tz - w.z
      const d = Math.hypot(dx, dz)
      if (d < 0.1) w.wait = 2 + Math.random() * 4
      else {
        w.x += (dx / d) * Math.min(d, 1.1 * dt)
        w.z += (dz / d) * Math.min(d, 1.1 * dt)
        g.rotation.y = Math.atan2(dx, dz)
        step.current += dt * 9
      }
    }
    outOfCars(w)
    g.position.set(w.x, w.wait > 0 ? 0 : Math.abs(Math.sin(step.current)) * 0.06, w.z)
  })
  return <group ref={ref}><PersonModel color={w.color} height={1.75} /></group>
}

// ---------------------------------------------------------------- level logic

function Logic() {
  const warned = useRef(0)
  useEffect(() => {
    targets.hit = (x, y, z) => hitEnemy(x, y, z) || hitBoss(x, y, z)
    targets.nearest = (x, z, range) => {
      let best = null
      let bestD = range
      for (const e of enemies) {
        if (e.state !== 'idle' && e.state !== 'chase' && e.state !== 'stun') continue
        const d = Math.hypot(e.px - x, e.pz - z)
        if (d < bestD) { bestD = d; best = { x: e.px, z: e.pz } }
      }
      if (BOSS.state === 'fight') {
        const d = Math.hypot(BOSS.x - x, BOSS.z - z)
        if (d < bestD) best = { x: BOSS.x, z: BOSS.z }
      }
      return best
    }
    targets.wall = (x, y, z) => x < LOT.minX || x > LOT.maxX || z > 1.5 || z < LOT.minZ || y > 14 || (y < CAR.h && !!inCar(x, z))
    bounds.clamp = (x, z) => [Math.min(LOT.maxX - 1, Math.max(LOT.minX + 1, x)), Math.min(-1, Math.max(LOT.goalZ, z))]

    toast('Three of them ran for Xfinity Live! Deal with these two first.')

    // Testing: ?level=2&apostles=all brings the whole crowd
    if (params.get('apostles') === 'all' && !Object.keys(getState().flags).length) {
      const fans = PEOPLE.filter((p) => p.fan)
      setState({ flags: Object.fromEntries(fans.map((p) => [p.id, true])) })
      fans.forEach((p, i) => join(p.id, LOT.spawn.x + ((i % 3) - 1), LOT.spawn.z + 2 + Math.floor(i / 3)))
    }
    if (params.get('z')) player.teleport = { x: Number(params.get('x')) || 0, z: Number(params.get('z')) }
  }, [])

  useFrame(() => {
    const s = getState()
    if (s.complete) return
    const done = s.bossBeaten && s.enemiesBeaten >= ENEMIES.length
    const atDoor = player.z < LOT.goalZ + 1.5 && Math.abs(player.x) < 5
    if (atDoor && done) {
      setState({ complete: true, finishedAt: performance.now() })
      stopMusic()
      sfx.complete()
    } else if (atDoor && performance.now() - warned.current > 4000) {
      warned.current = performance.now()
      toast(s.bossBeaten ? 'Finish off the anti-fans first!' : 'The Radio Monster is still on the air!')
    }
  })
  return null
}

export default function Level2() {
  return (
    <>
      <Lot />
      {enemies.map((e) => <Enemy key={e.id} e={e} />)}
      <Boss />
      <Rescuers />
      <Waves />
      <WaveLogic />
      {WANDERERS.map((w, i) => <Wanderer key={i} w={w} />)}
      <Logic />
    </>
  )
}
