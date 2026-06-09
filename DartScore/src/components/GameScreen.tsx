import { useState } from 'react'
import type { DartThrowInput, GameState } from '../types/game'
import { CurrentTurn } from './CurrentTurn'
import { Dartboard } from './Dartboard'
import { Scoreboard } from './Scoreboard'

type DrawerTab = 'turn' | 'scores' | 'actions'

interface GameScreenProps {
  gameState: GameState
  onThrow: (throwInput: DartThrowInput) => void
  onReplaceDart: (dartId: string, throwInput: DartThrowInput) => void
  onUndo: () => void
  onEndTurn: () => void
  onNewGame: () => void
}

const DRAWER_TABS: Array<{ id: DrawerTab; label: string }> = [
  { id: 'turn', label: 'Turn' },
  { id: 'scores', label: 'Scores' },
  { id: 'actions', label: 'Actions' },
]

export function GameScreen({
  gameState,
  onThrow,
  onReplaceDart,
  onUndo,
  onEndTurn,
  onNewGame,
}: GameScreenProps) {
  const [activeDrawerTab, setActiveDrawerTab] = useState<DrawerTab>('turn')
  const [editingDartId, setEditingDartId] = useState<string | null>(null)
  const currentPlayer = gameState.players[gameState.currentPlayerIndex]
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
            <div>
              <span className="eyebrow">Current player</span>
              <h1>{currentPlayer.name}</h1>
              <p>{modeLabel}</p>
            </div>

            <div className="match-score">
              <span>{scoreLabel}</span>
              <strong>{currentPlayer.score}</strong>
              <small>Dart {nextDartNumber} of 3</small>
            </div>
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

        <aside className="side-rail match-drawer">
          <div className="drawer-tabs" role="tablist" aria-label="Match panels">
            {DRAWER_TABS.map((tab) => (
              <button
                aria-selected={activeDrawerTab === tab.id}
                className={activeDrawerTab === tab.id ? 'drawer-tab is-active' : 'drawer-tab'}
                key={tab.id}
                role="tab"
                type="button"
                onClick={() => setActiveDrawerTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="drawer-content">
            {gameState.statusMessage && (
              <div className="status-banner panel" aria-live="polite">
                {gameState.statusMessage}
              </div>
            )}

            {activeDrawerTab === 'turn' && (
              <CurrentTurn
                editable={gameState.turn.darts.length > 0}
                onEditDart={setEditingDartId}
                selectedDartId={editingDartId}
                turn={gameState.turn}
              />
            )}

            {activeDrawerTab === 'scores' && (
              <Scoreboard
                currentPlayerIndex={gameState.currentPlayerIndex}
                modeLabel={modeLabel}
                players={gameState.players}
                winnerId={gameState.winnerId}
              />
            )}

            {activeDrawerTab === 'actions' && (
              <section className="panel control-panel">
                <div className="section-heading">
                  <span className="eyebrow">Controls</span>
                  <h2>Match actions</h2>
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
                  New Game
                </button>
              </section>
            )}
          </div>
        </aside>
      </div>
    </section>
  )
}
