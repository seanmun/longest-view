import { useState, useEffect, useRef } from 'react'
import { AudioSystem } from '../game/systems/AudioSystem.js'

export default function PauseMenu({ game }) {
  const [paused, setPaused] = useState(false)
  const pausedRef = useRef(false)
  const pausedSceneRef = useRef(null)

  useEffect(() => {
    if (!game) return

    const handleKey = (e) => {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        togglePause()
      }
    }

    const togglePause = () => {
      AudioSystem.playPause()

      if (pausedRef.current) {
        // Unpause
        if (pausedSceneRef.current) {
          game.scene.resume(pausedSceneRef.current)
        }
        pausedRef.current = false
        pausedSceneRef.current = null
        setPaused(false)
      } else {
        // Find the active gameplay scene to pause
        const allScenes = game.scene.scenes
        const gameplayScene = allScenes.find(s =>
          game.scene.isActive(s.scene.key) &&
          (s.scene.key.startsWith('Level'))
        )
        if (!gameplayScene) return

        game.scene.pause(gameplayScene.scene.key)
        pausedRef.current = true
        pausedSceneRef.current = gameplayScene.scene.key
        setPaused(true)
      }
    }

    // Store togglePause on the component so the button can call it
    window.__togglePause = togglePause

    const handleSelect = () => togglePause()

    window.addEventListener('keydown', handleKey)
    window.addEventListener('game-select', handleSelect)
    return () => {
      window.removeEventListener('keydown', handleKey)
      window.removeEventListener('game-select', handleSelect)
      delete window.__togglePause
    }
  }, [game])

  if (!paused) return null

  return (
    <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/80 pointer-events-auto"
      style={{ fontFamily: '"Press Start 2P", monospace' }}>
      <div className="text-center">
        <div className="text-[24px] mb-8" style={{ color: '#E8B800' }}>
          PAUSED
        </div>

        <button
          onClick={() => window.__togglePause?.()}
          className="block mx-auto text-[14px] mb-4 px-6 py-3 border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black transition-colors cursor-pointer"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          RESUME
        </button>

        <div className="text-[10px] text-gray-500 mt-6">
          PRESS ESC OR P TO RESUME
        </div>
      </div>
    </div>
  )
}
