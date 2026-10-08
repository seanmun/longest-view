import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import World from './game/World.jsx'
import Objectives from './game/Objectives.jsx'
import Preload from './game/Preload.jsx'
import Mob from './game/Mob.jsx'
import Balls from './game/Balls.jsx'
import { polar, R_MID } from './game/ring.js'
import Player from './game/Player.jsx'
import Level2 from './game/Level2.jsx'
import { Apostles } from './game/Placeholders.jsx'
import { LOT } from './game/levels.js'
import { useGame } from './game/state.js'
import TouchControls from './ui/TouchControls.jsx'
import DesktopControls from './ui/DesktopControls.jsx'
import Talk from './ui/Talk.jsx'
import Hud from './ui/Hud.jsx'
import Intro from './ui/Intro.jsx'
import SoundToggle from './ui/SoundToggle.jsx'

// ?at=<radians>&r=<meters> spawns elsewhere on the ring, for testing
const params = new URLSearchParams(window.location.search)
const START_ANGLE = Number(params.get('at')) || 0.25
const START_R = Number(params.get('r')) || R_MID
const isTouch = window.matchMedia('(pointer: coarse)').matches

export default function App() {
  const level = useGame((s) => s.level)
  return (
    <div className="fixed inset-0">
      <Canvas camera={{ fov: 70, near: 0.1, far: 200 }} dpr={[1, 2]}>
        <color attach="background" args={['#0a0a1a']} />
        <Suspense fallback={null}>
          <Physics>
            <Preload />
            {level === 1 ? (
              <>
                <World />
                <Objectives />
                <Mob />
                {/* Start just past the START / FINISH line, facing the direction of the lap */}
                <Player key="l1" position={polar(START_R, START_ANGLE, 1)} yaw={START_ANGLE - Math.PI / 2} />
              </>
            ) : (
              <>
                <Level2 />
                {/* Out the doors, facing down the lot toward Xfinity Live! */}
                <Player key="l2" position={[LOT.spawn.x, 1, LOT.spawn.z]} yaw={0} />
              </>
            )}
            <Apostles />
            <Balls />
          </Physics>
        </Suspense>
      </Canvas>
      {isTouch ? <TouchControls /> : <DesktopControls />}
      <Hud />
      <SoundToggle />
      <Talk isTouch={isTouch} />
      <Intro isTouch={isTouch} />
    </div>
  )
}
