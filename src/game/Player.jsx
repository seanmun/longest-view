import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RigidBody, CapsuleCollider, useRapier } from '@react-three/rapier'
import { input, consumeLook, keyboardAxes, listenKeyboard } from './input.js'
import { HinkieModel } from './Placeholders.jsx'
import { PEOPLE, TALK_RANGE } from './level1.js'
import { polar } from './ring.js'
import { getState, setState, player } from './state.js'
import { throwBall } from './Balls.jsx'
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

const THROW_SPEED = 13 // m/s forward
const THROW_LIFT = 2.5 // m/s upward

const CAPSULE_HALF = 0.6
const CAPSULE_RADIUS = 0.3
const FEET = -(CAPSULE_HALF + CAPSULE_RADIUS)

const PEOPLE_XZ = PEOPLE.map((p) => { const [x, , z] = polar(p.r, p.angle); return { id: p.id, x, z } })

export default function Player({ position = [0, 1, 6], yaw: startYaw = 0 }) {
  const body = useRef()
  const model = useRef()
  const yaw = useRef(startYaw) // camera yaw
  const elevation = useRef(0.35)
  const facing = useRef(startYaw + Math.PI) // Hinkie's model rotation; models face +Z
  const camera = useThree((s) => s.camera)
  const { world, rapier } = useRapier()

  useEffect(() => listenKeyboard(), [])

  useFrame((_, dt) => {
    const b = body.current
    if (!b) return

    const look = consumeLook()
    const keys = keyboardAxes()
    yaw.current -= look.x + keys.turn * TURN_SPEED * dt
    elevation.current = Math.max(CAM_MIN_ELEVATION, Math.min(CAM_MAX_ELEVATION, elevation.current + look.y))

    // Hold still while talking or once the level is over
    const talking = getState().talk != null
    const frozen = talking || getState().complete || getState().intro
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
    const partner = talking && PEOPLE_XZ.find((person) => person.id === getState().talk.id)
    if (partner || len > 0.1) {
      const target = partner ? Math.atan2(partner.x - p.x, partner.z - p.z) : Math.atan2(vx, vz)
      let diff = target - facing.current
      diff = Math.atan2(Math.sin(diff), Math.cos(diff))
      facing.current += diff * Math.min(1, FACE_SPEED * dt)
    }

    // Throw where the camera faces; Hinkie turns to throw
    if (input.throws > 0) {
      input.throws = 0
      if (!frozen) {
        const fx = -sin
        const fz = -cos
        facing.current = Math.atan2(fx, fz)
        sfx.throw()
        throwBall(p.x + fx * 0.5, p.y + 0.4, p.z + fz * 0.5, fx * THROW_SPEED, THROW_LIFT, fz * THROW_SPEED)
      }
    }
    model.current.rotation.y = facing.current

    player.x = p.x
    player.z = p.z

    // Who's close enough to talk to?
    let nearby = null
    let best = TALK_RANGE
    for (const person of PEOPLE_XZ) {
      const d = Math.hypot(person.x - p.x, person.z - p.z)
      if (d < best) { best = d; nearby = person.id }
    }
    if (nearby !== getState().nearby) setState({ nearby })

    // Camera sits behind Hinkie; pull it in if a wall is in the way
    const target = { x: p.x, y: p.y + CAM_TARGET_HEIGHT, z: p.z }
    const ce = Math.cos(elevation.current)
    const dir = { x: sin * ce, y: Math.sin(elevation.current), z: cos * ce }
    const hit = world.castRay(new rapier.Ray(target, dir), CAM_DISTANCE, true, undefined, undefined, undefined, b)
    const dist = hit ? Math.max(0.5, hit.timeOfImpact - CAM_WALL_PADDING) : CAM_DISTANCE
    camera.position.set(target.x + dir.x * dist, target.y + dir.y * dist, target.z + dir.z * dist)
    camera.lookAt(target.x, target.y, target.z)
  })

  return (
    <RigidBody ref={body} position={position} colliders={false} enabledRotations={[false, false, false]} canSleep={false}>
      <CapsuleCollider args={[CAPSULE_HALF, CAPSULE_RADIUS]} friction={0} />
      <group ref={model} position={[0, FEET, 0]}>
        <HinkieModel />
      </group>
    </RigidBody>
  )
}
