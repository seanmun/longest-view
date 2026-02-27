import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import { createGameConfig } from '../game/config.js'

export default function GameCanvas({ onGameReady }) {
  const gameRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (gameRef.current) return

    const config = createGameConfig(containerRef.current)
    const game = new Phaser.Game(config)
    gameRef.current = game

    if (onGameReady) onGameReady(game)

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true)
        gameRef.current = null
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      id="game-container"
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    />
  )
}
