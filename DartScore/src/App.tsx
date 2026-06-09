import { useEffect, useState } from 'react'
import { GameOverScreen } from './components/GameOverScreen'
import { GameScreen } from './components/GameScreen'
import { StartScreen } from './components/StartScreen'
import {
  applyDartThrow,
  createGame,
  endTurn,
  replaceTurnDart,
  undoLastDart,
} from './logic/gameEngine'
import {
  clearSavedGame,
  loadSavedGame,
  saveGame,
} from './logic/storage'
import type { CreateGameInput, DartThrowInput, GameState } from './types/game'

function App() {
  const [savedGame, setSavedGame] = useState<GameState | null>(() =>
    loadSavedGame(),
  )
  const [gameState, setGameState] = useState<GameState | null>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [gameState?.status, gameState?.turn.turnIndex])

  const commitGameState = (nextGameState: GameState | null) => {
    if (!nextGameState) {
      clearSavedGame()
      setSavedGame(null)
      setGameState(null)
      return
    }

    if (nextGameState.status === 'in_progress') {
      saveGame(nextGameState)
      setSavedGame(nextGameState)
    } else {
      clearSavedGame()
      setSavedGame(null)
    }

    setGameState(nextGameState)
  }

  const handleStartGame = (config: CreateGameInput) => {
    commitGameState(createGame(config))
  }

  const handleResumeGame = () => {
    if (!savedGame) {
      return
    }

    setGameState(savedGame)
  }

  const handleThrow = (throwInput: DartThrowInput) => {
    if (!gameState) {
      return
    }

    commitGameState(applyDartThrow(gameState, throwInput))
  }

  const handleReplaceDart = (dartId: string, throwInput: DartThrowInput) => {
    if (!gameState) {
      return
    }

    commitGameState(replaceTurnDart(gameState, dartId, throwInput))
  }

  const handleUndo = () => {
    if (!gameState) {
      return
    }

    commitGameState(undoLastDart(gameState))
  }

  const handleEndTurn = () => {
    if (!gameState) {
      return
    }

    commitGameState(endTurn(gameState))
  }

  const handleReturnToStart = () => {
    commitGameState(null)
  }

  return (
    <div className="app-shell">
      <div className="app-backdrop"></div>
      <main className="app-frame">
        {!gameState && (
          <StartScreen
            savedGame={savedGame}
            onResumeGame={handleResumeGame}
            onStartGame={handleStartGame}
          />
        )}

        {gameState?.status === 'in_progress' && (
          <GameScreen
            gameState={gameState}
            onEndTurn={handleEndTurn}
            onNewGame={handleReturnToStart}
            onReplaceDart={handleReplaceDart}
            onThrow={handleThrow}
            onUndo={handleUndo}
          />
        )}

        {gameState?.status === 'game_over' && (
          <GameOverScreen
            gameState={gameState}
            onNewGame={handleReturnToStart}
            onUndo={handleUndo}
          />
        )}
      </main>
    </div>
  )
}

export default App
