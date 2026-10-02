import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import World, { polar, R_MID } from './game/World.jsx'
import Player from './game/Player.jsx'
import TouchControls from './ui/TouchControls.jsx'
import DesktopControls from './ui/DesktopControls.jsx'

// ?at=<radians> spawns elsewhere on the ring, for testing
const START_ANGLE = Number(new URLSearchParams(window.location.search).get('at')) || 0.25
const isTouch = window.matchMedia('(pointer: coarse)').matches

export default function App() {
  return (
    <div className="fixed inset-0">
      <Canvas camera={{ fov: 70, near: 0.1, far: 200 }} dpr={[1, 2]}>
        <color attach="background" args={['#0a0a1a']} />
        <Suspense fallback={null}>
          <Physics>
            <World />
            {/* Start just past the START / FINISH line, facing the direction of the lap */}
            <Player position={polar(R_MID, START_ANGLE, 1)} yaw={START_ANGLE - Math.PI / 2} />
          </Physics>
        </Suspense>
      </Canvas>
      {isTouch ? <TouchControls /> : <DesktopControls />}
    </div>
  )
}
