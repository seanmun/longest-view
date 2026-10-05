// Binder puzzle: three floating pages around the ring; all three open the
// locker-room door, and walking through it finishes the level.
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import { COLORS } from './Placeholders.jsx'
import { R_OUT, polar } from './ring.js'
import { PAGES, PICKUP_RANGE, DOOR, DOOR_RANGE, ENTER_RANGE } from './level1.js'
import { getState, setState, useGame, player, toast } from './state.js'

const facingIn = (a) => [0, a + Math.PI, 0]
const distTo = ([x, , z]) => Math.hypot(x - player.x, z - player.z)

const PAGE_SPOTS = PAGES.map((p) => ({ ...p, pos: polar(p.r, p.angle) }))
const DOOR_FRONT = polar(R_OUT - 0.8, DOOR.angle)

function Page({ id, pos }) {
  const ref = useRef()
  const taken = useGame((s) => s.pages[id] === true)
  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.rotation.y = clock.elapsedTime * 1.5
    ref.current.position.y = 1 + Math.sin(clock.elapsedTime * 2) * 0.12
  })
  if (taken) return null
  return (
    <group position={pos}>
      <group ref={ref}>
        <mesh>
          <boxGeometry args={[0.5, 0.65, 0.05]} />
          <meshStandardMaterial color={COLORS.cream} emissive={COLORS.gold} emissiveIntensity={0.9} />
        </mesh>
      </group>
      <Billboard position={[0, 1.65, 0]}>
        <Text fontSize={0.2} color={COLORS.gold} outlineWidth={0.02} outlineColor="black">BINDER PAGE</Text>
      </Billboard>
    </group>
  )
}

function Door() {
  const open = useGame((s) => s.doorOpen)
  return (
    <group position={polar(R_OUT - 0.05, DOOR.angle)} rotation={facingIn(DOOR.angle)}>
      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[1.6, 2.4, 0.1]} />
        <meshStandardMaterial color={open ? '#050508' : COLORS.gold} />
      </mesh>
      <Text position={[0, 2.75, 0.08]} fontSize={0.3} color="white" outlineWidth={0.02} outlineColor="black">
        {open ? 'LOCKER ROOM — OPEN' : 'LOCKER ROOM'}
      </Text>
    </group>
  )
}

export default function Objectives() {
  useFrame(() => {
    const s = getState()
    if (s.complete) return

    for (const page of PAGE_SPOTS) {
      if (!s.pages[page.id] && distTo(page.pos) < PICKUP_RANGE) {
        const pages = { ...s.pages, [page.id]: true }
        const count = Object.keys(pages).length
        setState({ pages })
        toast(count === PAGES.length
          ? 'All 3 binder pages! The locker room will open for you.'
          : `Binder page found: ${count} of ${PAGES.length}`)
        return
      }
    }

    const doorDist = distTo(DOOR_FRONT)
    const nearDoor = doorDist < DOOR_RANGE
    if (nearDoor !== s.nearDoor) setState({ nearDoor })

    const haveAll = Object.keys(s.pages).length === PAGES.length
    if (nearDoor && haveAll && !s.doorOpen) setState({ doorOpen: true })
    if (s.doorOpen && doorDist < ENTER_RANGE) setState({ complete: true })
  })

  return (
    <>
      {PAGE_SPOTS.map((p) => <Page key={p.id} id={p.id} pos={p.pos} />)}
      <Door />
    </>
  )
}
