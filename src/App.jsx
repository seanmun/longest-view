import { useState } from 'react'
import GameCanvas from './components/GameCanvas.jsx'
import HUD from './components/HUD.jsx'
import DialogueBox from './components/DialogueBox.jsx'
import MNSPromo from './components/MNSPromo.jsx'
import PauseMenu from './components/PauseMenu.jsx'
import LevelCompleteScreen from './components/LevelCompleteScreen.jsx'
import VolumeControl from './components/VolumeControl.jsx'
import MobileControls from './components/MobileControls.jsx'
import CharacterDesignPage from './components/CharacterDesignPage.jsx'
import PixelEditor from './components/PixelEditor.jsx'

export default function App() {
  const [game, setGame] = useState(null)

  // Path-based routing
  if (window.location.pathname === '/design') return <CharacterDesignPage />
  if (window.location.pathname === '/editor') return <PixelEditor />

  const gameContent = (
    <div className="crt-bezel" style={{ width: '100%', maxWidth: '1200px' }}>
      <div className="crt-screen relative bg-black overflow-hidden"
        style={{ width: '100%', aspectRatio: '4 / 3' }}>
        {/* Game canvas */}
        <GameCanvas onGameReady={setGame} />

        {/* React overlays — positioned relative to game area */}
        {game && (
          <>
            <HUD game={game} />
            <DialogueBox game={game} />
            <MNSPromo game={game} />
            <PauseMenu game={game} />
            <LevelCompleteScreen game={game} />
          </>
        )}

        {/* Volume control */}
        <VolumeControl />

        {/* CRT effects stack */}
        <div className="crt-vignette" />
        <div className="crt-glass" />
        <div className="scanlines" />
      </div>
    </div>
  )

  return (
    <div className="w-screen h-screen bg-black flex items-center justify-center">
      <MobileControls>
        {gameContent}
      </MobileControls>
    </div>
  )
}
