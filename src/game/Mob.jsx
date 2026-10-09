// The "JUST WIN GAMES BRO" mob around the glass exit doors, led by Badman, a
// giggling weasel. Rigged members stomp mad. A ping pong ball knocks one back (hit clip + dizzy stars); then
// they run off through the tunnel. The door stays walled off until every
// member is gone.
import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import { RigidBody, CylinderCollider } from '@react-three/rapier'
import { PersonModel, COLORS } from './Placeholders.jsx'
import Model from './Model.jsx'
import { R_OUT, polar } from './ring.js'
import { MOB, MOB_BARRIER_RADIUS, DOOR, PEOPLE } from './level1.js'
import { targets } from './targets.js'
import { getState, setState, useGame, player, toast } from './state.js'
import { sfx, setMusicMood } from './audio.js'

const HIT_RADIUS = 0.5 // m, ball center to member center
const GIGGLE_EVERY = 3.5 // s, Badman giggles while Hinkie is near
const GIGGLE_RANGE = 10 // m
const MOOD_TIME = 5 // s per clip for members with `moods` (e.g. Tea Mike: stomp, then dance)
const RUN_SPEED = 5 // m/s
const SHOUT_TIME = 1.4 // s each; one member shouts at a time so it stays readable
const NOTICE_RANGE = 12 // m from the door when the mob hint first shows
const BATTLE_RANGE = 16 // m from the door when the battle music kicks in
// Beaten members flee out the glass exit doors
const [TUNNEL_X, , TUNNEL_Z] = polar(R_OUT - 0.4, DOOR.angle)
const DOOR_FRONT = polar(R_OUT - 0.8, DOOR.angle)
const isTouch = window.matchMedia('(pointer: coarse)').matches


const members = MOB.map((m, i) => {
  const [x, , z] = polar(m.r, m.angle)
  return {
    ...m, x, z, state: m.defector ? 'absent' : 'angry', t: 0, giggleAt: 0,
    slotX: x, slotZ: z,
    height: m.height ?? 1.8,
    hitTime: m.hitTime ?? 1.5,
    stomp: m.stomp ?? 'stomp',
    color: i % 2 ? COLORS.sixersRed : COLORS.sixersBlue,
    pace: 0.85 + (i * 0.37) % 0.3, // slightly different speeds so they don't move in lockstep
  }
})

// Closest mob member still standing their ground, for apostles to aim at
export function nearestMob(x, z, range) {
  let best = null
  let bestD = range
  for (const m of members) {
    if (m.state !== 'angry') continue
    const d = Math.hypot(m.x - x, m.z - z)
    if (d < bestD) { bestD = d; best = m }
  }
  return best
}

// Called by each ball every frame; true means the ball hit someone and pops.
export function hitMob(x, y, z) {
  if (y > 1.9) return false
  for (const m of members) {
    if ((m.state === 'angry' || m.state === 'dizzy') && Math.hypot(x - m.x, z - m.z) < HIT_RADIUS) {
      if (m.state === 'angry') {
        m.state = 'dizzy'
        m.t = 0
        if (m.leader) sfx.giggle()
        else sfx.dizzy()
      }
      return true
    }
  }
  return false
}

targets.hit = hitMob
targets.nearest = nearestMob

function Member({ m }) {
  const root = useRef()
  const body = useRef()
  const shouts = useRef([])
  const stars = useRef()
  const anim = useRef({ name: m.stomp, speed: m.pace })

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const g = root.current
    if (!g) return
    m.t += dt
    const time = clock.elapsedTime

    // The defector: hidden until he turns, then sprints from his old spot to the door
    if (m.state === 'absent') {
      if (getState().defected[m.id]) {
        const fan = PEOPLE.find((p) => p.id === m.id)
        ;[m.x, , m.z] = polar(fan.r, fan.angle)
        m.state = 'joining'
        setState((s) => ({ mobLeft: s.mobLeft + 1 }))
      } else {
        g.visible = false
        return
      }
    }
    if (m.state === 'joining') {
      const dx = m.slotX - m.x
      const dz = m.slotZ - m.z
      const d = Math.hypot(dx, dz)
      if (d < 0.3) m.state = 'angry'
      else {
        const step = Math.min(d, 6.5 * dt)
        m.x += (dx / d) * step
        m.z += (dz / d) * step
        body.current.rotation.y = Math.atan2(dx, dz)
        anim.current = { name: 'run', speed: 1.3 }
      }
    }

    if (m.state === 'dizzy' && m.t > m.hitTime) {
      m.state = 'fleeing'
      m.t = 0
      if (m.leader) sfx.giggle() // scurries off giggling
    }
    if (m.leader && m.state === 'angry' && time > m.giggleAt && Math.hypot(player.x - m.x, player.z - m.z) < GIGGLE_RANGE) {
      sfx.giggle()
      m.giggleAt = time + GIGGLE_EVERY
    }
    if (m.state === 'fleeing') {
      const dx = TUNNEL_X - m.x
      const dz = TUNNEL_Z - m.z
      const d = Math.hypot(dx, dz)
      if (d < 0.4) {
        m.state = 'gone'
        setState((s) => ({ mobLeft: s.mobLeft - 1, mobBeaten: s.mobBeaten + 1 }))
      } else {
        const speed = m.fleeSpeed ?? RUN_SPEED
        m.x += (dx / d) * speed * dt
        m.z += (dz / d) * speed * dt
        body.current.rotation.y = Math.atan2(dx, dz)
      }
    }

    g.visible = m.state !== 'gone'
    g.position.set(m.x, 0, m.z)
    const angry = members.filter((o) => o.state === 'angry')
    const turn = Math.floor(time / SHOUT_TIME)
    const myTurn = m.state === 'angry' && angry[turn % angry.length] === m
    shouts.current.forEach((b, i) => { if (b) b.visible = myTurn && i === turn % m.shouts.length })
    stars.current.visible = m.state === 'dizzy'

    if (m.state === 'angry') {
      const mood = m.moods ? m.moods[Math.floor((time + m.pace * 3) / MOOD_TIME) % m.moods.length] : m.stomp
      anim.current = { name: mood, speed: m.pace }
      body.current.rotation.y = Math.atan2(player.x - m.x, player.z - m.z) // glare at Hinkie
      if (!m.model) body.current.position.y = Math.abs(Math.sin(time * 6 + m.x)) * 0.15 // placeholder hops mad
    } else if (m.state === 'dizzy') {
      anim.current = { name: m.hitClip ?? 'hit', speed: 1 }
      body.current.position.y = 0
      stars.current.rotation.y = m.t * 5
    } else if (m.state === 'fleeing') {
      anim.current = { name: m.flee ?? 'run', speed: m.flee ? 1 : 1.2 }
    }
  })

  return (
    <group ref={root}>
      <group ref={body}>
        {m.model
          ? <Model name={m.model} height={m.height} anim={anim} fallback={<PersonModel color={m.color} />} />
          : <PersonModel color={m.color} height={m.height} />}
      </group>
      <group ref={stars} position={[0, m.height + 0.25, 0]}>
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
      <Billboard position={[0, m.height + 0.2, 0]}>
        <Text fontSize={0.2} color={m.leader ? COLORS.gold : 'white'} outlineWidth={0.02} outlineColor="black">
          {m.leader ? `${m.name} (LEADER)` : m.name}
        </Text>
      </Billboard>
      {m.shouts.map((line, i) => (
        <Billboard key={line} ref={(b) => { shouts.current[i] = b }} position={[0, m.height + 0.55, 0]} visible={false}>
          <Text fontSize={0.32} color="white" outlineWidth={0.03} outlineColor={COLORS.sixersRed} maxWidth={3} textAlign="center">
            {line}
          </Text>
        </Billboard>
      ))}
    </group>
  )
}

export default function Mob() {
  const halfway = useRef(false)
  const mobLeft = useGame((s) => s.mobLeft)

  useEffect(() => { setState({ mobLeft: members.filter((m) => m.state !== 'gone' && m.state !== 'absent').length }) }, [])

  useFrame(() => {
    const s = getState()
    // The doors are right by the start line, so only react once Hinkie is past
    // the halfway point and coming around toward them
    const lap = Math.atan2(player.x, player.z)
    if (lap > 2.5 || lap < -2.5) halfway.current = true
    const toDoor = Math.hypot(player.x - DOOR_FRONT[0], player.z - DOOR_FRONT[2])
    setMusicMood(halfway.current && s.mobLeft > 0 && toDoor < BATTLE_RANGE && !s.complete ? 'battle' : 'calm')
    if (s.mobSeen || s.mobLeft === 0) return
    if (halfway.current && toDoor < NOTICE_RANGE) {
      setState({ mobSeen: true })
      toast(`Anti-fans are blocking the exit! ${isTouch ? 'Tap THROW' : 'Click'} to toss ping pong balls.`)
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
