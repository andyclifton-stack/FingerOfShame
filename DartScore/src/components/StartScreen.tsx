import { useState, type FormEvent } from "react";
import type {
  CreateGameInput,
  FinishRule,
  GameMode,
  GameState,
} from "../types/game";
import { formatModeLabel } from "../logic/gameModePresentation";
import { loadSetup } from "../logic/storage";
import { isMatchComplete } from "../logic/matchTools";
import { PlayerSetup } from "./PlayerSetup";
interface Props {
  savedGame: GameState | null;
  onResumeGame: () => void;
  onStartGame: (config: CreateGameInput) => void;
}
const modes = [
  {
    id: "301",
    title: "301",
    subtitle: "Quick countdown",
    description:
      "Count down from 301. Busts return your score to the start of the visit.",
  },
  {
    id: "501",
    title: "501",
    subtitle: "Classic match",
    description:
      "Count down from 501. Choose a finishing rule and play one leg or a full match.",
  },
  {
    id: "round-clock",
    title: "Round the Clock",
    subtitle: "Aim · progress",
    description:
      "Hit 1 through 20 in order. Singles, doubles and trebles each advance one target.",
  },
  {
    id: "killer",
    title: "Killer",
    subtitle: "Last player standing",
    description:
      "Hit your assigned double to become a killer, then hit opponents’ doubles to remove lives. Your own double costs a life once active.",
  },
  {
    id: "free",
    title: "Practice",
    subtitle: "Build your score",
    description: "Score upwards to your chosen target. Every hit counts.",
  },
];
export function StartScreen({ savedGame, onResumeGame, onStartGame }: Props) {
  const [initial] = useState(loadSetup);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [choice, setChoice] = useState(
    initial.mode.type === "x01"
      ? String(initial.mode.startingScore)
      : initial.mode.type,
  );
  const [playerCount, setPlayerCount] = useState(initial.playerNames.length);
  const [names, setNames] = useState(
    Array.from(
      { length: 4 },
      (_, i) => initial.playerNames[i] ?? `Player ${i + 1}`,
    ),
  );
  const [finishRule, setFinishRule] = useState<FinishRule>(
    initial.mode.type === "x01" ? initial.mode.finishRule : "double-out",
  );
  const [bestOf, setBestOf] = useState(initial.bestOf ?? 1);
  const [target, setTarget] = useState(
    initial.mode.type === "free" ? initial.mode.targetScore : 100,
  );
  const [lives, setLives] = useState(
    initial.mode.type === "killer" ? initial.mode.lives : 3,
  );
  const count = Math.max(choice === "killer" ? 2 : 1, playerCount);
  const countdown = choice === "301" || choice === "501";
  const selected = modes.find((m) => m.id === choice) ?? modes[4];
  const mode: GameMode = countdown
    ? { type: "x01", startingScore: Number(choice), finishRule }
    : choice === "killer"
      ? { type: "killer", lives }
      : choice === "round-clock"
        ? { type: "round-clock", finalTarget: 20 }
        : { type: "free", targetScore: target };
  function submit(e: FormEvent) {
    e.preventDefault();
    if (savedGame && !isMatchComplete(savedGame)) { setConfirmReplace(true); return; }
    startConfiguredGame();
  }
  function startConfiguredGame() {
    onStartGame({
      playerNames: names.slice(0, count),
      mode,
      bestOf: countdown ? bestOf : 1,
    });
  }
  return (
    <section className="screen start-screen">
      <div className="hero-card panel">
        <span className="eyebrow">The match starts here</span>
        <h1>Your board. Your game.</h1>
        <p>Clear scores, smart finishes and a little friendly competition.</p>
        {savedGame && (
          <div className="resume-card">
            <div>
              <strong>Pick up where you left off</strong>
              <p>
                {formatModeLabel(savedGame.mode)} ·{" "}
                {savedGame.status === "game_over"
                  ? "View result"
                  : `${savedGame.players[savedGame.currentPlayerIndex].name} to throw`}
              </p>
            </div>
            <button className="button button--accent" onClick={onResumeGame}>
              Resume game
            </button>
          </div>
        )}
      </div>
      <form className="setup-grid" onSubmit={submit}>
        <section className="panel">
          <div className="section-heading">
            <span className="eyebrow">01 · Game</span>
            <h2>Choose your format</h2>
          </div>
          <div className="mode-grid">
            {modes.map((m) => (
              <button
                type="button"
                key={m.id}
                aria-pressed={choice === m.id}
                className={`mode-card ${choice === m.id ? "is-active" : ""}`}
                onClick={() => setChoice(m.id)}
              >
                <strong>{m.title}</strong>
                <small>{m.subtitle}</small>
              </button>
            ))}
          </div>
          <p className="mode-description">{selected.description}</p>
          <div className="settings-grid">
            {countdown && (
              <>
                <label className="field">
                  <span>Finish rule</span>
                  <select
                    value={finishRule}
                    onChange={(e) =>
                      setFinishRule(e.target.value as FinishRule)
                    }
                  >
                    <option value="double-out">Double-out</option>
                    <option value="straight">Straight-out</option>
                  </select>
                </label>
                <label className="field">
                  <span>Match length</span>
                  <select
                    value={bestOf}
                    onChange={(e) => setBestOf(Number(e.target.value))}
                  >
                    {[1, 3, 5, 7, 9].map((n) => (
                      <option key={n} value={n}>
                        {n === 1 ? "Single leg" : `Best of ${n} legs`}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
            {choice === "free" && (
              <label className="field">
                <span>Target score</span>
                <input
                  type="number"
                  min="1"
                  max="100000"
                  required
                  value={target || ""}
                  onChange={(e) => setTarget(Number(e.target.value))}
                />
              </label>
            )}
            {choice === "killer" && (
              <label className="field">
                <span>Lives per player</span>
                <select
                  value={lives}
                  onChange={(e) => setLives(Number(e.target.value))}
                >
                  {[3, 5, 7].map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
              </label>
            )}
          </div>
          {countdown && (
            <small className="hint">
              {finishRule === "double-out"
                ? "Finish on a double or bull. Leaving 1 is a bust."
                : "Finish on any scoring hit."}{" "}
              {bestOf > 1 ? "Starting player rotates each leg." : ""}
            </small>
          )}
        </section>
        <PlayerSetup
          minPlayers={choice === "killer" ? 2 : 1}
          playerCount={count}
          playerNames={names}
          onPlayerCountChange={setPlayerCount}
          onPlayerNameChange={(index, name) =>
            setNames((old) =>
              old.map((n, i) => (i === index ? name.slice(0, 24) : n)),
            )
          }
        />
        <section className="panel launch-panel">
          <div>
            <span className="eyebrow">Ready when you are</span>
            <h2>{formatModeLabel(mode)}</h2>
            <p>
              {count} {count === 1 ? "player" : "players"}
              {countdown && bestOf > 1
                ? ` · First to ${Math.floor(bestOf / 2) + 1} legs`
                : ""}
            </p>
          </div>
          {confirmReplace ? <div className="replace-confirm" role="group" aria-label="Replace saved game">
            <strong>Replace your unfinished game?</strong>
            <button className="button" type="button" onClick={() => setConfirmReplace(false)}>Cancel</button>
            <button className="button button--accent" type="button" onClick={startConfiguredGame}>Replace game</button>
          </div> : <button className="button button--accent button--large" type="submit">
            Start game <span aria-hidden="true">→</span>
          </button>}
        </section>
      </form>
    </section>
  );
}
