// Ping pong balls and their confetti pops. Balls are simulated by hand (not
// Rapier): they arc, bounce on the floor, and pop on people, walls, or time.
import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, Object3D } from 'three'
import { polar } from './ring.js'
import { getState } from './state.js'
import { PEOPLE } from './level1.js'
import { targets } from './targets.js'
import { sfx } from './audio.js'
import { isFollowing } from './follow.js'

const GRAVITY = 9.8
const BOUNCE = 0.6 // fraction of vertical speed kept on a floor bounce
const LIFETIME = 2.5 // s before a ball pops on its own
const BALL_RADIUS = 0.06
const HIT_RADIUS = 0.45 // m, ball center to a person's center
const MAX_BALLS = 12

const CONFETTI_PER_POP = 40
const CONFETTI_MAX = 400
const CONFETTI_LIFE = 1.2 // s
const CONFETTI_COLORS = ['#E8B800', '#ED174C', '#006BB6', '#ffffff', '#00D4FF'].map((c) => new Color(c))

const PEOPLE_XZ = PEOPLE.map((p) => { const [x, , z] = polar(p.r, p.angle); return { id: p.id, x, z, h: p.height ?? 1.8 } })

const balls = [] // { x, y, z, vx, vy, vz, age }
const confetti = [] // { x, y, z, vx, vy, vz, age, spin, color }

export function throwBall(x, y, z, vx, vy, vz) {
  if (balls.length >= MAX_BALLS) balls.shift()
  balls.push({ x, y, z, vx, vy, vz, age: 0 })
}

function pop(x, y, z) {
  for (let i = 0; i < CONFETTI_PER_POP; i++) {
    if (confetti.length >= CONFETTI_MAX) confetti.shift()
    const a = Math.random() * Math.PI * 2
    const speed = 1.5 + Math.random() * 2.5
    confetti.push({
      x, y, z,
      vx: Math.cos(a) * speed, vy: 1.5 + Math.random() * 3, vz: Math.sin(a) * speed,
      age: 0, spin: Math.random() * 10,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    })
  }
}

function hitsPerson(b) {
  if (getState().level !== 1) return false // the fans stand on the concourse
  // Followers have left their spots; balls pass through the line
  return PEOPLE_XZ.some((p) => !isFollowing(p.id) && b.y < p.h + 0.1 && Math.hypot(b.x - p.x, b.z - p.z) < HIT_RADIUS)
}

export default function Balls() {
  const ballMesh = useRef()
  const confettiMesh = useRef()
  const dummy = useMemo(() => new Object3D(), [])

  // Give every confetti instance a color before the first frame so the shader
  // is built with per-instance colors.
  useLayoutEffect(() => {
    for (let i = 0; i < CONFETTI_MAX; i++) confettiMesh.current.setColorAt(i, CONFETTI_COLORS[0])
  }, [])

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)

    for (let i = balls.length - 1; i >= 0; i--) {
      const b = balls[i]
      b.age += dt
      b.vy -= GRAVITY * dt
      b.x += b.vx * dt
      b.y += b.vy * dt
      b.z += b.vz * dt
      if (b.y < BALL_RADIUS && b.vy < 0) {
        b.y = BALL_RADIUS
        if (b.vy < -1) sfx.bounce()
        b.vy = -b.vy * BOUNCE
      }
      const hitWall = targets.wall(b.x, b.y, b.z)
      if (hitWall || b.age > LIFETIME || targets.hit(b.x, b.y, b.z) || hitsPerson(b)) {
        pop(b.x, Math.max(b.y, 0.3), b.z)
        sfx.pop()
        balls.splice(i, 1)
      }
    }

    for (let i = confetti.length - 1; i >= 0; i--) {
      const c = confetti[i]
      c.age += dt
      if (c.age > CONFETTI_LIFE) { confetti.splice(i, 1); continue }
      c.vy -= GRAVITY * 0.5 * dt
      c.vx *= 0.98
      c.vz *= 0.98
      c.x += c.vx * dt
      c.y = Math.max(0.01, c.y + c.vy * dt)
      c.z += c.vz * dt
    }

    const bm = ballMesh.current
    for (let i = 0; i < MAX_BALLS; i++) {
      const b = balls[i]
      dummy.position.set(b ? b.x : 0, b ? b.y : -100, b ? b.z : 0)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.setScalar(1)
      dummy.updateMatrix()
      bm.setMatrixAt(i, dummy.matrix)
    }
    bm.instanceMatrix.needsUpdate = true

    const cm = confettiMesh.current
    for (let i = 0; i < CONFETTI_MAX; i++) {
      const c = confetti[i]
      if (c) {
        dummy.position.set(c.x, c.y, c.z)
        dummy.rotation.set(c.spin + c.age * 8, c.spin, c.age * 6)
        dummy.scale.setScalar(1 - c.age / CONFETTI_LIFE * 0.5)
        cm.setColorAt(i, c.color)
      } else {
        dummy.position.set(0, -100, 0)
        dummy.scale.setScalar(0)
      }
      dummy.updateMatrix()
      cm.setMatrixAt(i, dummy.matrix)
    }
    cm.instanceMatrix.needsUpdate = true
    if (cm.instanceColor) cm.instanceColor.needsUpdate = true
  })

  return (
    <>
      <instancedMesh ref={ballMesh} args={[undefined, undefined, MAX_BALLS]} frustumCulled={false}>
        <sphereGeometry args={[BALL_RADIUS, 12, 8]} />
        <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.3} />
      </instancedMesh>
      <instancedMesh ref={confettiMesh} args={[undefined, undefined, CONFETTI_MAX]} frustumCulled={false}>
        <planeGeometry args={[0.14, 0.09]} />
        <meshBasicMaterial side={2} />
      </instancedMesh>
    </>
  )
}
