import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RigidBody, CapsuleCollider, useRapier } from '@react-three/rapier'
import { input, consumeLook, keyboardAxes, listenKeyboard } from './input.js'
import { HinkieModel } from './Placeholders.jsx'
import Model from './Model.jsx'
import { PEOPLE, TALK_RANGE } from './level1.js'
import { polar } from './ring.js'
import { getState, setState, player } from './state.js'
import { throwBall } from './Balls.jsx'
import { followers, isFollowing, updateFollowers } from './follow.js'
import { sfx } from './audio.js'

const WALK_SPEED = 4 // m/s
const TURN_SPEED = 2.2 // rad/s, arrow keys
const FACE_SPEED = 12 // how fast Hinkie turns toward his walking direction

// Third-person camera orbiting behind Hinkie
const CAM_DISTANCE = 4.5 // m
const CAM_TARGET_HEIGHT = 0.6 // look-at point above capsule center (~head)
const CAM_MIN_ELEVATION = 0.05 // rad, nearly level
const CAM_MAX_ELEVATION = 1.1 // rad, looking down from above
const CAM_WALL_PADDING = 0.3 // m, stay this far in front of walls

// Opening shot: start on Hinkie's face, then pull back and swing around behind him
const OPENING_HOLD = 0.7 // s on his face
const OPENING_MOVE = 2.6 // s to swing behind
const OPENING_DISTANCE = 1.1 // m in front of his face
const OPENING_ELEVATION = 0.06 // rad, eye level

const RUN_FROM = 0.65 // stick push (0..1) where walking turns into running; keyboard is always 1
const THROW_CLIP = { name: 'throw', start: 0.3, speed: 2.5 } // skip the wind-up, play fast
const RELEASE_DELAY = 0.18 // s from tap to the ball leaving his hand in that clip
const THROW_SPEED = 13 // m/s forward
const THROW_LIFT = 2.5 // m/s upward

const CAPSULE_HALF = 0.6
const CAPSULE_RADIUS = 0.3
const FEET = -(CAPSULE_HALF + CAPSULE_RADIUS)

// Cluster members (`with`) are talked to through their fan, so they're not talk targets
const PEOPLE_XZ = PEOPLE.filter((p) => !p.with).map((p) => { const [x, , z] = polar(p.r, p.angle); return { id: p.id, x, z } })

export default function Player({ position = [0, 1, 6], yaw: startYaw = 0 }) {
  const body = useRef()
  const model = useRef()
  const anim = useRef({ name: 'idle', speed: 1, shot: null }) // which clips Hinkie's model plays
  const pendingThrow = useRef(null) // { at, dir } waiting for the release moment
  const shots = useRef(0)
  const yaw = useRef(startYaw) // camera yaw
  const elevation = useRef(0.35)
  const opening = useRef(getState().intro ? 0 : null) // seconds into the opening shot; null once done
  const facing = useRef(startYaw + Math.PI) // Hinkie's model rotation; models face +Z
  const camera = useThree((s) => s.camera)
  const { world, rapier } = useRapier()

  useEffect(() => listenKeyboard(), [])

  useFrame((_, dt) => {
    const b = body.current
    if (!b) return

    const look = consumeLook()
    const keys = keyboardAxes()

    // Opening shot runs after the intro text; pushing to move cuts it short
    const stick = Math.hypot(keys.x + input.moveX, keys.y + input.moveY)
    if (opening.current !== null && !getState().intro) {
      opening.current += Math.min(dt, 0.05) // the first frame after the intro can hitch for seconds
      if (opening.current > OPENING_HOLD + OPENING_MOVE || (opening.current > 0.3 && stick > 0.3)) opening.current = null
    }
    const inOpening = opening.current !== null
    if (inOpening) { look.x = 0; look.y = 0; keys.turn = 0 } // camera is on rails
    yaw.current -= look.x + keys.turn * TURN_SPEED * dt
    elevation.current = Math.max(CAM_MIN_ELEVATION, Math.min(CAM_MAX_ELEVATION, elevation.current + look.y))

    // Hold still while talking or once the level is over
    const talking = getState().talk != null
    const frozen = talking || getState().complete || getState().intro || inOpening
    let mx = frozen ? 0 : keys.x + input.moveX
    let my = frozen ? 0 : keys.y + input.moveY
    const len = Math.hypot(mx, my)
    if (len > 1) { mx /= len; my /= len }

    // Move relative to the camera: right = (cos, 0, -sin), forward = (-sin, 0, -cos)
    const sin = Math.sin(yaw.current)
    const cos = Math.cos(yaw.current)
    const vx = (mx * cos - my * sin) * WALK_SPEED
    const vz = (-mx * sin - my * cos) * WALK_SPEED
    b.setLinvel({ x: vx, y: b.linvel().y, z: vz }, true)

    // Turn Hinkie toward where he's walking (or who he's talking to), the short way around
    const p = b.translation()
    const talkId = talking && getState().talk.id
    const partner = talking && (followers[talkId] ?? PEOPLE_XZ.find((person) => person.id === talkId))
    if (partner || len > 0.1) {
      const target = partner ? Math.atan2(partner.x - p.x, partner.z - p.z) : Math.atan2(vx, vz)
      let diff = target - facing.current
      diff = Math.atan2(Math.sin(diff), Math.cos(diff))
      facing.current += diff * Math.min(1, FACE_SPEED * dt)
    }

    // Throw where the camera faces: Hinkie turns, winds up, and the ball
    // leaves his hand a beat later
    if (input.throws > 0) {
      input.throws = 0
      if (!frozen && !pendingThrow.current) {
        const fx = -sin
        const fz = -cos
        facing.current = Math.atan2(fx, fz)
        pendingThrow.current = { at: RELEASE_DELAY, fx, fz }
        anim.current.shot = { ...THROW_CLIP, id: ++shots.current }
      }
    }
    if (pendingThrow.current) {
      const t = pendingThrow.current
      t.at -= dt
      facing.current = Math.atan2(t.fx, t.fz)
      if (t.at <= 0) {
        pendingThrow.current = null
        sfx.throw()
        throwBall(p.x + t.fx * 0.5, p.y + 0.4, p.z + t.fz * 0.5, t.fx * THROW_SPEED, THROW_LIFT, t.fz * THROW_SPEED)
      }
    }
    model.current.rotation.y = facing.current

    // Idle, walk on a gentle push, run on a full one; clip speed follows the stick
    const push = Math.min(1, len)
    const a = anim.current
    if (push < 0.08) { a.name = 'idle'; a.speed = 1 }
    else if (push < RUN_FROM) { a.name = 'walk'; a.speed = 0.7 + push }
    else { a.name = 'run'; a.speed = push }

    player.x = p.x
    player.z = p.z
    if (!getState().complete) updateFollowers(dt, performance.now() / 1000)

    // Who's close enough to talk to?
    let nearby = null
    let best = TALK_RANGE
    for (const person of PEOPLE_XZ) {
      if (isFollowing(person.id)) continue // followers walk with him; not someone to walk up to
      const d = Math.hypot(person.x - p.x, person.z - p.z)
      if (d < best) { best = d; nearby = person.id }
    }
    if (nearby !== getState().nearby) setState({ nearby })

    // Camera sits behind Hinkie; pull it in if a wall is in the way.
    // During the opening shot it starts in front of his face (half a turn
    // around) and eases back to its usual spot.
    let swing = 0
    let reach = CAM_DISTANCE
    let elev = elevation.current
    if (inOpening) {
      const t = Math.min(1, Math.max(0, (opening.current - OPENING_HOLD) / OPENING_MOVE))
      const e = t * t * (3 - 2 * t) // ease in and out
      swing = Math.PI * (1 - e)
      reach = OPENING_DISTANCE + (CAM_DISTANCE - OPENING_DISTANCE) * e
      elev = OPENING_ELEVATION + (elevation.current - OPENING_ELEVATION) * e
    }
    const target = { x: p.x, y: p.y + CAM_TARGET_HEIGHT, z: p.z }
    const ce = Math.cos(elev)
    const dir = { x: Math.sin(yaw.current + swing) * ce, y: Math.sin(elev), z: Math.cos(yaw.current + swing) * ce }
    const hit = world.castRay(new rapier.Ray(target, dir), reach, true, undefined, undefined, undefined, b)
    const dist = hit ? Math.max(0.5, hit.timeOfImpact - CAM_WALL_PADDING) : reach
    camera.position.set(target.x + dir.x * dist, target.y + dir.y * dist, target.z + dir.z * dist)
    camera.lookAt(target.x, target.y, target.z)
  })

  return (
    <RigidBody ref={body} position={position} colliders={false} enabledRotations={[false, false, false]} canSleep={false}>
      <CapsuleCollider args={[CAPSULE_HALF, CAPSULE_RADIUS]} friction={0} />
      <group ref={model} position={[0, FEET, 0]}>
        <Model name="hinkie" height={1.85} fallback={<HinkieModel />} anim={anim} />
      </group>
    </RigidBody>
  )
}
