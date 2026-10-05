// Loads a GLB from public/models and fits it to a real-world height with its
// feet at y=0, so it drops into the same spot as the placeholder it replaces.
import { Suspense, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { Box3, Vector3 } from 'three'

export const modelUrl = (name) => `${import.meta.env.BASE_URL}models/${name}.glb`

function Fitted({ url, height, rotationY }) {
  const { scene } = useGLTF(url)
  const { scale, offsetY, offsetX, offsetZ } = useMemo(() => {
    const box = new Box3().setFromObject(scene)
    const size = box.getSize(new Vector3())
    const s = height / size.y
    const center = box.getCenter(new Vector3())
    return { scale: s, offsetY: -box.min.y * s, offsetX: -center.x * s, offsetZ: -center.z * s }
  }, [scene, height])
  return (
    <group rotation={[0, rotationY, 0]}>
      <primitive object={scene} scale={scale} position={[offsetX, offsetY, offsetZ]} />
    </group>
  )
}

// Shows `fallback` (the placeholder) while the model downloads
export default function Model({ name, height, rotationY = 0, fallback = null }) {
  return (
    <Suspense fallback={fallback}>
      <Fitted url={modelUrl(name)} height={height} rotationY={rotationY} />
    </Suspense>
  )
}
