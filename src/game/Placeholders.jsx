// Stand-in shapes for characters and props. Each matches the real-world size its
// Meshy model will have, so swapping in a model later changes nothing else.
import { Billboard, Text } from '@react-three/drei'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, CapsuleCollider, CuboidCollider, CylinderCollider } from '@react-three/rapier'
import { useGame, player } from './state.js'
import { followers } from './follow.js'
import Model from './Model.jsx'

export const COLORS = {
  sixersBlue: '#006BB6',
  sixersRed: '#ED174C',
  navy: '#2A3F6E',
  gold: '#E8B800',
  cream: '#F2E8D5',
  skin: '#E0B48C',
}

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

const CELEBRATE_MS = 2500 // happy dance when a named fan is won over

// A convinced fan walking in Hinkie's line: no collider, so the line never
// blocks or traps him. Rigged fans play happy / walk / run clips.
function Follower({ id, name, model, color, height }) {
  const root = useRef()
  const body = useRef()
  const step = useRef(0)
  const anim = useRef({ name: 'happy', speed: 1 })
  useFrame((_, dt) => {
    const f = followers[id]
    if (!f || !root.current) return
    root.current.position.set(f.x, 0, f.z)
    root.current.rotation.y = f.yaw
    if (model) {
      const celebrating = performance.now() - f.joinedAt < CELEBRATE_MS
      if (celebrating || f.speed < 0.2) anim.current = { name: 'happy', speed: 1 } // cheer while waiting
      else if (f.speed < 4.8) anim.current = { name: 'walk', speed: f.speed / 3 }
      else anim.current = { name: 'run', speed: f.speed / 6 }
    } else {
      step.current += dt * f.speed * 2.5
      body.current.position.y = f.speed > 0.2 ? Math.abs(Math.sin(step.current)) * 0.08 : 0 // bob while walking
    }
  })
  return (
    <group ref={root}>
      <group ref={body}>
        {model
          ? <Model name={model} height={height} anim={anim} fallback={<PersonModel color={color} height={height} />} />
          : <PersonModel color={color} height={height} />}
      </group>
      <Billboard position={[0, height + 0.35, 0]}>
        <Text fontSize={0.22} color={COLORS.gold} outlineWidth={0.02} outlineColor="black" anchorY="middle">
          {model ? name : 'BELIEVER'}
        </Text>
      </Billboard>
    </group>
  )
}

// A rigged fan still waiting to be convinced: stands still, turned toward Hinkie
function Watching({ model, height, color }) {
  const turn = useRef()
  const anim = useRef({ name: 'walk', speed: 0 }) // first walk frame, held, is a neutral stance
  useFrame(() => {
    const g = turn.current
    if (!g) return
    const p = g.getWorldPosition(g.userData.v ??= g.position.clone())
    g.rotation.y = Math.atan2(player.x - p.x, player.z - p.z)
  })
  return (
    <group ref={turn}>
      <Model name={model} height={height} anim={anim} fallback={<PersonModel color={color} height={height} />} />
    </group>
  )
}

// A person NPC: solid body plus a floating nametag. A convinced fan becomes a
// gold BELIEVER and falls in line behind Hinkie.
export function Person({ id, name, model, position, color = COLORS.sixersBlue, height = 1.8, fan = false }) {
  const radius = 0.3
  const convinced = useGame((s) => s.flags[id] === true)
  if (fan && convinced) return <Follower id={id} name={name} model={model} color={color} height={height} />
  return (
    <RigidBody type="fixed" position={position} colliders={false}>
      <CapsuleCollider args={[height / 2 - radius, radius]} position={[0, height / 2, 0]} />
      {model ? <Watching model={model} height={height} color={color} /> : <PersonModel color={color} height={height} />}
      <Billboard position={[0, height + 0.35, 0]}>
        <Text fontSize={0.22} color={convinced ? COLORS.gold : 'white'} outlineWidth={0.02} outlineColor="black" anchorY="middle">
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
