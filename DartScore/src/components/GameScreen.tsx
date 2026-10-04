import { useRef, useState, type ReactNode } from "react";
import { formatModeLabel, formatPlayerValue, formatScoreLabel } from "../logic/gameModePresentation";
import { checkoutRoute } from "../logic/matchTools";
import type { Preferences } from "../logic/storage";
import type { DartThrowInput, GameState } from "../types/game";
import { Dartboard } from "./Dartboard";
import { ButtonInput, TotalInput } from "./ScoringInput";
import { MatchStats, RecentVisits } from "./MatchInsights";
interface Props {
  appNavigation: ReactNode;
  gameState: GameState;
  preferences: Preferences;
  onInput: (input: Preferences["input"]) => void;
  onThrow: (input: DartThrowInput) => void;
  onReplaceDart: (id: string, input: DartThrowInput) => void;
  onUndo: () => void;
  onEndTurn: () => void;
  onNewGame: () => void;
  onVisit: (total: number, darts: number, finish?: number) => string | null;
}
export function GameScreen({ appNavigation, gameState: s, preferences, onInput, onThrow, onReplaceDart, onUndo, onEndTurn, onNewGame, onVisit }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [confirmNew, setConfirmNew] = useState(false);
  const [feedback, setFeedback] = useState("");
  const menu = useRef<HTMLDialogElement>(null);
  const input = preferences.input === "total" && s.mode.type !== "x01" ? "buttons" : preferences.input;
  const player = s.players[s.currentPlayerIndex];
  const canPlace = !s.turn.isComplete && s.turn.darts.length < 3 && s.turn.visitScore === undefined;
  const route = s.mode.type === "x01" && !s.turn.isComplete ? checkoutRoute(player.score, 3 - s.turn.darts.length, s.mode.finishRule) : null;
  function confirmDart(dart: DartThrowInput, dartId = editing) {
    if (dartId) { onReplaceDart(dartId, dart); setEditing(null); }
    else onThrow(dart);
    setFeedback("");
  }
  function undo() { onUndo(); setEditing(null); setFeedback("Last scoring action undone."); }
  const turnLabel = editing ? "Editing dart" : s.turn.isBust ? "Bust" : s.turn.isComplete ? "Visit complete" : `Dart ${s.turn.darts.length + 1} of 3`;
  return (
    <section className="game-screen board-first">
      <header className="play-topline">
        <div className="play-scores" aria-label="Player scores">
          {s.players.map((p, i) => (
            <div className={`play-score ${i === s.currentPlayerIndex ? "is-current" : ""}`} key={p.id}
              aria-current={i === s.currentPlayerIndex ? "true" : undefined}
              aria-label={`${p.name}, ${formatScoreLabel(s.mode)} ${formatPlayerValue(p, s.mode)}${i === s.currentPlayerIndex ? ', throwing' : ''}`}>
              <span title={p.name}>{p.name}</span><strong>{formatPlayerValue(p, s.mode)}</strong>
            </div>
          ))}
        </div>
        <button className="play-menu-button" onClick={() => { setConfirmNew(false); menu.current?.showModal(); }} aria-label="Match menu">•••</button>
      </header>
      <div className="play-context" aria-live="polite">
        <span>{player.name} · {turnLabel}</span>
        {route ? <span className="play-checkout">{route.map(hit => hit.label === "50" ? "Bull" : hit.label).join(" → ")}</span>
          : s.mode.type === "round-clock" ? <span>Aim for {player.score}</span>
          : s.mode.type === "killer" ? <span>{player.killerIsActive ? "Killer" : "Aim"} · D{player.killerTarget}</span> : null}
      </div>
      <div className="play-board">
        {input === "board" ? (
          <Dartboard key={`${s.turn.turnIndex}-${s.turn.darts.length}-${editing}`} canPlaceNewDart={canPlace} editingDartId={editing}
            markers={s.turn.darts} suggestedHit={route?.[0]} onCancelEdit={() => setEditing(null)} onConfirmThrow={confirmDart} onSelectDart={setEditing} />
        ) : input === "buttons" ? (
          <ButtonInput key={`${s.turn.turnIndex}-${editing}`} state={s} editing={!!editing} onThrow={(dart) => confirmDart(dart)} onVisit={onVisit} />
        ) : (
          <TotalInput key={s.turn.turnIndex} state={s} editing={false} onThrow={(dart) => confirmDart(dart)} onVisit={onVisit} />
        )}
      </div>
      <footer className="play-footer">
        <div className="play-visit" aria-label="Current visit">
          <div className="play-darts">
            {s.turn.visitScore !== undefined ? <span className="play-total">{s.turn.dartsUsed} darts · total entry</span> : [0, 1, 2].map(i => {
              const dart = s.turn.darts[i];
              return <button key={i} disabled={!dart} className={dart?.id === editing ? "is-active" : ""}
                aria-label={dart ? `Edit dart ${i + 1}: ${dart.hit.label}, ${dart.score} points` : `Dart ${i + 1} waiting`}
                onClick={() => { setEditing(dart!.id); if (input === "total") onInput("board"); }}>
                <span>{i + 1}</span><strong>{dart?.hit.label ?? "—"}</strong>
              </button>;
            })}
          </div>
          <span className="play-total">{s.turn.isBust ? "Bust" : `Visit ${s.turn.turnTotal}`}</span>
        </div>
        <div className="play-turn-actions">
          <button className="button button--quiet" onClick={undo} disabled={!s.undoStack.length}>Undo</button>
          <button className="button button--accent" disabled={!s.turn.darts.length && s.turn.visitScore === undefined}
            onClick={() => { onEndTurn(); setEditing(null); setFeedback(""); }}>
            {s.turn.isComplete ? "Next player →" : "End turn →"}
          </button>
        </div>
        <span className="visually-hidden" role="status">{feedback}</span>
      </footer>
      <dialog className="match-menu" ref={menu} aria-labelledby="match-menu-title">
        <div className="match-menu-heading"><h2 id="match-menu-title">Match menu</h2><button className="button" onClick={() => menu.current?.close()} autoFocus>Back to board</button></div>
        {appNavigation}
        <p className="hint">{formatModeLabel(s.mode)}{s.match && s.match.bestOf > 1 ? ` · Leg ${s.match.leg}, best of ${s.match.bestOf}` : ""}</p>
        <div className="input-tabs" aria-label="Scoring method">
          {(["board", "buttons", ...(s.mode.type === "x01" ? ["total"] : [])] as Preferences["input"][]).map(method => (
            <button key={method} aria-pressed={input === method} className={input === method ? "is-active" : ""}
              disabled={method === "total" && (!!s.turn.darts.length || !!editing)}
              onClick={() => { onInput(method); setEditing(null); menu.current?.close(); }}>
              {method === "board" ? "Dartboard" : method === "buttons" ? "Buttons" : "Visit total"}
            </button>
          ))}
        </div>
        <p className="hint">Tap the board where your dart landed, then confirm. Tap a recorded dart or its numbered marker to correct it. Swiping never places a dart.</p>
        <MatchStats state={s} />
        <RecentVisits state={s} />
        {confirmNew ? <div className="confirm-action" role="group" aria-label="Confirm new game">
          <strong>Leave this game?</strong><button className="button" onClick={() => setConfirmNew(false)}>Cancel</button>
          <button className="button button--danger" onClick={onNewGame}>New game</button>
        </div> : <button className="button button--quiet" onClick={() => setConfirmNew(true)}>New game</button>}
      </dialog>
    </section>
  );
}
