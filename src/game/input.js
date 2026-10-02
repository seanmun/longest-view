// Shared input state. Keyboard, mouse and touch all write here; the Player reads it each frame.
export const input = {
  moveX: 0, // touch joystick, -1..1 (right +)
  moveY: 0, // touch joystick, -1..1 (forward +)
  lookX: 0, // accumulated yaw delta in radians
  lookY: 0, // accumulated pitch delta in radians
}

const keys = new Set()

export function consumeLook() {
  const look = { x: input.lookX, y: input.lookY }
  input.lookX = 0
  input.lookY = 0
  return look
}

export function keyboardAxes() {
  const x = (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0)
  const y = (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0)
  const turn = (keys.has('ArrowRight') ? 1 : 0) - (keys.has('ArrowLeft') ? 1 : 0)
  return { x, y, turn }
}

export function listenKeyboard() {
  const down = (e) => keys.add(e.code)
  const up = (e) => keys.delete(e.code)
  const clear = () => keys.clear()
  window.addEventListener('keydown', down)
  window.addEventListener('keyup', up)
  window.addEventListener('blur', clear)
  return () => {
    window.removeEventListener('keydown', down)
    window.removeEventListener('keyup', up)
    window.removeEventListener('blur', clear)
  }
}
