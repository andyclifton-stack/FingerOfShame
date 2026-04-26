import type { GameState } from '../types/game'
import { Scoreboard } from './Scoreboard'

interface GameOverScreenProps {
  gameState: GameState
  onNewGame: () => void
}

export function GameOverScreen({
  gameState,
  onNewGame,
}: GameOverScreenProps) {
  const winner = gameState.players.find(
    (player) => player.id === gameState.winnerId,
  )
  const modeLabel =
    gameState.mode.type === 'x01'
      ? `${gameState.mode.startingScore} finish`
      : `Free Scoring to ${gameState.mode.targetScore}`

  return (
    <section className="screen game-over-screen">
      <div className="hero-card panel">
        <span className="eyebrow">Game over</span>
        <h1>{winner ? `${winner.name} wins` : 'Match complete'}</h1>
        <p>{gameState.statusMessage ?? 'The game has finished.'}</p>

        <button
          className="button button--accent button--large"
          type="button"
          onClick={onNewGame}
        >
          Start New Game
        </button>
      </div>

      <Scoreboard
        currentPlayerIndex={gameState.currentPlayerIndex}
        modeLabel={modeLabel}
        players={gameState.players}
        winnerId={gameState.winnerId}
      />
    </section>
  )
}
