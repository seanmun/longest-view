// Real 3D props bolted onto a rigged model, for when Meshy only painted them
// on the texture. Positions are in the model's own (unscaled) space in its
// bind pose; each piece is then attached to a bone so it follows animation.
import { Group, Mesh, MeshStandardMaterial, BoxGeometry, Vector3, Matrix4 } from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

function findBone(scene, suffix) {
  let found = null
  scene.traverse((o) => { if (!found && o.isBone && o.name.endsWith(suffix)) found = o })
  return found
}

// Sunglasses: two glossy lenses, a bridge, and arms back to the ears.
// y / z = lens center height and the front of the face there.
// earX / earY / earZ = where the arms end, just above the ears.
// tilt (radians) leans the lenses back, e.g. glasses pushed up onto a cap.
export function addSunglasses(scene, { y, z, lensW = 0.19, lensH = 0.11, wrap = 0.3, tilt = 0, earX, earY, earZ }) {
  const head = findBone(scene, 'Head')
  if (!head) return
  scene.updateMatrixWorld(true)

  const frame = new MeshStandardMaterial({ color: '#0b0b0d', roughness: 0.15, metalness: 0.4 })
  const glasses = new Group()
  // Lenses and bridge share a pivot at the lens center so `tilt` leans them together
  const front = new Group()
  front.position.set(0, y, z)
  front.rotation.x = -tilt
  glasses.add(front)
  const lens = new RoundedBoxGeometry(lensW, lensH, 0.02, 3, 0.03)
  for (const side of [-1, 1]) {
    const l = new Mesh(lens, frame)
    l.position.set(side * (lensW / 2 + 0.012), 0, 0.012)
    l.rotation.y = side * wrap // wrap around the face
    front.add(l)
  }
  const bridge = new Mesh(new BoxGeometry(0.05, 0.02, 0.02), frame)
  bridge.position.set(0, lensH * 0.25, 0.03)
  front.add(bridge)
  glasses.updateMatrixWorld(true)

  // Arms from each lens's outer top corner back to just above the ear
  for (const side of [-1, 1]) {
    const start = front.localToWorld(new Vector3(side * (lensW + 0.005), lensH * 0.3, -0.03))
    const end = new Vector3(side * earX, earY, earZ)
    const arm = new Mesh(new BoxGeometry(0.018, 0.034, start.distanceTo(end)), frame)
    arm.position.copy(start).add(end).multiplyScalar(0.5)
    glasses.add(arm)
    arm.lookAt(end) // group is still at the origin, so world = local here
  }

  head.attach(glasses) // keeps its place, follows the head from now on
}

// A thin glossy lens laid over a painted-on one, to hide holes in Meshy's
// geometry (the cap showed through Pudd's right lens). center / normal come
// from fitting a plane to the painted lens; w / h are its size in meters.
export function addLensPatch(scene, { center, normal, w, h, color = '#10162a', lift = 0.008 }) {
  const head = findBone(scene, 'Head')
  if (!head) return
  scene.updateMatrixWorld(true)
  const n = new Vector3(...normal).normalize()
  const lens = new Mesh(
    new RoundedBoxGeometry(w, h, 0.008, 3, 0.03),
    new MeshStandardMaterial({ color, roughness: 0.08, metalness: 0.5 }),
  )
  lens.position.set(...center).addScaledVector(n, lift)
  // Box's thin axis (z) along the normal, width roughly along +x
  const xAxis = new Vector3(1, 0, 0).addScaledVector(n, -n.x).normalize()
  const yAxis = new Vector3().crossVectors(n, xAxis)
  lens.quaternion.setFromRotationMatrix(new Matrix4().makeBasis(xAxis, yAxis, n))
  const holder = new Group()
  holder.add(lens)
  head.attach(holder)
}

// Fixes for specific models' baked-in flaws, applied wherever the model appears
// (waiting, following, in the mob). Keyed by model name.
export const DECORATIONS = {
  // Meshy painted PJ's sunglasses on badly; give him real ones
  pj: (scene) => addSunglasses(scene, { y: 1.69, z: 0.33, lensW: 0.215, lensH: 0.14, earX: 0.375, earY: 1.665, earZ: -0.09 }),
  // Pudd's cap glasses are repainted in the texture; this covers a hole in the right lens
  pudd: (scene) => addLensPatch(scene, { center: [0.188, 2.24, 0.222], normal: [0.402, 0.647, 0.647], w: 0.235, h: 0.215, lift: 0.012 }),
}
