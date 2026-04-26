import type { DartThrowInput, GameState } from '../types/game'
import { CurrentTurn } from './CurrentTurn'
import { Dartboard } from './Dartboard'
import { Scoreboard } from './Scoreboard'

interface GameScreenProps {
  gameState: GameState
  onThrow: (throwInput: DartThrowInput) => void
  onUndo: () => void
  onEndTurn: () => void
  onNewGame: () => void
}

export function GameScreen({
  gameState,
  onThrow,
  onUndo,
  onEndTurn,
  onNewGame,
}: GameScreenProps) {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex]
  const modeLabel =
    gameState.mode.type === 'x01'
      ? `${gameState.mode.startingScore} - ${gameState.mode.finishRule === 'double-out' ? 'Double-out' : 'Normal finish'}`
      : `Free Scoring - First to ${gameState.mode.targetScore}`
  const scoreLabel = gameState.mode.type === 'x01' ? 'Remaining' : 'Score'

  return (
    <section className="screen game-screen">
      <header className="hero-strip panel">
        <div>
          <span className="eyebrow">Current player</span>
          <h1>{currentPlayer.name}</h1>
          <p>{modeLabel}</p>
        </div>

        <div className="hero-score">
          <span>{scoreLabel}</span>
          <strong>{currentPlayer.score}</strong>
          <small>Dart {Math.min(gameState.turn.darts.length + 1, 3)} of 3</small>
        </div>
      </header>

      {gameState.statusMessage && (
        <div className="status-banner panel">{gameState.statusMessage}</div>
      )}

      <div className="game-grid">
        <Dartboard markers={gameState.turn.darts} onThrow={onThrow} />

        <aside className="side-rail">
          <CurrentTurn turn={gameState.turn} />

          <section className="panel control-panel">
            <div className="section-heading">
              <span className="eyebrow">Controls</span>
              <h2>Turn actions</h2>
            </div>

            <button
              className="button"
              type="button"
              onClick={onUndo}
              disabled={gameState.undoStack.length === 0}
            >
              Undo Last Dart
            </button>
            <button
              className="button"
              type="button"
              onClick={onEndTurn}
              disabled={gameState.turn.darts.length === 0}
            >
              End Turn
            </button>
            <button
              className="button button--ghost"
              type="button"
              onClick={onNewGame}
            >
              New Game
            </button>
          </section>

          <Scoreboard
            currentPlayerIndex={gameState.currentPlayerIndex}
            modeLabel={modeLabel}
            players={gameState.players}
            winnerId={gameState.winnerId}
          />
        </aside>
      </div>
    </section>
  )
}
