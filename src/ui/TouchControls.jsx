// Phone controls: touch the left half to get a joystick where your thumb lands,
// drag the right half to look around.
import { useRef, useState } from 'react'
import { input } from '../game/input.js'

const STICK_RADIUS = 60 // px
const LOOK_SENSITIVITY = 0.006 // rad per px

export default function TouchControls() {
  const move = useRef(null) // { id, x, y }
  const look = useRef(null) // { id, x, y }
  const [stick, setStick] = useState(null) // { x, y, dx, dy }

  function down(e) {
    if (e.clientX < window.innerWidth / 2 && !move.current) {
      move.current = { id: e.pointerId, x: e.clientX, y: e.clientY }
      setStick({ x: e.clientX, y: e.clientY, dx: 0, dy: 0 })
    } else if (!look.current) {
      look.current = { id: e.pointerId, x: e.clientX, y: e.clientY }
    }
  }

  function moveTo(e) {
    if (move.current?.id === e.pointerId) {
      let dx = e.clientX - move.current.x
      let dy = e.clientY - move.current.y
      const len = Math.hypot(dx, dy)
      if (len > STICK_RADIUS) { dx *= STICK_RADIUS / len; dy *= STICK_RADIUS / len }
      input.moveX = dx / STICK_RADIUS
      input.moveY = -dy / STICK_RADIUS
      setStick((s) => ({ ...s, dx, dy }))
    } else if (look.current?.id === e.pointerId) {
      input.lookX += (e.clientX - look.current.x) * LOOK_SENSITIVITY
      input.lookY += (e.clientY - look.current.y) * LOOK_SENSITIVITY
      look.current.x = e.clientX
      look.current.y = e.clientY
    }
  }

  function up(e) {
    if (move.current?.id === e.pointerId) {
      move.current = null
      input.moveX = 0
      input.moveY = 0
      setStick(null)
    } else if (look.current?.id === e.pointerId) {
      look.current = null
    }
  }

  return (
    <div
      className="fixed inset-0 touch-none select-none"
      onPointerDown={down}
      onPointerMove={moveTo}
      onPointerUp={up}
      onPointerCancel={up}
    >
      {stick ? (
        <div className="pointer-events-none absolute rounded-full border-2 border-white/50 bg-white/10"
          style={{ left: stick.x - STICK_RADIUS, top: stick.y - STICK_RADIUS, width: STICK_RADIUS * 2, height: STICK_RADIUS * 2 }}>
          <div className="absolute rounded-full bg-white/70"
            style={{ left: STICK_RADIUS - 28 + stick.dx, top: STICK_RADIUS - 28 + stick.dy, width: 56, height: 56 }} />
        </div>
      ) : (
        <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-between px-6 text-lg text-white/80">
          <span>Left thumb: walk</span>
          <span>Right thumb: look</span>
        </div>
      )}
    </div>
  )
}
