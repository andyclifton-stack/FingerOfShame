import type { GameState } from "../types/game";
import { playerStats } from "../logic/matchTools";
import { formatModeLabel } from "../logic/gameModePresentation";
export function History({
  history,
  onSelect,
}: {
  history: GameState[];
  onSelect: (s: GameState) => void;
}) {
  const bests = new Map<
    string,
    { name: string; highest: number; average: number; checkout: number }
  >();
  for (const s of history.filter((s) => s.mode.type === "x01"))
    for (const p of s.players) {
      const stats = playerStats(s, p.id),
        key = p.name.trim().toLowerCase(),
        prev = bests.get(key);
      bests.set(key, {
        name: p.name,
        highest: Math.max(prev?.highest ?? 0, stats.highest),
        average: Math.max(prev?.average ?? 0, stats.average),
        checkout: Math.max(prev?.checkout ?? 0, stats.checkout),
      });
    }
  return (
    <section className="screen history-screen">
      <div className="panel">
        <span className="eyebrow">Your scorebook</span>
        <h1>Match history</h1>
        <p className="hint">
          The last 50 completed matches, saved in this browser on this device.
        </p>
        {!history.length ? (
          <div className="empty-state">
            <span aria-hidden="true">◎</span>
            <h2>A fresh scorebook.</h2>
            <p>
              Finish your first match to save the result and your personal
              bests.
            </p>
          </div>
        ) : (
          <div className="history-list">
            {history.map((s, i) => (
              <button
                className="history-card"
                key={s.match?.id ?? i}
                onClick={() => onSelect(s)}
              >
                <div>
                  <strong>
                    {s.players.find((p) => p.id === s.winnerId)?.name} won
                  </strong>
                  <span>{s.players.map((p) => p.name).join(" · ")}</span>
                  <small>
                    {formatModeLabel(s.mode)} ·{" "}
                    {new Date(s.lastUpdatedAt).toLocaleDateString("en-GB")}
                    {s.match && s.match.bestOf > 1
                      ? ` · ${s.players.map((p) => s.match!.legsWon[p.id] ?? 0).join("–")}`
                      : ""}
                  </small>
                </div>
                <b aria-hidden="true">↗</b>
              </button>
            ))}
          </div>
        )}
      </div>
      {bests.size > 0 && (
        <section className="panel">
          <span className="eyebrow">Countdown games</span>
          <h2>Personal bests</h2>
          <p className="hint">
            Best recorded visits, match averages and checkouts. Players are
            grouped by name.
          </p>
          <div className="bests-grid">
            {[...bests.values()].map((b) => (
              <article className="stats-player" key={b.name}>
                <strong>{b.name}</strong>
                <dl className="stats-grid">
                  <div>
                    <dt>Highest visit</dt>
                    <dd>{b.highest}</dd>
                  </div>
                  <div>
                    <dt>Best match average</dt>
                    <dd>{b.average.toFixed(1)}</dd>
                  </div>
                  <div>
                    <dt>Best checkout</dt>
                    <dd>{b.checkout || "—"}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
