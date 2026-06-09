import {
  formatPlayerStatus,
  formatPlayerValue,
  formatScoreboardDetail,
} from '../logic/gameModePresentation'
import type { GameMode, Player } from '../types/game'

interface ScoreboardProps {
  players: Player[]
  currentPlayerIndex: number
  winnerId: string | null
  modeLabel: string
  mode: GameMode
}

export function Scoreboard({
  players,
  currentPlayerIndex,
  winnerId,
  modeLabel,
  mode,
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
                {formatPlayerStatus(
                  player,
                  mode,
                  index === currentPlayerIndex,
                  winnerId === player.id,
                )}
              </span>
              <strong>{player.name}</strong>
              <small>{formatScoreboardDetail(player, mode)}</small>
            </div>
            <span className="score-card__value">
              {formatPlayerValue(player, mode)}
            </span>
          </article>
        ))}
      </div>
    </section>
  )
}
