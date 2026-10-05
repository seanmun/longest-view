// Desktop: click to capture the mouse for looking; Esc releases it.
import { useEffect, useState } from 'react'
import { input } from '../game/input.js'
import { useGame } from '../game/state.js'

const MOUSE_SENSITIVITY = 0.0025 // rad per px

export default function DesktopControls() {
  const [locked, setLocked] = useState(false)
  const talking = useGame((s) => s.talk != null)

  useEffect(() => {
    const onLockChange = () => setLocked(document.pointerLockElement != null)
    const onMouseMove = (e) => {
      if (!document.pointerLockElement) return
      input.lookX += e.movementX * MOUSE_SENSITIVITY
      input.lookY += e.movementY * MOUSE_SENSITIVITY
    }
    const onMouseDown = (e) => {
      if (document.pointerLockElement && e.button === 0) input.throws++
    }
    const onKeyDown = (e) => {
      if (e.code === 'KeyF' && !e.repeat) input.throws++
    }
    document.addEventListener('pointerlockchange', onLockChange)
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mousedown', onMouseDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerlockchange', onLockChange)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  if (talking) return null // dialogue has the mouse

  if (locked) {
    return <div className="pointer-events-none fixed left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80" />
  }

  return (
    <button
      className="fixed inset-0 flex cursor-pointer flex-col items-center justify-center gap-6 bg-black/60 text-white"
      onClick={() => document.body.requestPointerLock()}
    >
      <h1 className="title text-2xl text-[#E8B800]">LONGEST VIEW</h1>
      <p className="text-2xl">Click to start</p>
      <p className="text-lg text-white/80">WASD or arrows to walk · Mouse to look · Click or F to throw · E to talk · Esc to pause</p>
    </button>
  )
}
