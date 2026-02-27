import { useState } from 'react'
import GameCanvas from './components/GameCanvas.jsx'
import HUD from './components/HUD.jsx'
import DialogueBox from './components/DialogueBox.jsx'
import MNSPromo from './components/MNSPromo.jsx'
import PauseMenu from './components/PauseMenu.jsx'
import VolumeControl from './components/VolumeControl.jsx'
import MobileControls from './components/MobileControls.jsx'

export default function App() {
  const [game, setGame] = useState(null)

  const gameContent = (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
      {/* Game canvas */}
      <GameCanvas onGameReady={setGame} />

      {/* React overlays */}
      {game && (
        <>
          <HUD game={game} />
          <DialogueBox game={game} />
          <MNSPromo game={game} />
          <PauseMenu game={game} />
        </>
      )}

      {/* Volume control (desktop only — mobile has shell buttons) */}
      <VolumeControl />

      {/* CRT Scanline overlay */}
      <div className="scanlines" />
    </div>
  )

  return (
    <MobileControls>
      {gameContent}
    </MobileControls>
  )
}
