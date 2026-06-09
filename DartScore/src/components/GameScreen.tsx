import { useState } from 'react'
import type { DartThrowInput, GameState } from '../types/game'
import { Dartboard } from './Dartboard'

interface GameScreenProps {
  gameState: GameState
  onThrow: (throwInput: DartThrowInput) => void
  onReplaceDart: (dartId: string, throwInput: DartThrowInput) => void
  onUndo: () => void
  onEndTurn: () => void
  onNewGame: () => void
}

export function GameScreen({
  gameState,
  onThrow,
  onReplaceDart,
  onUndo,
  onEndTurn,
  onNewGame,
}: GameScreenProps) {
  const [editingDartId, setEditingDartId] = useState<string | null>(null)
  const modeLabel =
    gameState.mode.type === 'x01'
      ? `${gameState.mode.startingScore} - ${gameState.mode.finishRule === 'double-out' ? 'Double-out' : 'Normal finish'}`
      : `Free Scoring - First to ${gameState.mode.targetScore}`
  const scoreLabel = gameState.mode.type === 'x01' ? 'Remaining' : 'Score'
  const nextDartNumber = Math.min(gameState.turn.darts.length + 1, 3)
  const canPlaceNewDart =
    gameState.status === 'in_progress' &&
    !gameState.turn.isComplete &&
    gameState.turn.darts.length < 3
  const actionLabel = gameState.turn.isComplete ? 'Next Player' : 'End Turn'

  const handleConfirmThrow = (
    throwInput: DartThrowInput,
    dartId: string | null,
  ) => {
    if (dartId) {
      onReplaceDart(dartId, throwInput)
      setEditingDartId(null)
      return
    }

    onThrow(throwInput)
  }

  const handleEndTurn = () => {
    setEditingDartId(null)
    onEndTurn()
  }

  return (
    <section className="screen game-screen">
      <div className="game-layout">
        <div className="match-board-column">
          <header className="match-summary panel">
            <div className="score-strip" aria-label="Player scores">
              {gameState.players.map((player, index) => (
                <article
                  className={index === gameState.currentPlayerIndex ? 'score-chip is-current' : 'score-chip'}
                  key={player.id}
                >
                  <span>{index === gameState.currentPlayerIndex ? 'Throwing' : 'Waiting'}</span>
                  <strong>{player.name}</strong>
                  <b>{player.score}</b>
                </article>
              ))}
            </div>

            <p className="match-meta">
              <span>{modeLabel}</span>
              <strong>{scoreLabel} - Dart {nextDartNumber} of 3</strong>
            </p>
          </header>

          <Dartboard
            canPlaceNewDart={canPlaceNewDart}
            editingDartId={editingDartId}
            markers={gameState.turn.darts}
            onCancelEdit={() => setEditingDartId(null)}
            onConfirmThrow={handleConfirmThrow}
            onSelectDart={setEditingDartId}
          />
        </div>

        <aside className="match-actions-bar">
          {gameState.statusMessage && (
            <div className="status-banner" aria-live="polite">
              {gameState.statusMessage}
            </div>
          )}

          <div className="action-button-row">
            <button
              className="button"
              type="button"
              onClick={onUndo}
              disabled={gameState.undoStack.length === 0}
            >
              Undo
            </button>
            <button
              className="button button--accent"
              type="button"
              onClick={handleEndTurn}
              disabled={gameState.turn.darts.length === 0}
            >
              {actionLabel}
            </button>
            <button
              className="button button--danger"
              type="button"
              onClick={onNewGame}
            >
              New
            </button>
          </div>
        </aside>
      </div>
    </section>
  )
}
