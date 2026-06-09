import type { TurnState } from '../types/game'

interface CurrentTurnProps {
  editable?: boolean
  onEditDart?: (dartId: string) => void
  selectedDartId?: string | null
  turn: TurnState
}

export function CurrentTurn({
  editable = false,
  onEditDart,
  selectedDartId = null,
  turn,
}: CurrentTurnProps) {
  return (
    <section className="panel">
      <div className="section-heading">
        <span className="eyebrow">Current turn</span>
        <h2>{turn.isComplete ? 'Review darts' : 'Up to 3 darts'}</h2>
      </div>

      <div className="turn-list">
        {[0, 1, 2].map((index) => {
          const dart = turn.darts[index]
          const rowClassName =
            dart?.id === selectedDartId ? 'turn-row is-selected' : 'turn-row'

          return (
            <button
              className={rowClassName}
              key={`dart-${index + 1}`}
              type="button"
              onClick={() => {
                if (dart && editable) {
                  onEditDart?.(dart.id)
                }
              }}
              disabled={!dart || !editable}
            >
              <span>Dart {index + 1}</span>
              <strong>{dart ? `${dart.hit.label} = ${dart.score}` : 'Waiting'}</strong>
            </button>
          )
        })}
      </div>

      <div className="turn-total">
        <span>Turn total</span>
        <strong>{turn.turnTotal}</strong>
      </div>

      {turn.isBust && (
        <div className="turn-note is-danger">Bust - score returns to {turn.startingScore}</div>
      )}
    </section>
  )
}
