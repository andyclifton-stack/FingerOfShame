import type { TurnState } from '../types/game'

interface CurrentTurnProps {
  turn: TurnState
}

export function CurrentTurn({ turn }: CurrentTurnProps) {
  return (
    <section className="panel">
      <div className="section-heading">
        <span className="eyebrow">Current turn</span>
        <h2>Up to 3 darts</h2>
      </div>

      <div className="turn-list">
        {[0, 1, 2].map((index) => {
          const dart = turn.darts[index]

          return (
            <div className="turn-row" key={`dart-${index + 1}`}>
              <span>Dart {index + 1}</span>
              <strong>{dart ? `${dart.hit.label} = ${dart.score}` : 'Waiting'}</strong>
            </div>
          )
        })}
      </div>

      <div className="turn-total">
        <span>Turn total</span>
        <strong>{turn.turnTotal}</strong>
      </div>
    </section>
  )
}
