// The way out: glass exit doors on the outer wall with the parking lot
// visible through them. They slide open once the anti-fans are gone, and
// walking through them finishes the level.
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { CanvasTexture, SRGBColorSpace } from 'three'
import { R_OUT, polar } from './ring.js'
import { DOOR, DOOR_RANGE, ENTER_RANGE } from './level1.js'
import { getState, setState, player, toast } from './state.js'
import { sfx, stopMusic } from './audio.js'

const facingIn = (a) => [0, a + Math.PI, 0]
const DOOR_FRONT = polar(R_OUT - 0.8, DOOR.angle)
const WIDTH = 3.2 // m, both panels
const HEIGHT = 2.7 // m
const OPEN_SPEED = 1.5 // m/s each panel slides

// South Philly at night, painted once onto a canvas: the Linc and the Bank in
// the distance, Xfinity Live! ahead, light poles and parked cars between.
function paintParkingLot() {
  const c = document.createElement('canvas')
  c.width = 1024
  c.height = 864
  const g = c.getContext('2d')
  const horizon = c.height * 0.55

  const sky = g.createLinearGradient(0, 0, 0, horizon)
  sky.addColorStop(0, '#070b22')
  sky.addColorStop(1, '#3b2c5c')
  g.fillStyle = sky
  g.fillRect(0, 0, c.width, horizon)

  // Lincoln Financial Field (left) and Citizens Bank Park (right)
  const stadium = (x, w, h, label) => {
    g.fillStyle = '#1b1f2e'
    g.beginPath()
    g.moveTo(x, horizon)
    g.quadraticCurveTo(x + w / 2, horizon - h * 1.6, x + w, horizon)
    g.fill()
    g.fillStyle = '#fff6d8'
    for (let i = 0; i < 9; i++) {
      const t = (i + 0.5) / 9
      const px = x + w * t
      const py = horizon - h * 1.6 * 2 * t * (1 - t) * 0.98
      g.beginPath(); g.arc(px, py, 3, 0, Math.PI * 2); g.fill()
    }
    g.fillStyle = 'rgba(255,255,255,0.55)'
    g.font = 'bold 18px sans-serif'
    g.textAlign = 'center'
    g.fillText(label, x + w / 2, horizon - h * 0.25)
  }
  stadium(30, 380, 120, 'LINCOLN FINANCIAL FIELD')
  stadium(660, 330, 90, 'CITIZENS BANK PARK')

  // Xfinity Live! ahead
  g.fillStyle = '#23263a'
  g.fillRect(390, horizon - 95, 250, 95)
  g.font = 'bold 40px sans-serif'
  g.textAlign = 'center'
  g.shadowColor = '#ff3355'
  g.shadowBlur = 18
  g.fillStyle = '#ff5a76'
  g.fillText('XFINITY LIVE!', 515, horizon - 45)
  g.shadowBlur = 0

  // Asphalt with parking lines
  g.fillStyle = '#26282e'
  g.fillRect(0, horizon, c.width, c.height - horizon)
  g.strokeStyle = 'rgba(255,255,255,0.35)'
  g.lineWidth = 2
  for (let i = -10; i <= 10; i++) {
    g.beginPath()
    g.moveTo(c.width / 2 + i * 30, horizon)
    g.lineTo(c.width / 2 + i * 180, c.height)
    g.stroke()
  }

  // Light poles
  for (const x of [120, 330, 700, 910]) {
    g.fillStyle = '#555a66'
    g.fillRect(x - 2, horizon - 150, 4, 190)
    const glow = g.createRadialGradient(x, horizon - 150, 2, x, horizon - 150, 40)
    glow.addColorStop(0, 'rgba(255,240,200,0.95)')
    glow.addColorStop(1, 'rgba(255,240,200,0)')
    g.fillStyle = glow
    g.fillRect(x - 40, horizon - 190, 80, 80)
  }

  // Parked cars, two rows getting bigger toward the doors
  const colors = ['#b23a48', '#e8e8e8', '#2b4f8c', '#111', '#8a8f99', '#c9a227', '#3d6b4f']
  const row = (y, w, h, n, seed) => {
    for (let i = 0; i < n; i++) {
      const x = (i + 0.5) * (c.width / n) + ((i * 37 + seed) % 15) - 7
      g.fillStyle = colors[(i * 3 + seed) % colors.length]
      g.beginPath()
      g.roundRect(x - w / 2, y - h, w, h, h * 0.35)
      g.fill()
      g.fillStyle = 'rgba(160,200,255,0.35)' // windshield
      g.fillRect(x - w * 0.3, y - h * 0.95, w * 0.6, h * 0.35)
    }
  }
  row(horizon + 60, 70, 28, 11, 1)
  row(horizon + 190, 120, 48, 7, 4)

  const tex = new CanvasTexture(c)
  tex.colorSpace = SRGBColorSpace
  return tex
}

function GlassDoors() {
  const view = useMemo(paintParkingLot, [])
  const left = useRef()
  const right = useRef()
  const slide = useRef(0)

  useFrame((_, dt) => {
    const target = getState().doorOpen ? WIDTH / 2 - 0.1 : 0
    slide.current += Math.sign(target - slide.current) * Math.min(Math.abs(target - slide.current), OPEN_SPEED * dt)
    left.current.position.x = -WIDTH / 4 - slide.current
    right.current.position.x = WIDTH / 4 + slide.current
  })

  const pane = (
    <>
      <mesh>
        <boxGeometry args={[WIDTH / 2 - 0.04, HEIGHT - 0.08, 0.03]} />
        <meshStandardMaterial color="#a8d0f0" transparent opacity={0.22} metalness={0.6} roughness={0.05} />
      </mesh>
      <mesh position={[WIDTH / 4 - 0.1, 0, 0.04]}>
        <boxGeometry args={[0.04, 0.6, 0.04]} />
        <meshStandardMaterial color="#c8ccd4" metalness={0.8} roughness={0.3} />
      </mesh>
    </>
  )

  return (
    <group position={polar(R_OUT - 0.02, DOOR.angle)} rotation={facingIn(DOOR.angle)}>
      {/* The lot outside, unlit so it reads as the night beyond the glass */}
      <mesh position={[0, HEIGHT / 2, 0.01]}>
        <planeGeometry args={[WIDTH, HEIGHT]} />
        <meshBasicMaterial map={view} toneMapped={false} />
      </mesh>
      <group position={[0, HEIGHT / 2, 0.07]}>
        <group ref={left}>{pane}</group>
        <group ref={right}><group rotation={[0, Math.PI, 0]}>{pane}</group></group>
      </group>
      {/* Aluminum frame */}
      {[-WIDTH / 2 - 0.06, WIDTH / 2 + 0.06].map((x) => (
        <mesh key={x} position={[x, HEIGHT / 2, 0.07]}>
          <boxGeometry args={[0.12, HEIGHT + 0.12, 0.12]} />
          <meshStandardMaterial color="#9aa0aa" metalness={0.8} roughness={0.35} />
        </mesh>
      ))}
      <mesh position={[0, HEIGHT + 0.06, 0.07]}>
        <boxGeometry args={[WIDTH + 0.24, 0.12, 0.12]} />
        <meshStandardMaterial color="#9aa0aa" metalness={0.8} roughness={0.35} />
      </mesh>
      <mesh position={[0, HEIGHT + 0.42, 0.06]}>
        <boxGeometry args={[0.9, 0.36, 0.06]} />
        <meshStandardMaterial color="#0d1f0f" />
      </mesh>
      <Text position={[0, HEIGHT + 0.42, 0.1]} fontSize={0.24} color="#38ff6a" outlineWidth={0.004} outlineColor="#0a3">
        EXIT
      </Text>
    </group>
  )
}

export default function Objectives() {
  useFrame(() => {
    const s = getState()
    if (s.complete) return

    const doorDist = Math.hypot(DOOR_FRONT[0] - player.x, DOOR_FRONT[2] - player.z)
    const nearDoor = doorDist < DOOR_RANGE
    if (nearDoor !== s.nearDoor) setState({ nearDoor })

    if (s.mobLeft === 0 && !s.doorOpen) {
      setState({ doorOpen: true })
      sfx.door()
      toast('The exit is clear! Head out the glass doors.')
    }
    if (s.doorOpen && doorDist < ENTER_RANGE) {
      setState({ complete: true, finishedAt: performance.now() })
      stopMusic()
      sfx.complete()
    }
  })

  return <GlassDoors />
}
