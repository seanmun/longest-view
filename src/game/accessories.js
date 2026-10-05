// Real 3D props bolted onto a rigged model, for when Meshy only painted them
// on the texture. Positions are in the model's own (unscaled) space in its
// bind pose; each piece is then attached to a bone so it follows animation.
import { Group, Mesh, MeshStandardMaterial, BoxGeometry, Vector3 } from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

function findBone(scene, suffix) {
  let found = null
  scene.traverse((o) => { if (!found && o.isBone && o.name.endsWith(suffix)) found = o })
  return found
}

// Sunglasses: two glossy lenses, a bridge, and arms back to the ears.
// y = lens center height, z = front of the face at that height,
// earX / earY / earZ = where the arms end, just above the ears.
export function addSunglasses(scene, { y, z, lensW = 0.19, lensH = 0.11, wrap = 0.3, earX, earY, earZ }) {
  const head = findBone(scene, 'Head')
  if (!head) return
  scene.updateMatrixWorld(true)

  const frame = new MeshStandardMaterial({ color: '#0b0b0d', roughness: 0.15, metalness: 0.4 })
  const glasses = new Group()
  const lens = new RoundedBoxGeometry(lensW, lensH, 0.02, 3, 0.03)
  for (const side of [-1, 1]) {
    const l = new Mesh(lens, frame)
    l.position.set(side * (lensW / 2 + 0.012), y, z + 0.012)
    l.rotation.y = side * wrap // wrap around the face
    glasses.add(l)

    // Arm from the lens's outer top corner back to just above the ear
    const front = new Vector3(side * (lensW + 0.005), y + lensH * 0.3, z - 0.03)
    const back = new Vector3(side * earX, earY, earZ)
    const arm = new Mesh(new BoxGeometry(0.018, 0.034, front.distanceTo(back)), frame)
    arm.position.copy(front).add(back).multiplyScalar(0.5)
    glasses.add(arm)
    arm.lookAt(back) // group is still at the origin, so world = local here
  }
  const bridge = new Mesh(new BoxGeometry(0.05, 0.02, 0.02), frame)
  bridge.position.set(0, y + lensH * 0.25, z + 0.03)
  glasses.add(bridge)

  head.attach(glasses) // keeps its place, follows the head from now on
}
