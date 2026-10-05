// Loads a GLB from public/models and fits it to a real-world height with its
// feet at y=0, so it drops into the same spot as the placeholder it replaces.
// Rigged models can play their clips: pass `anim`, a ref whose .current is
// { name, speed, shot }. `name` crossfades in as the base loop; `shot`
// ({ id, name, start, speed }, new id each time) plays once on the upper body
// over it, so legs keep walking or running during a throw.
import { Suspense, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useAnimations, useGLTF } from '@react-three/drei'
import { Box3, LoopOnce, Vector3 } from 'three'
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js'

export const modelUrl = (name) => `${import.meta.env.BASE_URL}models/${name}.glb`

const FADE = 0.2 // s crossfade between clips
const SHOT_WEIGHT = 5 // upper-body shot vs base loop: about 5/6 shot on shared bones
const UPPER_BODY = /spine|neck|head|shoulder|arm|hand/i

// Meshy clips often carry the character across the floor (a crawl travels
// meters; falls end a meter away). The game moves characters itself, so take
// out the hips' net floor travel and keep their sway and bounce.
function inPlace(clip) {
  for (const track of clip.tracks) {
    if (!/Hips\.position$/.test(track.name)) continue
    const v = track.values
    const n = v.length / 3
    if (n < 2) continue
    const dx = v[(n - 1) * 3] - v[0]
    const dz = v[(n - 1) * 3 + 2] - v[2]
    for (let i = 0; i < n; i++) {
      const f = i / (n - 1)
      v[i * 3] -= dx * f
      v[i * 3 + 2] -= dz * f
    }
  }
  return clip
}

// A copy of a clip that only moves the upper body
function upperBodyOnly(clip) {
  const c = clip.clone()
  c.tracks = c.tracks.filter((t) => UPPER_BODY.test(t.name.split('.')[0]))
  return c
}

function Fitted({ url, height, rotationY, anim, decorate }) {
  const { scene: source, animations } = useGLTF(url)
  // Each placement gets its own copy (an object can only sit in one place);
  // geometry and textures stay shared.
  const scene = useMemo(() => {
    const copy = cloneSkinned(source)
    decorate?.(copy) // e.g. real sunglasses where Meshy only painted them
    return copy
  }, [source, decorate])
  const { scale, offsetY, offsetX, offsetZ } = useMemo(() => {
    const box = new Box3().setFromObject(scene)
    const size = box.getSize(new Vector3())
    const s = height / size.y
    const center = box.getCenter(new Vector3())
    return { scale: s, offsetY: -box.min.y * s, offsetX: -center.x * s, offsetZ: -center.z * s }
  }, [scene, height])

  const root = useRef()
  const clips = useMemo(() => animations.map((c) => (c.name.startsWith('throw') ? upperBodyOnly(c) : inPlace(c.clone()))), [animations])
  const { actions } = useAnimations(clips, root)
  const playing = useRef(null)
  const lastShot = useRef(null)
  useFrame(() => {
    if (!anim?.current) return
    const { name, speed = 1, shot } = anim.current

    if (shot && shot.id !== lastShot.current && actions[shot.name]) {
      lastShot.current = shot.id
      const a = actions[shot.name]
      a.reset()
      a.setLoop(LoopOnce, 1)
      a.time = shot.start ?? 0
      a.timeScale = shot.speed ?? 1
      a.weight = SHOT_WEIGHT
      a.fadingOut = false
      a.fadeIn(0.05).play()
    }
    if (shot && actions[shot.name]) {
      const a = actions[shot.name]
      const left = (a.getClip().duration - a.time) / a.timeScale
      if (a.isRunning() && left < FADE && !a.fadingOut) { a.fadeOut(FADE); a.fadingOut = true }
      if (!a.isRunning()) a.fadingOut = false
    }

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
export default function Model({ name, height, rotationY = 0, fallback = null, anim, decorate }) {
  return (
    <Suspense fallback={fallback}>
      <Fitted url={modelUrl(name)} height={height} rotationY={rotationY} anim={anim} decorate={decorate} />
    </Suspense>
  )
}
