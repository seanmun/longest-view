// Stand-in shapes for characters and props. Each matches the real-world size its
// Meshy model will have, so swapping in a model later changes nothing else.
import { Billboard, Text, useGLTF } from '@react-three/drei'
import { useMemo, useRef } from 'react'
import { Vector3 } from 'three'
import { useFrame } from '@react-three/fiber'
import { RigidBody, CapsuleCollider, CuboidCollider, CylinderCollider } from '@react-three/rapier'
import { COLORS } from './colors.js'
import { useGame, player } from './state.js'
import { PEOPLE } from './level1.js'
import { followers } from './follow.js'
import Model, { modelUrl } from './Model.jsx'
import { targets } from './targets.js'
import { throwBall } from './Balls.jsx'
import { sfx } from './audio.js'

export { COLORS }

// A body capsule and head, feet at y=0, facing +Z (the glTF convention Meshy models use).
export function PersonModel({ color = COLORS.sixersBlue, height = 1.8 }) {
  const radius = 0.3
  const body = height - 0.3 // leave room for the head
  return (
    <group>
      <mesh position={[0, body / 2, 0]}>
        <capsuleGeometry args={[radius, body - radius * 2, 4, 12]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, height - 0.15, 0]}>
        <sphereGeometry args={[0.15, 16, 12]} />
        <meshStandardMaterial color={COLORS.skin} />
      </mesh>
    </group>
  )
}

// Hinkie: navy suit, red tie, glasses. 1.8m to match the player capsule.
export function HinkieModel() {
  return (
    <group>
      <PersonModel color={COLORS.navy} height={1.8} />
      <mesh position={[0, 1.2, 0.29]}>
        <boxGeometry args={[0.08, 0.35, 0.03]} />
        <meshStandardMaterial color={COLORS.sixersRed} />
      </mesh>
      <mesh position={[0, 1.67, 0.14]}>
        <boxGeometry args={[0.22, 0.05, 0.03]} />
        <meshStandardMaterial color="#111111" />
      </mesh>
    </group>
  )
}

// A name tag that hides when it's right in front of the camera (followers
// crowd behind Hinkie, between him and the camera, where tags get huge)
const TAG_HIDE_NEAR = 4.5 // m from the camera
export function Tag({ position, children, ...text }) {
  const ref = useRef()
  const v = useMemo(() => new Vector3(), [])
  useFrame(({ camera }) => {
    if (ref.current) ref.current.visible = ref.current.getWorldPosition(v).distanceTo(camera.position) > TAG_HIDE_NEAR
  })
  return (
    <Billboard ref={ref} position={position}>
      <Text {...text}>{children}</Text>
    </Billboard>
  )
}

// A two-headed monster (Radio Monster, RTRS)
// Placeholder until Sean's Meshy models arrive: one big body, two heads
export function TwoHeaded({ color, names, height = 3 }) {
  const r = height * 0.24
  return (
    <group>
      <mesh position={[0, height * 0.38, 0]}>
        <capsuleGeometry args={[r, height * 0.45, 6, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {[-1, 1].map((s, i) => (
        <group key={s} position={[s * r * 0.75, height * 0.86, 0]}>
          <mesh><sphereGeometry args={[r * 0.62, 20, 16]} /><meshStandardMaterial color={COLORS.skin} /></mesh>
          {/* shouting mouth */}
          <mesh position={[0, -r * 0.18, r * 0.55]}><boxGeometry args={[r * 0.5, r * 0.28, 0.05]} /><meshBasicMaterial color="#2a0a0a" /></mesh>
          <Tag position={[0, r * 1, 0]} fontSize={0.28} color="white" outlineWidth={0.03} outlineColor="#000">{names[i]}</Tag>
        </group>
      ))}
    </group>
  )
}

const CELEBRATE_MS = 2500 // happy dance when a named fan is won over
const AIM_RANGE = 15 // m: apostles only throw at an anti-fan this close
const FAN_THROW = { name: 'throw', start: 0.3, speed: 2.5 } // Hinkie's clip, same timing
const FAN_RELEASE = 0.18 // s from wind-up to the ball leaving the hand
const FAN_THROW_SPEED = 12 // m/s
let shotIds = 0

// A convinced fan walking in Hinkie's line: no collider, so the line never
// blocks or traps him. Rigged fans play happy / walk / run clips.
function Follower({ id, name, model, color, height, body: custom }) {
  const root = useRef()
  const body = useRef()
  const step = useRef(0)
  const anim = useRef({ name: 'happy', speed: 1, shot: null })
  // Every rig shares Meshy's skeleton, so fans can borrow Hinkie's throw
  const { animations } = useGLTF(modelUrl('hinkie'))
  const borrowed = useMemo(() => animations.filter((c) => c.name === 'throw'), [animations])
  useFrame((_, dt) => {
    const f = followers[id]
    if (!f || !root.current) return

    // Join Hinkie's volley: wind up at a nearby anti-fan, release a beat later
    const now = performance.now() / 1000
    if (f.throwAt && now >= f.throwAt) {
      f.throwAt = null
      const target = targets.nearest(f.x, f.z, AIM_RANGE)
      if (target) {
        f.target = target
        f.aimYaw = Math.atan2(target.x - f.x, target.z - f.z)
        f.aimUntil = now + 0.7
        f.releaseAt = now + FAN_RELEASE
        anim.current.shot = { ...FAN_THROW, id: ++shotIds }
      }
    }
    if (f.releaseAt && now >= f.releaseAt) {
      f.releaseAt = null
      const dx = f.target.x - f.x
      const dz = f.target.z - f.z
      const d = Math.hypot(dx, dz) || 1
      sfx.throw()
      throwBall(f.x + (dx / d) * 0.5, 1.3, f.z + (dz / d) * 0.5, (dx / d) * FAN_THROW_SPEED, 2.5, (dz / d) * FAN_THROW_SPEED)
    }
    root.current.position.set(f.x, 0, f.z)
    root.current.rotation.y = f.yaw
    if (model) {
      const celebrating = performance.now() - f.joinedAt < CELEBRATE_MS && f.speed < 1.5
      const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
      const a = anim.current
      if (celebrating || f.gait === 'idle') { a.name = 'happy'; a.speed = 1 } // cheer while waiting
      else if (f.gait === 'walk') { a.name = 'walk'; a.speed = clamp(f.speed / 2.2, 0.6, 1.6) }
      else { a.name = 'run'; a.speed = clamp(f.speed / 5.5, 0.8, 1.4) }
    } else {
      step.current += dt * f.speed * 2.5
      body.current.position.y = f.gait !== 'idle' ? Math.abs(Math.sin(step.current)) * 0.08 : 0 // bob while walking
    }
  })
  return (
    <group ref={root}>
      <group ref={body}>
        {custom ?? (model
          ? <Model name={model} height={height} anim={anim} extraClips={borrowed} fallback={<PersonModel color={color} height={height} />} />
          : <PersonModel color={color} height={height} />)}
      </group>
      <Tag position={[0, height + 0.35, 0]} fontSize={0.22} color={COLORS.gold} outlineWidth={0.02} outlineColor="black" anchorY="middle">
        {model || custom ? name : 'BELIEVER'}
      </Tag>
    </group>
  )
}

// A rigged fan still waiting to be convinced. Mills around near their spot
// (short strolls, pauses, looking about) until Hinkie comes close, then turns
// to face him and plays their `watch` clip (Sean waves him over). Only the
// model moves; their collider and talk spot stay put.
const MILL_RADIUS = 0.8 // m from their spot
const MILL_SPEED = 0.6 // m/s
const NOTICE = 7 // m: close enough that they stop and face Hinkie

function Watching({ model, watch, height, color }) {
  const turn = useRef()
  const anim = useRef({ name: 'walk', speed: 0 }) // first walk frame, held, is a neutral stance
  const mill = useRef({ x: 0, z: 0, tx: 0, tz: 0, wait: Math.random() * 3, yaw: Math.random() * 6.28 })
  useFrame((_, rawDt) => {
    const g = turn.current
    if (!g) return
    const dt = Math.min(rawDt, 0.05)
    const m = mill.current
    const spot = g.parent.getWorldPosition(g.userData.v ??= g.position.clone())
    const toHinkie = Math.hypot(player.x - spot.x, player.z - spot.z)
    let face = m.yaw

    if (toHinkie < NOTICE) {
      // Hinkie's coming: stop and face him
      anim.current = watch ? { name: watch, speed: 1 } : { name: 'walk', speed: 0 }
      face = Math.atan2(player.x - (spot.x + m.x), player.z - (spot.z + m.z))
    } else if (m.wait > 0) {
      // Standing around, glancing about
      m.wait -= dt
      anim.current = { name: 'walk', speed: 0 }
      if (m.wait <= 0) {
        const a = Math.random() * Math.PI * 2
        const r = Math.random() * MILL_RADIUS
        m.tx = Math.cos(a) * r
        m.tz = Math.sin(a) * r
      }
    } else {
      // Stroll to the next spot
      const dx = m.tx - m.x
      const dz = m.tz - m.z
      const d = Math.hypot(dx, dz)
      if (d < 0.05) {
        m.wait = 1.5 + Math.random() * 3
        m.yaw += (Math.random() - 0.5) * 2.5
      } else {
        const step = Math.min(d, MILL_SPEED * dt)
        m.x += (dx / d) * step
        m.z += (dz / d) * step
        m.yaw = Math.atan2(dx, dz)
        anim.current = { name: 'walk', speed: 0.55 }
      }
      face = m.yaw
    }

    g.position.set(m.x, 0, m.z)
    const diff = Math.atan2(Math.sin(face - g.rotation.y), Math.cos(face - g.rotation.y))
    g.rotation.y += diff * Math.min(1, 6 * dt)
  })
  return (
    <group ref={turn}>
      <Model name={model} height={height} anim={anim} fallback={<PersonModel color={color} height={height} />} />
    </group>
  )
}

// A person NPC: solid body plus a floating nametag. A convinced fan becomes a
// gold BELIEVER and falls in line behind Hinkie.
export function Person({ id, name, model, watch, position, color = COLORS.sixersBlue, height = 1.8, fan = false }) {
  const radius = 0.3
  const convinced = useGame((s) => s.flags[id] === true)
  const turnedDown = useGame((s) => s.asked[id] === true && s.flags[id] !== true)
  if (fan && convinced) return null // drawn by <Apostles /> now, in every level
  return (
    <RigidBody type="fixed" position={position} colliders={false}>
      <CapsuleCollider args={[height / 2 - radius, radius]} position={[0, height / 2, 0]} />
      {model ? <Watching model={model} watch={watch} height={height} color={color} /> : <PersonModel color={color} height={height} />}
      <Billboard position={[0, height + 0.35, 0]}>
        <Text fontSize={0.22} color={convinced ? COLORS.gold : turnedDown ? '#8a8f99' : 'white'} outlineWidth={0.02} outlineColor="black" anchorY="middle">
          {convinced ? 'BELIEVER' : name}
        </Text>
      </Billboard>
    </RigidBody>
  )
}

export function Box({ position, size, color, rotation }) {
  return (
    <RigidBody type="fixed" position={position} rotation={rotation} colliders={false}>
      <CuboidCollider args={size.map((s) => s / 2)} />
      <mesh>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} />
      </mesh>
    </RigidBody>
  )
}

export function TrashCan({ position }) {
  const placeholder = (
    <mesh position={[0, 0.45, 0]}>
      <cylinderGeometry args={[0.26, 0.22, 0.9, 16]} />
      <meshStandardMaterial color="#3A3F47" />
    </mesh>
  )
  return (
    <RigidBody type="fixed" position={position} colliders={false}>
      <CylinderCollider args={[0.475, 0.25]} position={[0, 0.475, 0]} />
      <Model name="trash-can" height={0.95} fallback={placeholder} />
    </RigidBody>
  )
}

// Cart model is ~1.4m square and 2m tall
export function HotDogCart({ position, rotation }) {
  const placeholder = (
    <>
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[1.3, 1.1, 1.3]} />
        <meshStandardMaterial color={COLORS.sixersRed} />
      </mesh>
      <mesh position={[0, 1.9, 0]}>
        <boxGeometry args={[1.5, 0.08, 1.5]} />
        <meshStandardMaterial color={COLORS.gold} />
      </mesh>
    </>
  )
  return (
    <group position={position} rotation={rotation}>
      <RigidBody type="fixed" colliders={false}>
        {/* Full height, umbrella included, so the camera can't swing through it */}
        <CuboidCollider args={[0.65, 1, 0.65]} position={[0, 1, 0]} />
      </RigidBody>
      <Model name="hot-dog-cart" height={2} fallback={placeholder} />
    </group>
  )
}

export function Banner({ position, rotation, text, color = COLORS.sixersBlue, textColor = 'white' }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <planeGeometry args={[2.2, 1.4]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <Text position={[0, 0, 0.01]} fontSize={0.18} maxWidth={1.9} textAlign="center" color={textColor}>
        {text}
      </Text>
    </group>
  )
}

// Everyone following Hinkie, in whatever level he's in
const RTRS_FOLLOWER = { id: 'rtrs', name: 'RTRS', height: 2.4 }
export function Apostles() {
  const flags = useGame((s) => s.flags)
  const fans = PEOPLE.filter((p) => p.fan && flags[p.id])
  return (
    <>
      {fans.map((p) => <Follower key={p.id} id={p.id} name={p.name} model={p.model} color={p.color ?? COLORS.sixersBlue} height={p.height ?? 1.8} />)}
      {flags.rtrs && (
        <Follower {...RTRS_FOLLOWER} body={<TwoHeaded color="#1f8a8a" names={['SPIKE', 'LEVIN']} height={2.4} />} />
      )}
    </>
  )
}
