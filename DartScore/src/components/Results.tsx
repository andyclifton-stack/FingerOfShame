import type { GameState } from "../types/game";
import { isMatchComplete } from "../logic/matchTools";
import { formatModeLabel } from "../logic/gameModePresentation";
import { MatchStats, RecentVisits } from "./MatchInsights";
interface Props {
  state: GameState;
  archived?: boolean;
  onNext: () => void;
  onRematch: () => void;
  onHome: () => void;
  onUndo: () => void;
}
export function Results({
  state: s,
  archived,
  onNext,
  onRematch,
  onHome,
  onUndo,
}: Props) {
  const complete = isMatchComplete(s);
  const winner = s.players.find((p) => p.id === s.winnerId);
  return (
    <section className="screen results-screen">
      <div className="panel result-hero">
        <span className="eyebrow">
          {complete ? "Match complete" : `Leg ${s.match?.leg ?? 1} complete`}
        </span>
        <div className="winner-mark" aria-hidden="true">
          ✦
        </div>
        <h1>
          {winner?.name ?? "Player"} wins{complete ? "" : " the leg"}.
        </h1>
        <p>{formatModeLabel(s.mode)}</p>
        {s.match && s.match.bestOf > 1 && (
          <div className="leg-results">
            {s.players.map((p) => (
              <div key={p.id}>
                <span>{p.name}</span>
                <strong>{s.match!.legsWon[p.id] ?? 0}</strong>
                <small>legs won</small>
              </div>
            ))}
          </div>
        )}
        <p className="hint">{s.statusMessage}</p>
        <div className="result-actions">
          {complete ? (
            <button className="button button--accent" onClick={onRematch}>
              Rematch · same players
            </button>
          ) : (
            <button className="button button--accent" onClick={onNext}>
              Start leg {(s.match?.leg ?? 1) + 1} →
            </button>
          )}
          <button className="button" onClick={onHome}>
            {archived ? "Back to history" : "Back to setup"}
          </button>
          {!archived && (
            <button
              className="text-button"
              disabled={!s.undoStack.length}
              onClick={onUndo}
            >
              Undo winning score
            </button>
          )}
        </div>
      </div>
      <MatchStats state={s} />
      <RecentVisits state={s} />
    </section>
  );
}
