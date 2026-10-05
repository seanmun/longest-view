// The "JUST WIN GAMES BRO" mob around the locker-room door. A ping pong ball
// makes a member dizzy; then they run off through the tunnel. The door stays
// walled off until every member is gone.
import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import { RigidBody, CylinderCollider } from '@react-three/rapier'
import { PersonModel, COLORS } from './Placeholders.jsx'
import { R_OUT, polar } from './ring.js'
import { MOB, MOB_BARRIER_RADIUS, MOB_SHOUTS, DOOR } from './level1.js'
import { getState, setState, useGame, player, toast } from './state.js'
import { sfx } from './audio.js'

const HIT_RADIUS = 0.5 // m, ball center to member center
const DIZZY_TIME = 1.5 // s
const RUN_SPEED = 5 // m/s
const SHOUT_TIME = 1.4 // s each; one member shouts at a time so it stays readable
const NOTICE_RANGE = 12 // m from the door when the mob hint first shows
const [TUNNEL_X, , TUNNEL_Z] = polar(R_OUT - 0.4, 0.03)
const DOOR_FRONT = polar(R_OUT - 0.8, DOOR.angle)
const isTouch = window.matchMedia('(pointer: coarse)').matches

const members = MOB.map((m, i) => {
  const [x, , z] = polar(m.r, m.angle)
  return { id: m.id, x, z, state: 'angry', t: 0, color: i % 2 ? COLORS.sixersRed : COLORS.sixersBlue, shout: MOB_SHOUTS[i % MOB_SHOUTS.length] }
})

// Called by each ball every frame; true means the ball hit someone and pops.
export function hitMob(x, y, z) {
  if (y > 1.9) return false
  for (const m of members) {
    if ((m.state === 'angry' || m.state === 'dizzy') && Math.hypot(x - m.x, z - m.z) < HIT_RADIUS) {
      if (m.state === 'angry') { m.state = 'dizzy'; m.t = 0; sfx.dizzy() }
      return true
    }
  }
  return false
}

function Member({ m }) {
  const root = useRef()
  const body = useRef()
  const shout = useRef()
  const stars = useRef()

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const g = root.current
    if (!g) return
    m.t += dt
    const time = clock.elapsedTime

    if (m.state === 'dizzy' && m.t > DIZZY_TIME) { m.state = 'fleeing'; m.t = 0 }
    if (m.state === 'fleeing') {
      const dx = TUNNEL_X - m.x
      const dz = TUNNEL_Z - m.z
      const d = Math.hypot(dx, dz)
      if (d < 0.4) {
        m.state = 'gone'
        setState((s) => ({ mobLeft: s.mobLeft - 1 }))
      } else {
        m.x += (dx / d) * RUN_SPEED * dt
        m.z += (dz / d) * RUN_SPEED * dt
        body.current.rotation.y = Math.atan2(dx, dz)
      }
    }

    g.visible = m.state !== 'gone'
    g.position.set(m.x, 0, m.z)
    const angry = members.filter((o) => o.state === 'angry')
    shout.current.visible = m.state === 'angry' && angry[Math.floor(time / SHOUT_TIME) % angry.length] === m
    stars.current.visible = m.state === 'dizzy'

    if (m.state === 'angry') {
      body.current.position.y = Math.abs(Math.sin(time * 6 + m.x)) * 0.15 // hopping mad
      body.current.rotation.set(0, Math.atan2(player.x - m.x, player.z - m.z), 0)
    } else if (m.state === 'dizzy') {
      body.current.position.y = 0
      body.current.rotation.z = Math.sin(m.t * 10) * 0.15
      stars.current.rotation.y = m.t * 5
    } else if (m.state === 'fleeing') {
      body.current.position.y = Math.abs(Math.sin(m.t * 14)) * 0.1
      body.current.rotation.z = 0
    }
  })

  return (
    <group ref={root}>
      <group ref={body}>
        <PersonModel color={m.color} />
      </group>
      <group ref={stars} position={[0, 2.05, 0]}>
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
      <Billboard ref={shout} position={[0, 2.3, 0]}>
        <Text fontSize={0.32} color="white" outlineWidth={0.03} outlineColor={COLORS.sixersRed} maxWidth={3} textAlign="center">
          {m.shout}
        </Text>
      </Billboard>
    </group>
  )
}

export default function Mob() {
  const mobLeft = useGame((s) => s.mobLeft)

  useEffect(() => { setState({ mobLeft: members.filter((m) => m.state !== 'gone').length }) }, [])

  useFrame(() => {
    const s = getState()
    if (s.mobSeen || s.mobLeft === 0) return
    if (Math.hypot(player.x - DOOR_FRONT[0], player.z - DOOR_FRONT[2]) < NOTICE_RANGE) {
      setState({ mobSeen: true })
      toast(`A mob is blocking the locker room! ${isTouch ? 'Tap THROW' : 'Click'} to toss ping pong balls.`)
    }
  })

  return (
    <>
      {members.map((m) => <Member key={m.id} m={m} />)}
      {mobLeft > 0 && (
        <RigidBody type="fixed" colliders={false} position={DOOR_FRONT}>
          <CylinderCollider args={[2, MOB_BARRIER_RADIUS]} position={[0, 2, 0]} />
        </RigidBody>
      )}
    </>
  )
}
