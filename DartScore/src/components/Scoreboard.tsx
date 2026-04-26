import type { Player } from '../types/game'

interface ScoreboardProps {
  players: Player[]
  currentPlayerIndex: number
  winnerId: string | null
  modeLabel: string
}

export function Scoreboard({
  players,
  currentPlayerIndex,
  winnerId,
  modeLabel,
}: ScoreboardProps) {
  return (
    <section className="panel">
      <div className="section-heading">
        <span className="eyebrow">Scoreboard</span>
        <h2>{modeLabel}</h2>
      </div>

      <div className="score-list">
        {players.map((player, index) => (
          <article
            className={`score-card ${index === currentPlayerIndex ? 'is-current' : ''} ${winnerId === player.id ? 'is-winner' : ''}`}
            key={player.id}
          >
            <div>
              <span className="score-card__label">
                {winnerId === player.id
                  ? 'Winner'
                  : index === currentPlayerIndex
                    ? 'Throwing'
                    : 'Waiting'}
              </span>
              <strong>{player.name}</strong>
            </div>
            <span className="score-card__value">{player.score}</span>
          </article>
        ))}
      </div>
    </section>
  )
}
