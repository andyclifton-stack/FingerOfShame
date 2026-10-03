import { useRef, useState } from "react";
import {
  formatModeLabel,
  formatPlayerStatus,
  formatPlayerValue,
  formatScoreLabel,
} from "../logic/gameModePresentation";
import { checkoutRoute, playerStats } from "../logic/matchTools";
import type { Preferences } from "../logic/storage";
import type { DartThrowInput, GameState } from "../types/game";
import { Dartboard } from "./Dartboard";
import { ButtonInput, TotalInput } from "./ScoringInput";
import { MatchStats, RecentVisits } from "./MatchInsights";
interface Props {
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
export function GameScreen({
  gameState: s,
  preferences,
  onInput,
  onThrow,
  onReplaceDart,
  onUndo,
  onEndTurn,
  onNewGame,
  onVisit,
}: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [confirmNew, setConfirmNew] = useState(false);
  const [feedback, setFeedback] = useState("");
  const detailsRef = useRef<HTMLElement>(null);
  const swipeY = useRef<number | null>(null);
  const input =
    preferences.input === "total" && s.mode.type !== "x01"
      ? "buttons"
      : preferences.input;
  const player = s.players[s.currentPlayerIndex];
  const canPlace =
    !s.turn.isComplete &&
    s.turn.darts.length < 3 &&
    s.turn.visitScore === undefined;
  const route =
    s.mode.type === "x01" && !s.turn.isComplete
      ? checkoutRoute(player.score, 3 - s.turn.darts.length, s.mode.finishRule)
      : null;
  const stats = playerStats(s, player.id);
  function confirmDart(dart: DartThrowInput, dartId = editing) {
    if (dartId) {
      onReplaceDart(dartId, dart);
      setEditing(null);
    } else onThrow(dart);
    setFeedback("");
  }
  function undo() {
    onUndo();
    setEditing(null);
    setFeedback("Last scoring action undone.");
  }
  return (
    <section className="screen game-screen">
      <header className="match-summary panel">
        <div className="match-heading">
          <span className="eyebrow">
            {s.match && s.match.bestOf > 1
              ? `Leg ${s.match.leg} · Best of ${s.match.bestOf}`
              : "At the oche"}
          </span>
          <span className="mode-tag">{formatModeLabel(s.mode)}</span>
        </div>
        <div
          className={`score-strip players-${s.players.length}`}
          aria-label="Player scores"
        >
          {s.players.map((p, i) => (
            <article
              className={`score-chip ${i === s.currentPlayerIndex ? "is-current" : ""}`}
              key={p.id}
              aria-current={i === s.currentPlayerIndex ? "true" : undefined}
            >
              <span>
                {formatPlayerStatus(p, s.mode, i === s.currentPlayerIndex)}
              </span>
              <strong title={p.name}>{p.name}</strong>
              <b key={`${p.id}-${p.score}`}>{formatPlayerValue(p, s.mode)}</b>
              <small>
                {formatScoreLabel(s.mode)}
                {s.match && s.match.bestOf > 1
                  ? ` · ${s.match.legsWon[p.id] ?? 0} legs won`
                  : ""}
              </small>
            </article>
          ))}
        </div>
        <div className="match-meta">
          <span>{player.name}’s turn</span>
          <strong>
            {s.turn.isComplete
              ? "Review your visit"
              : `Dart ${s.turn.darts.length + 1} of 3`}
          </strong>
        </div>
      </header>
      <div className="game-layout">
        <div className="match-board-column"
          onTouchStart={(event) => {
            const target = event.target as Element;
            swipeY.current = input === "board" && event.touches.length === 1 && target.closest(".dartboard-panel") && !target.closest("button, summary") ? event.touches[0].clientY : null;
          }}
          onTouchMove={(event) => {
            const details = detailsRef.current;
            if (event.touches.length !== 1) { swipeY.current = null; return; }
            const y = event.touches[0].clientY;
            // Swipe the board to scroll details without moving the scoring surface.
            if (swipeY.current !== null && details && details.scrollHeight > details.clientHeight) details.scrollTop += swipeY.current - y;
            if (swipeY.current !== null) swipeY.current = y;
          }}
          onTouchEnd={() => { swipeY.current = null; }}
          onTouchCancel={() => { swipeY.current = null; }}
        >
          <div className="input-tabs" aria-label="Scoring method">
            {(
              [
                "board",
                "buttons",
                ...(s.mode.type === "x01" ? ["total"] : []),
              ] as Preferences["input"][]
            ).map((method) => (
              <button
                key={method}
                aria-pressed={input === method}
                disabled={
                  method === "total" && (!!s.turn.darts.length || !!editing)
                }
                className={input === method ? "is-active" : ""}
                onClick={() => {
                  onInput(method);
                  setEditing(null);
                }}
              >
                {method === "board"
                  ? "Dartboard"
                  : method === "buttons"
                    ? "Buttons"
                    : "Visit total"}
              </button>
            ))}
          </div>
          {editing && (
            <div className="editing-banner" role="status">
              Editing dart{" "}
              {s.turn.darts.find((d) => d.id === editing)?.dartIndex}
              <button className="text-button" onClick={() => setEditing(null)}>
                Cancel edit
              </button>
            </div>
          )}
          {input === "board" ? (
            <Dartboard
              key={`${s.turn.turnIndex}-${s.turn.darts.length}-${editing}`}
              canPlaceNewDart={canPlace}
              editingDartId={editing}
              markers={s.turn.darts}
              suggestedHit={route?.[0]}
              onCancelEdit={() => setEditing(null)}
              onConfirmThrow={confirmDart}
              onSelectDart={setEditing}
            />
          ) : input === "buttons" ? (
            <ButtonInput
              key={`${s.turn.turnIndex}-${editing}`}
              state={s}
              editing={!!editing}
              onThrow={(dart) => confirmDart(dart)}
              onVisit={onVisit}
            />
          ) : (
            <TotalInput
              key={s.turn.turnIndex}
              state={s}
              editing={false}
              onThrow={onThrow}
              onVisit={onVisit}
            />
          )}
        </div>
        <aside className="side-rail" ref={detailsRef}>
          <section
            className={`panel current-visit ${s.turn.isComplete && s.turn.turnTotal === 180 && !s.turn.isBust ? "celebrate" : ""}`}
            aria-label="Current visit"
          >
            <div className="visit-heading">
              <span className="eyebrow">
                {s.turn.isComplete ? "Visit complete" : "This visit"}
              </span>
              <strong>{s.turn.isBust ? "Bust" : s.turn.turnTotal}</strong>
            </div>
            {s.turn.visitScore !== undefined ? (
              <p className="hint">
                Visit total: {s.turn.visitScore} · {s.turn.dartsUsed} darts
                {s.turn.finishHit ? ` · ${s.turn.finishHit.label}` : ""}. Undo
                to correct.
              </p>
            ) : (
              <div className="dart-summary">
                {[0, 1, 2].map((i) => {
                  const dart = s.turn.darts[i];
                  return (
                    <button
                      key={i}
                      disabled={!dart}
                      aria-label={
                        dart
                          ? `Edit dart ${i + 1}: ${dart.hit.label}, ${dart.score} points`
                          : `Dart ${i + 1} waiting`
                      }
                      className={dart?.id === editing ? "is-active" : ""}
                      onClick={() => {
                        setEditing(dart!.id);
                        if (input === "total") onInput("buttons");
                      }}
                    >
                      <span>Dart {i + 1}</span>
                      <strong>{dart ? dart.hit.label : "—"}</strong>
                      <small>
                        {dart ? `${dart.score} pts · edit` : "Waiting"}
                      </small>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="visit-footer">
              <span>
                {s.mode.type === "x01" || s.mode.type === "free"
                  ? `${s.turn.startingScore} → ${player.score}`
                  : `Target ${player.score}`}
              </span>
              <small>
                {s.turn.isBust
                  ? `Score returns to ${s.turn.startingScore}`
                  : s.turn.isComplete
                    ? "Check your score, then pass the turn."
                    : "Tap any recorded dart to correct it."}
              </small>
            </div>
            {s.turn.isComplete &&
              s.turn.turnTotal === 180 &&
              !s.turn.isBust &&
              (s.mode.type === "x01" || s.mode.type === "free") && (
                <div className="milestone" role="status">
                  ONE HUNDRED AND EIGHTY!
                </div>
              )}
          </section>
          <div className="match-actions-bar">
            {confirmNew ? (
              <div
                className="confirm-action"
                role="group"
                aria-label="Confirm new game"
              >
                <strong>Leave this game?</strong>
                <button className="button" onClick={() => setConfirmNew(false)}>
                  Cancel
                </button>
                <button className="button button--danger" onClick={onNewGame}>
                  New game
                </button>
              </div>
            ) : (
              <>
                <p className="action-feedback" role="status">
                  {feedback ||
                    (s.turn.isBust
                      ? `Bust · ${player.score} remaining`
                      : s.turn.isComplete
                        ? `${player.name} scored ${s.turn.turnTotal}.`
                        : "")}
                </p>
                <div className="action-button-row">
                  <button
                    className="button button--quiet"
                    onClick={undo}
                    disabled={!s.undoStack.length}
                  >
                    Undo
                  </button>
                  <button
                    className="button button--accent"
                    onClick={() => {
                      onEndTurn();
                      setEditing(null);
                      setFeedback("");
                    }}
                    disabled={
                      !s.turn.darts.length && s.turn.visitScore === undefined
                    }
                  >
                    {s.turn.isComplete ? "Next player →" : "End turn →"}
                  </button>
                  <button
                    className="button button--quiet"
                    onClick={() => setConfirmNew(true)}
                  >
                    New game
                  </button>
                </div>
              </>
            )}
          </div>
          {s.mode.type === "x01" ? (
            <section className="panel checkout-panel">
              <span className="eyebrow">Your next move</span>
              <h2>
                {route
                  ? "A finish is on"
                  : s.turn.isComplete
                    ? "Ready for the next player"
                    : "Build your visit"}
              </h2>
              {route ? (
                <>
                  <div className="checkout-route">
                    {route.map((hit, i) => (
                      <span key={i}>
                        {hit.label === "50" ? "Bull" : hit.label}
                      </span>
                    ))}
                  </div>
                  <p className="hint">
                    {player.score} remaining · {3 - s.turn.darts.length} darts
                    left. Suggested route; other finishes may work.
                  </p>
                </>
              ) : (
                <p className="hint">
                  {s.turn.isComplete
                    ? "Review the darts before handing over."
                    : `${player.score} remaining. ${s.mode.finishRule === "double-out" ? "Finish on a double or bull." : "Finish on any scoring hit."}`}
                </p>
              )}
              <div className="pulse-line">
                <span>
                  3-dart average <b>{stats.average.toFixed(1)}</b>
                </span>
                <span>
                  Highest visit <b>{stats.highest}</b>
                </span>
              </div>
            </section>
          ) : (
            <section className="panel">
              <span className="eyebrow">Your next move</span>
              <h2>
                {s.mode.type === "round-clock"
                  ? `Aim for ${player.score}`
                  : s.mode.type === "killer"
                    ? `Your double: D${player.killerTarget}`
                    : "Every hit counts"}
              </h2>
              <p className="hint">
                {s.mode.type === "killer"
                  ? player.killerIsActive
                    ? "Hit an opponent’s double to take a life. Avoid your own."
                    : "Hit your own double to become a killer."
                  : s.mode.type === "round-clock"
                    ? "Hit this number on any ring, then move to the next."
                    : `First to ${s.mode.targetScore} points.`}
              </p>
            </section>
          )}
          <RecentVisits state={s} />
          <details className="panel stats-details">
            <summary>All player statistics</summary>
            <MatchStats state={s} />
          </details>
        </aside>
      </div>
    </section>
  );
}
