// Loads a GLB from public/models and fits it to a real-world height with its
// feet at y=0, so it drops into the same spot as the placeholder it replaces.
// Rigged models can play their clips: pass `anim`, a ref whose .current is
// { name, speed }, and the matching clip crossfades in.
import { Suspense, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useAnimations, useGLTF } from '@react-three/drei'
import { Box3, Vector3 } from 'three'
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js'

export const modelUrl = (name) => `${import.meta.env.BASE_URL}models/${name}.glb`

const FADE = 0.2 // s crossfade between clips

function Fitted({ url, height, rotationY, anim }) {
  const { scene: source, animations } = useGLTF(url)
  // Each placement gets its own copy (an object can only sit in one place);
  // geometry and textures stay shared.
  const scene = useMemo(() => cloneSkinned(source), [source])
  const { scale, offsetY, offsetX, offsetZ } = useMemo(() => {
    const box = new Box3().setFromObject(scene)
    const size = box.getSize(new Vector3())
    const s = height / size.y
    const center = box.getCenter(new Vector3())
    return { scale: s, offsetY: -box.min.y * s, offsetX: -center.x * s, offsetZ: -center.z * s }
  }, [scene, height])

  const root = useRef()
  const { actions } = useAnimations(animations, root)
  const playing = useRef(null)
  useFrame(() => {
    if (!anim?.current) return
    const { name, speed = 1 } = anim.current
    const next = actions[name]
    if (!next) return
    if (playing.current !== name) {
      actions[playing.current]?.fadeOut(FADE)
      next.reset().fadeIn(FADE).play()
      playing.current = name
    }
    next.timeScale = speed
  })

  return (
    <group ref={root} rotation={[0, rotationY, 0]}>
      <primitive object={scene} scale={scale} position={[offsetX, offsetY, offsetZ]} />
    </group>
  )
}

// Shows `fallback` (the placeholder) while the model downloads
export default function Model({ name, height, rotationY = 0, fallback = null, anim }) {
  return (
    <Suspense fallback={fallback}>
      <Fitted url={modelUrl(name)} height={height} rotationY={rotationY} anim={anim} />
    </Suspense>
  )
}
