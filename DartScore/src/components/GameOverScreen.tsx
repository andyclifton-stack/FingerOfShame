import { useState } from 'react'
import { formatShortModeLabel } from '../logic/gameModePresentation'
import type { GameState } from '../types/game'
import { Scoreboard } from './Scoreboard'

interface GameOverScreenProps {
  gameState: GameState
  onNewGame: () => void
  onUndo: () => void
}

type GameOverConfirmation = 'new' | 'undo'

export function GameOverScreen({
  gameState,
  onNewGame,
  onUndo,
}: GameOverScreenProps) {
  const [confirmationAction, setConfirmationAction] =
    useState<GameOverConfirmation | null>(null)
  const winner = gameState.players.find(
    (player) => player.id === gameState.winnerId,
  )
  const modeLabel = formatShortModeLabel(gameState.mode)
  const confirmationCopy =
    confirmationAction === 'new'
      ? { confirmLabel: 'New game', title: 'Start a new game?' }
      : { confirmLabel: 'Undo', title: 'Undo last dart?' }

  const handleConfirmAction = () => {
    if (confirmationAction === 'new') {
      onNewGame()
    }

    if (confirmationAction === 'undo') {
      onUndo()
    }

    setConfirmationAction(null)
  }

  return (
    <section className="screen game-over-screen">
      <div className="hero-card panel">
        <span className="eyebrow">Game over</span>
        <h1>{winner ? `${winner.name} wins` : 'Match complete'}</h1>
        <p>{gameState.statusMessage ?? 'The game has finished.'}</p>

        {confirmationAction ? (
          <div className="confirm-action game-over-confirm-action" role="alertdialog" aria-live="assertive">
            <strong>{confirmationCopy.title}</strong>
            <button
              className="button button--quiet button--compact"
              type="button"
              onClick={() => setConfirmationAction(null)}
            >
              Cancel
            </button>
            <button
              className={
                confirmationAction === 'new'
                  ? 'button button--danger button--compact'
                  : 'button button--accent button--compact'
              }
              type="button"
              onClick={handleConfirmAction}
            >
              {confirmationCopy.confirmLabel}
            </button>
          </div>
        ) : (
          <>
            <button
              className="button button--quiet button--large"
              type="button"
              onClick={() => setConfirmationAction('new')}
            >
              Start New Game
            </button>
            <button
              className="button button--quiet button--large"
              type="button"
              onClick={() => setConfirmationAction('undo')}
              disabled={gameState.undoStack.length === 0}
            >
              Undo Last Dart
            </button>
          </>
        )}
      </div>

      <Scoreboard
        currentPlayerIndex={gameState.currentPlayerIndex}
        mode={gameState.mode}
        modeLabel={modeLabel}
        players={gameState.players}
        winnerId={gameState.winnerId}
      />
    </section>
  )
}
