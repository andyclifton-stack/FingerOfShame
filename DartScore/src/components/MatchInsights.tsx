import type { GameState } from "../types/game";
import { allVisits, playerStats } from "../logic/matchTools";
export function MatchStats({ state }: { state: GameState }) {
  const scoring = state.mode.type === "x01" || state.mode.type === "free";
  return (
    <section className="panel">
      <div className="section-heading">
        <span className="eyebrow">Match pulse</span>
        <h2>{scoring ? "Player stats" : "Darts thrown"}</h2>
      </div>
      <div className="stats-list">
        {state.players.map((p) => {
          const stats = playerStats(state, p.id);
          return (
            <article className="stats-player" key={p.id}>
              <strong>{p.name}</strong>
              <dl className="stats-grid">
                {scoring && (
                  <>
                    <div>
                      <dt>3-dart average</dt>
                      <dd>{stats.average.toFixed(1)}</dd>
                    </div>
                    <div>
                      <dt>Highest visit</dt>
                      <dd>{stats.highest}</dd>
                    </div>
                  </>
                )}
                <div>
                  <dt>Darts used</dt>
                  <dd>{stats.darts}</dd>
                </div>
                {state.mode.type === "x01" && (
                  <div>
                    <dt>Best checkout</dt>
                    <dd>{stats.checkout || "—"}</dd>
                  </div>
                )}
              </dl>
            </article>
          );
        })}
      </div>
      {scoring && (
        <small className="hint">
          Average = points scored ÷ darts used × 3. Bust visits score zero.
          Visit totals use the dart count you enter.
        </small>
      )}
    </section>
  );
}
export function RecentVisits({ state }: { state: GameState }) {
  const visits = allVisits(state).slice().reverse().slice(0, 12);
  return (
    <section className="panel">
      <div className="section-heading">
        <span className="eyebrow">The scorebook</span>
        <h2>Recent visits</h2>
      </div>
      {!visits.length ? (
        <p className="hint">Your visits appear here as you play.</p>
      ) : (
        <ol className="visit-list">
          {visits.map((v) => (
            <li key={`${v.leg}-${v.turnIndex}`}>
              <div>
                <strong>
                  {state.players.find((p) => p.id === v.playerId)?.name}
                </strong>
                <small>
                  Leg {v.leg} ·{" "}
                  {v.entry === "total"
                    ? `${v.dartsUsed} darts · visit total`
                    : v.labels.join(" · ")}
                  {v.checkout ? " · checkout" : ""}
                </small>
              </div>
              <b>{v.isBust ? "Bust" : v.total}</b>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
