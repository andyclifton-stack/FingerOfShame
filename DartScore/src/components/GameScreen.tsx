import { useState } from 'react'
import {
  formatModeLabel,
  formatPlayerStatus,
  formatPlayerValue,
  formatScoreLabel,
} from '../logic/gameModePresentation'
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

type ConfirmationAction = 'undo' | 'new'

export function GameScreen({
  gameState,
  onThrow,
  onReplaceDart,
  onUndo,
  onEndTurn,
  onNewGame,
}: GameScreenProps) {
  const [editingDartId, setEditingDartId] = useState<string | null>(null)
  const [confirmationAction, setConfirmationAction] =
    useState<ConfirmationAction | null>(null)
  const modeLabel = formatModeLabel(gameState.mode)
  const scoreLabel = formatScoreLabel(gameState.mode)
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
    setConfirmationAction(null)
    onEndTurn()
  }

  const handleConfirmAction = () => {
    if (confirmationAction === 'undo') {
      onUndo()
    }

    if (confirmationAction === 'new') {
      onNewGame()
    }

    setConfirmationAction(null)
  }

  const confirmationCopy =
    confirmationAction === 'new'
      ? { confirmLabel: 'New game', title: 'Start a new game?' }
      : { confirmLabel: 'Undo', title: 'Undo last dart?' }

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
                  <span>
                    {formatPlayerStatus(
                      player,
                      gameState.mode,
                      index === gameState.currentPlayerIndex,
                    )}
                  </span>
                  <strong>{player.name}</strong>
                  <b>{formatPlayerValue(player, gameState.mode)}</b>
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
          {confirmationAction ? (
            <div className="confirm-action" role="alertdialog" aria-live="assertive">
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
              {gameState.statusMessage && (
                <div className="status-banner" aria-live="polite">
                  {gameState.statusMessage}
                </div>
              )}

              <div className="action-button-row">
                <button
                  className="button button--quiet"
                  type="button"
                  onClick={() => setConfirmationAction('undo')}
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
                  className="button button--quiet button--danger-quiet"
                  type="button"
                  onClick={() => setConfirmationAction('new')}
                >
                  New
                </button>
              </div>
            </>
          )}
        </aside>
      </div>
    </section>
  )
}
