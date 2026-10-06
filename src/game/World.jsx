// Level 1: the Wells Fargo Center concourse, a full ring around the arena bowl.
// Angles are measured around the ring from +Z toward +X (three.js cylinder
// convention). The lap starts at angle 0 (START / FINISH) and runs toward
// increasing angle, ending at the locker-room door just behind the start.
import { BackSide, DoubleSide } from 'three'
import { Text } from '@react-three/drei'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { Person, TrashCan, HotDogCart, Banner, COLORS } from './Placeholders.jsx'
import { R_IN, R_OUT, R_MID, polar } from './ring.js'
import { PEOPLE } from './level1.js'

const HEIGHT = 4.5
const WALL = 0.4
const SEGMENTS = 96 // collider pieces per ring

const PORTALS = Array.from({ length: 8 }, (_, i) => ({
  angle: (i + 0.5) * (Math.PI / 4),
  section: 101 + i * 3,
}))
const PORTAL_WIDTH = 4 // m
const PORTAL_HEIGHT = 2.6

// Rotation that makes local +Z point outward at angle a
const facingOut = (a) => [0, a, 0]
const facingIn = (a) => [0, a + Math.PI, 0]

// Invisible ring of box colliders: walls, floor, ceiling
function RingColliders({ radius, depth, y, height, width }) {
  const chord = width ?? 2 * radius * Math.sin(Math.PI / SEGMENTS) * 1.05
  return (
    <RigidBody type="fixed" colliders={false}>
      {Array.from({ length: SEGMENTS }, (_, i) => {
        const a = (i / SEGMENTS) * Math.PI * 2
        return (
          <CuboidCollider key={i} args={[chord / 2, height / 2, depth / 2]} position={polar(radius, a, y)} rotation={facingOut(a)} />
        )
      })}
    </RigidBody>
  )
}

function Shell() {
  const portalArc = PORTAL_WIDTH / R_IN
  const step = Math.PI / 4
  return (
    <>
      {/* Floor and ceiling */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[R_IN, R_OUT, 128, 1]} />
        <meshStandardMaterial color="#8C7B6B" />
      </mesh>
      <mesh position={[0, HEIGHT, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[R_IN, R_OUT, 128, 1]} />
        <meshStandardMaterial color="#15151F" />
      </mesh>
      <RingColliders radius={R_MID} depth={R_OUT - R_IN + 2} y={-0.1} height={0.2} width={2 * R_OUT * Math.sin(Math.PI / SEGMENTS) * 1.05} />
      <RingColliders radius={R_MID} depth={R_OUT - R_IN + 2} y={HEIGHT + 0.1} height={0.2} width={2 * R_OUT * Math.sin(Math.PI / SEGMENTS) * 1.05} />

      {/* Outer wall, seen from inside */}
      <mesh position={[0, HEIGHT / 2, 0]}>
        <cylinderGeometry args={[R_OUT, R_OUT, HEIGHT, 128, 1, true]} />
        <meshStandardMaterial color="#5A6378" side={BackSide} />
      </mesh>
      <RingColliders radius={R_OUT + WALL / 2} depth={WALL} y={HEIGHT / 2} height={HEIGHT} />

      {/* Inner wall: arcs between portals, lintels above them. Solid colliders all
          the way round, so portals are windows into the bowl, not exits. */}
      {PORTALS.map(({ angle }) => (
        <group key={angle}>
          <mesh position={[0, HEIGHT / 2, 0]}>
            <cylinderGeometry args={[R_IN, R_IN, HEIGHT, 24, 1, true, angle + portalArc / 2, step - portalArc]} />
            <meshStandardMaterial color="#6E7690" />
          </mesh>
          <mesh position={[0, (PORTAL_HEIGHT + HEIGHT) / 2, 0]}>
            <cylinderGeometry args={[R_IN, R_IN, HEIGHT - PORTAL_HEIGHT, 6, 1, true, angle - portalArc / 2, portalArc]} />
            <meshStandardMaterial color="#6E7690" />
          </mesh>
        </group>
      ))}
      <RingColliders radius={R_IN - WALL / 2} depth={WALL} y={HEIGHT / 2} height={HEIGHT} />

      {/* Section signs over each portal */}
      {PORTALS.map(({ angle, section }) => (
        <Text key={section} position={polar(R_IN + 0.03, angle, 3.5)} rotation={facingOut(angle)}
          fontSize={0.45} color={COLORS.gold} outlineWidth={0.02} outlineColor="black">
          {`SECTION ${section}`}
        </Text>
      ))}
    </>
  )
}

// The arena bowl seen through the portals: tiers of seats down to the court
function Bowl() {
  const tiers = [
    { top: 25.5, bottom: 22, y0: 0, y1: -2.5, color: COLORS.sixersBlue },
    { top: 22, bottom: 19, y0: -2.5, y1: -5, color: COLORS.sixersRed },
    { top: 19, bottom: 16.5, y0: -5, y1: -7, color: COLORS.sixersBlue },
  ]
  return (
    <>
      {tiers.map((t) => (
        <mesh key={t.top} position={[0, (t.y0 + t.y1) / 2, 0]}>
          <cylinderGeometry args={[t.top, t.bottom, t.y0 - t.y1, 64, 1, true]} />
          <meshStandardMaterial color={t.color} side={DoubleSide} />
        </mesh>
      ))}
      <mesh position={[0, -7, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[16.5, 64]} />
        <meshStandardMaterial color="#1A1A22" />
      </mesh>
      <mesh position={[0, -6.98, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[28, 15]} />
        <meshStandardMaterial color="#C8955A" />
      </mesh>
      <mesh position={[0, -6.96, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.6, 1.8, 48]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <Text position={[0, -6.95, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={1} color={COLORS.sixersBlue}>
        76
      </Text>
      <pointLight position={[0, 4, 0]} intensity={60} distance={30} color="#fff4e0" />
    </>
  )
}

// Gold line across the concourse at angle 0, with a hanging banner
function StartFinish() {
  return (
    <group>
      <mesh position={polar(R_MID, 0, 0.01)} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.6, R_OUT - R_IN]} />
        <meshStandardMaterial color={COLORS.gold} emissive={COLORS.gold} emissiveIntensity={0.4} />
      </mesh>
      <group position={polar(R_MID, 0, 3.4)} rotation={[0, Math.PI / 2, 0]}>
        <mesh>
          <planeGeometry args={[7, 1.2]} />
          <meshStandardMaterial color={COLORS.navy} side={DoubleSide} />
        </mesh>
        {[0, Math.PI].map((r) => (
          <Text key={r} rotation={[0, r, 0]} position={[0, 0, r ? -0.01 : 0.01]} fontSize={0.5} color={COLORS.gold}>
            START / FINISH
          </Text>
        ))}
      </group>
      {/* Tunnel mouth in the outer wall where Hinkie enters */}
      <mesh position={polar(R_OUT - 0.02, 0.03, 1.4)} rotation={facingIn(0.03)}>
        <planeGeometry args={[3, 2.8]} />
        <meshStandardMaterial color="#050508" />
      </mesh>
      <Text position={polar(R_OUT - 0.04, 0.03, 3.2)} rotation={facingIn(0.03)} fontSize={0.35} color="white">
        TUNNEL
      </Text>
      {/* Direction sign ahead of the spawn point. Facing the outer wall, the lap runs to your left. */}
      <Text position={polar(R_OUT - 0.04, 0.4, 2.2)} rotation={facingIn(0.4)} fontSize={0.4} color={COLORS.gold}
        outlineWidth={0.02} outlineColor="black">
        {'←  THIS WAY'}
      </Text>
      {/* Locker-room door lives in Objectives.jsx */}
    </group>
  )
}

const BANNERS = [
  { angle: 0.6, text: 'JULIUS ERVING #6', color: COLORS.sixersRed },
  { angle: 1.4, text: 'CHAMPIONSHIP BANNER — COMING SOON' },
  { angle: 2.3, text: 'MNSFANTASY.COM — MONEY NEVER SLEEPS', color: COLORS.navy, textColor: COLORS.gold },
  { angle: 3.2, text: 'IN TANK WE TRUST', color: COLORS.cream, textColor: COLORS.sixersRed },
  { angle: 4.1, text: 'ALLEN IVERSON #3', color: COLORS.sixersRed },
  { angle: 5.0, text: 'HINKIE WAS RIGHT', color: COLORS.navy, textColor: COLORS.gold },
  { angle: 5.8, text: 'TRUST THE PROCESS' },
]


export default function World() {
  return (
    <>
      <ambientLight intensity={0.9} />
      <hemisphereLight args={['#fff4e0', '#404050', 1.2]} />
      <directionalLight position={[10, 20, 5]} intensity={0.8} />

      <Shell />
      <Bowl />
      <StartFinish />

      {BANNERS.map((b) => (
        <Banner key={b.angle} position={polar(R_OUT - 0.02, b.angle, 2.8)} rotation={facingIn(b.angle)}
          text={b.text} color={b.color} textColor={b.textColor} />
      ))}

      {[0.8, 2.5, 4.3].map((a) => (
        <HotDogCart key={a} position={polar(R_OUT - 1.2, a)} rotation={facingIn(a)} />
      ))}
      {[0.2, 1.6, 3.0, 3.9, 5.2, 6.0].map((a) => (
        <TrashCan key={a} position={polar(R_OUT - 0.6, a)} />
      ))}

      {PEOPLE.map((p) => (
        <Person key={p.id} id={p.id} name={p.name} model={p.model} position={polar(p.r, p.angle)} color={p.color} height={p.height} fan={p.fan} />
      ))}
    </>
  )
}
