import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RigidBody, CapsuleCollider } from '@react-three/rapier'
import { input, consumeLook, keyboardAxes, listenKeyboard } from './input.js'

const WALK_SPEED = 4 // m/s
const TURN_SPEED = 2.2 // rad/s, arrow keys
const EYE_OFFSET = 0.75 // camera height above capsule center (eye at ~1.6m)
const MAX_PITCH = 1.4

export default function Player({ position = [0, 1, 6], yaw: startYaw = 0 }) {
  const body = useRef()
  const yaw = useRef(startYaw)
  const pitch = useRef(0)
  const camera = useThree((s) => s.camera)

  useEffect(() => listenKeyboard(), [])

  useFrame((_, dt) => {
    const b = body.current
    if (!b) return

    const look = consumeLook()
    const keys = keyboardAxes()
    yaw.current -= look.x + keys.turn * TURN_SPEED * dt
    pitch.current = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, pitch.current - look.y))

    let mx = keys.x + input.moveX
    let my = keys.y + input.moveY
    const len = Math.hypot(mx, my)
    if (len > 1) { mx /= len; my /= len }

    // right = (cos, 0, -sin), forward = (-sin, 0, -cos)
    const sin = Math.sin(yaw.current)
    const cos = Math.cos(yaw.current)
    const v = b.linvel()
    b.setLinvel({
      x: (mx * cos - my * sin) * WALK_SPEED,
      y: v.y,
      z: (-mx * sin - my * cos) * WALK_SPEED,
    }, true)

    const p = b.translation()
    camera.position.set(p.x, p.y + EYE_OFFSET, p.z)
    camera.rotation.set(pitch.current, yaw.current, 0, 'YXZ')
  })

  return (
    <RigidBody ref={body} position={position} colliders={false} enabledRotations={[false, false, false]} canSleep={false}>
      <CapsuleCollider args={[0.55, 0.3]} friction={0} />
    </RigidBody>
  )
}
