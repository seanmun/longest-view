// Stand-in shapes for characters and props. Each matches the real-world size its
// Meshy model will have, so swapping in a model later changes nothing else.
import { Billboard, Text } from '@react-three/drei'
import { RigidBody, CapsuleCollider, CuboidCollider, CylinderCollider } from '@react-three/rapier'
import { useGame } from './state.js'

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

// A person NPC: solid body plus a floating nametag (turns into a gold BELIEVER once convinced).
export function Person({ id, name, position, color = COLORS.sixersBlue, height = 1.8 }) {
  const radius = 0.3
  const convinced = useGame((s) => s.flags[id] === true)
  return (
    <RigidBody type="fixed" position={position} colliders={false}>
      <CapsuleCollider args={[height / 2 - radius, radius]} position={[0, height / 2, 0]} />
      <PersonModel color={color} height={height} />
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
  return (
    <RigidBody type="fixed" position={position} colliders={false}>
      <CylinderCollider args={[0.45, 0.3]} position={[0, 0.45, 0]} />
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.3, 0.26, 0.9, 16]} />
        <meshStandardMaterial color="#3A3F47" />
      </mesh>
    </RigidBody>
  )
}

export function HotDogCart({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <Box position={[0, 0.55, 0]} size={[1.6, 1.1, 0.8]} color={COLORS.sixersRed} />
      <mesh position={[0, 1.9, 0]}>
        <boxGeometry args={[1.8, 0.08, 1]} />
        <meshStandardMaterial color={COLORS.gold} />
      </mesh>
      <Billboard position={[0, 2.25, 0]}>
        <Text fontSize={0.2} color="white" outlineWidth={0.02} outlineColor="black">HOT DOGS</Text>
      </Billboard>
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
