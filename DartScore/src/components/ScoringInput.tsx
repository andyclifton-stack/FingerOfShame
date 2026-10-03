import { useState } from "react";
import type { DartThrowInput, GameState } from "../types/game";
import { buttonThrow } from "../logic/matchTools";
interface Props {
  state: GameState;
  editing: boolean;
  onThrow: (dart: DartThrowInput) => void;
  onVisit: (total: number, darts: number, finish?: number) => string | null;
}
export function ButtonInput({ state, editing, onThrow }: Props) {
  const [multiplier, setMultiplier] = useState(1);
  const [selection, setSelection] = useState<DartThrowInput | null>(null);
  const disabled = !editing && state.turn.isComplete;
  function confirm() {
    if (selection) {
      onThrow(selection);
      setSelection(null);
    }
  }
  return (
    <section className="panel scoring-input">
      <div className="section-heading">
        <span className="eyebrow">Tap to score</span>
        <h2>
          {editing
            ? "Correct this dart"
            : `Dart ${Math.min(state.turn.darts.length + 1, 3)}`}
        </h2>
      </div>
      <div className="multiplier-row" aria-label="Score multiplier">
        {["Single", "Double", "Treble"].map((name, i) => (
          <button
            key={name}
            aria-pressed={multiplier === i + 1}
            className={`button ${multiplier === i + 1 ? "is-active" : ""}`}
            disabled={disabled}
            onClick={() => {
              setMultiplier(i + 1);
              setSelection(null);
            }}
          >
            {name}
          </button>
        ))}
      </div>
      <div className="number-grid">
        {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            disabled={disabled}
            className={`number-button ${selection?.hit.segment === n ? "is-active" : ""}`}
            onClick={() => setSelection(buttonThrow(n, multiplier))}
            aria-label={`Select ${["single", "double", "treble"][multiplier - 1]} ${n}`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="special-grid">
        {[
          [25, "25"],
          [50, "Bull · 50"],
          [0, "Miss"],
        ].map(([n, label]) => (
          <button
            key={n}
            className="button"
            disabled={disabled}
            onClick={() => setSelection(buttonThrow(Number(n)))}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="entry-confirm">
        <strong aria-live="polite">
          {selection
            ? `${selection.hit.label} = ${selection.hit.score}`
            : disabled
              ? "Turn ready to review"
              : "Choose a hit"}
        </strong>
        <button
          className="button button--accent"
          disabled={!selection || disabled}
          onClick={confirm}
        >
          {editing ? "Save dart" : "Confirm dart"}
        </button>
      </div>
    </section>
  );
}
export function TotalInput({ state, onVisit }: Props) {
  const [value, setValue] = useState("");
  const [darts, setDarts] = useState(3);
  const [finish, setFinish] = useState("");
  const [error, setError] = useState<string | null>(null);
  const disabled = state.turn.isComplete || !!state.turn.darts.length;
  const needsFinish =
    state.mode.type === "x01" &&
    state.mode.finishRule === "double-out" &&
    value !== "" &&
    Number(value) === state.turn.startingScore;
  function submit() {
    if (value === "") {
      setError("Enter a visit total first.");
      return;
    }
    setError(
      onVisit(Number(value), darts, finish ? Number(finish) : undefined),
    );
  }
  return (
    <section className="panel scoring-input">
      <div className="section-heading">
        <span className="eyebrow">Whole visit</span>
        <h2>Enter your total</h2>
      </div>
      <p className="hint">
        Records your visit total and darts used. Individual hits are not
        inferred.
      </p>
      <label className="field">
        <span>Visit total</span>
        <input
          className="total-value"
          type="text"
          inputMode="numeric"
          maxLength={3}
          value={value}
          disabled={disabled}
          onChange={(e) => {
            setValue(e.target.value.replace(/\D/g, "").slice(0, 3));
            setError(null);
            setFinish("");
          }}
        />
      </label>
      <div className="keypad">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "Clear", "0", "⌫"].map(
          (key) => (
            <button
              key={key}
              className="number-button"
              disabled={disabled}
              aria-label={key === "⌫" ? "Backspace" : key}
              onClick={() => {
                setValue((old) =>
                  key === "Clear"
                    ? ""
                    : key === "⌫"
                      ? old.slice(0, -1)
                      : (old + key).slice(0, 3),
                );
                setError(null);
                setFinish("");
              }}
            >
              {key}
            </button>
          ),
        )}
      </div>
      <div className="settings-grid">
        <label className="field">
          <span>Darts used</span>
          <select
            value={darts}
            disabled={disabled}
            onChange={(e) => setDarts(Number(e.target.value))}
          >
            {[1, 2, 3].map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "dart" : "darts"}
              </option>
            ))}
          </select>
        </label>
        {needsFinish && (
          <label className="field">
            <span>Finishing double</span>
            <select value={finish} onChange={(e) => setFinish(e.target.value)}>
              <option value="">Choose finish</option>
              {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  D{n}
                </option>
              ))}
              <option value="25">Bull · 50</option>
              <option value="0">Not a double · bust</option>
            </select>
          </label>
        )}
      </div>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      <button
        className="button button--accent button--large"
        disabled={disabled}
        onClick={submit}
      >
        Confirm visit
      </button>
    </section>
  );
}
