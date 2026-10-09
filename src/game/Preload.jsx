// Holds the whole scene back until every model is downloaded, so placeholder
// shapes never flash on screen. Lives inside the scene's Suspense boundary:
// useGLTF suspends that boundary until all files are in.
import { useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import { modelUrl } from './Model.jsx'
import { PEOPLE, MOB } from './level1.js'
import { setState } from './state.js'

const MODELS = [...new Set([
  'hinkie', 'trash-can', 'hot-dog-cart', 'duo',
  ...PEOPLE.map((p) => p.model),
  ...MOB.map((m) => m.model),
].filter(Boolean))]

export default function Preload() {
  useGLTF(MODELS.map(modelUrl))
  useEffect(() => { setState({ loaded: true }) }, [])
  return null
}
