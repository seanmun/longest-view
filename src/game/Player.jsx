import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RigidBody, CapsuleCollider, useRapier } from '@react-three/rapier'
import { input, consumeLook, keyboardAxes, listenKeyboard } from './input.js'
import { HinkieModel } from './Placeholders.jsx'

const WALK_SPEED = 4 // m/s
const TURN_SPEED = 2.2 // rad/s, arrow keys
const FACE_SPEED = 12 // how fast Hinkie turns toward his walking direction

// Third-person camera orbiting behind Hinkie
const CAM_DISTANCE = 4.5 // m
const CAM_TARGET_HEIGHT = 0.6 // look-at point above capsule center (~head)
const CAM_MIN_ELEVATION = 0.05 // rad, nearly level
const CAM_MAX_ELEVATION = 1.1 // rad, looking down from above
const CAM_WALL_PADDING = 0.3 // m, stay this far in front of walls

const CAPSULE_HALF = 0.6
const CAPSULE_RADIUS = 0.3
const FEET = -(CAPSULE_HALF + CAPSULE_RADIUS)

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

    let mx = keys.x + input.moveX
    let my = keys.y + input.moveY
    const len = Math.hypot(mx, my)
    if (len > 1) { mx /= len; my /= len }

    // Move relative to the camera: right = (cos, 0, -sin), forward = (-sin, 0, -cos)
    const sin = Math.sin(yaw.current)
    const cos = Math.cos(yaw.current)
    const vx = (mx * cos - my * sin) * WALK_SPEED
    const vz = (-mx * sin - my * cos) * WALK_SPEED
    b.setLinvel({ x: vx, y: b.linvel().y, z: vz }, true)

    // Turn Hinkie toward where he's walking, the short way around
    if (len > 0.1) {
      const target = Math.atan2(vx, vz)
      let diff = target - facing.current
      diff = Math.atan2(Math.sin(diff), Math.cos(diff))
      facing.current += diff * Math.min(1, FACE_SPEED * dt)
    }
    model.current.rotation.y = facing.current

    // Camera sits behind Hinkie; pull it in if a wall is in the way
    const p = b.translation()
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
