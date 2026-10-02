// Movement sandbox: a stand-in Wells Fargo Center concourse.
// 50m long (x: -25..25), 10m wide (z: -5..5), 4.5m ceiling.
import { Box, Person, TrashCan, HotDogCart, Banner, COLORS } from './Placeholders.jsx'

const LENGTH = 50
const WIDTH = 10
const HEIGHT = 4.5
const WALL = 0.4

export default function World() {
  return (
    <>
      <hemisphereLight args={['#fff4e0', '#202030', 1.1]} />
      <directionalLight position={[5, 10, 4]} intensity={1.2} />
      {[-18, -6, 6, 18].map((x) => (
        <pointLight key={x} position={[x, HEIGHT - 0.5, 0]} intensity={8} distance={14} color="#ffe6b0" />
      ))}

      {/* Floor, ceiling, walls */}
      <Box position={[0, -0.1, 0]} size={[LENGTH, 0.2, WIDTH]} color="#8C7B6B" />
      <Box position={[0, HEIGHT + 0.1, 0]} size={[LENGTH, 0.2, WIDTH]} color="#15151F" />
      <Box position={[0, HEIGHT / 2, -WIDTH / 2 - WALL / 2]} size={[LENGTH, HEIGHT, WALL]} color="#3B4152" />
      <Box position={[0, HEIGHT / 2, WIDTH / 2 + WALL / 2]} size={[LENGTH, HEIGHT, WALL]} color="#3B4152" />
      <Box position={[-LENGTH / 2 - WALL / 2, HEIGHT / 2, 0]} size={[WALL, HEIGHT, WIDTH]} color="#2A2F3C" />
      <Box position={[LENGTH / 2 + WALL / 2, HEIGHT / 2, 0]} size={[WALL, HEIGHT, WIDTH]} color="#2A2F3C" />

      {/* Locker-room door at the far end (locked until the binder puzzle) */}
      <Box position={[LENGTH / 2 - 0.05, 1.2, 0]} size={[0.1, 2.4, 1.6]} color={COLORS.gold} />

      {/* Pillars */}
      {[-12, 0, 12].map((x) => (
        <Box key={x} position={[x, HEIGHT / 2, -3.6]} size={[0.8, HEIGHT, 0.8]} color="#545B6E" />
      ))}

      {/* Banners on the back wall */}
      <Banner position={[-16, 2.8, -WIDTH / 2 + 0.01]} text="JULIUS ERVING #6" color={COLORS.sixersRed} />
      <Banner position={[-4, 2.8, -WIDTH / 2 + 0.01]} text="CHAMPIONSHIP BANNER — COMING SOON" />
      <Banner position={[8, 2.8, -WIDTH / 2 + 0.01]} text="MNSFANTASY.COM — MONEY NEVER SLEEPS" color={COLORS.navy} textColor={COLORS.gold} />
      <Banner position={[2, 2.8, WIDTH / 2 - 0.01]} rotation={[0, Math.PI, 0]} text="IN TANK WE TRUST" color={COLORS.cream} textColor={COLORS.sixersRed} />

      {/* Props */}
      <HotDogCart position={[-8, 0, 3.6]} />
      <TrashCan position={[-14, 0, 4.3]} />
      <TrashCan position={[4, 0, -4.3]} />
      <TrashCan position={[16, 0, 4.3]} />

      {/* People */}
      <Person name="FAN" position={[-10, 0, -1.5]} />
      <Person name="FAN" position={[3, 0, 2]} color={COLORS.sixersRed} />
      <Person name="ANALYST" position={[10, 0, -2]} color={COLORS.cream} />
      <Person name="DRUNK FAN" position={[19, 0, 1.5]} height={1.85} />
    </>
  )
}
