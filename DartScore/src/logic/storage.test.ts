import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearSavedGame,
  loadHistory,
  loadPreferences,
  loadSavedGame,
  loadSetup,
  reconcileHistory,
  saveGame,
  storageAvailable,
} from "./storage";
import { applyDartThrow, createGame, undoLastDart } from "./gameEngine";
import { buttonThrow } from "./matchTools";

describe("local persistence", () => {
  let values: Map<string, string>;
  beforeEach(() => {
    values = new Map();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });
  });
  afterEach(() => vi.unstubAllGlobals());
  const game = () =>
    createGame({
      playerNames: ["A", "B"],
      mode: { type: "x01", startingScore: 40, finishRule: "double-out" },
    });
  it("restores both an active match and an intermediate leg result", () => {
    const state = game();
    saveGame(state);
    expect(loadSavedGame()).toEqual(state);
    const won = applyDartThrow(state, buttonThrow(20, 2));
    saveGame(won);
    expect(loadSavedGame()).toEqual(won);
    clearSavedGame();
    expect(loadSavedGame()).toBeNull();
  });
  it("accepts a legacy version-one game without match metadata", () => {
    const old = game();
    delete old.match;
    delete old.visits;
    values.set(
      "dartscore.current.v1",
      JSON.stringify({ version: 1, gameState: old }),
    );
    expect(loadSavedGame()?.players).toEqual(old.players);
  });
  it("rejects broken saves and malformed preference data", () => {
    values.set("dartscore.current.v1", "{broken");
    expect(loadSavedGame()).toBeNull();
    values.set(
      "dartscore.current.v1",
      JSON.stringify({
        version: 1,
        gameState: { ...game(), currentPlayerIndex: 8 },
      }),
    );
    expect(loadSavedGame()).toBeNull();
    values.set("dartscore.preferences.v1", "null");
    expect(loadPreferences()).toEqual({ input: "board", awake: false });
    values.set("dartscore.setup.v1", "{}");
    expect(loadSetup().playerNames).toHaveLength(2);
  });
  it("updates a result once and retracts it when its winning score is undone", () => {
    const won = applyDartThrow(game(), buttonThrow(20, 2));
    reconcileHistory(won);
    reconcileHistory(won);
    expect(loadHistory()).toHaveLength(1);
    reconcileHistory(undoLastDart(won));
    expect(loadHistory()).toHaveLength(0);
  });
  it("retains only the last 50 results", () => {
    for (let i = 0; i < 55; i++)
      reconcileHistory(applyDartThrow(game(), buttonThrow(20, 2)));
    expect(loadHistory()).toHaveLength(50);
  });
  it("keeps scoring usable when browser storage is blocked", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw Error("Blocked");
      },
      setItem: () => {
        throw Error("Quota");
      },
      removeItem: () => {
        throw Error("Blocked");
      },
    });
    expect(loadSavedGame()).toBeNull();
    expect(() => saveGame(game())).not.toThrow();
    expect(storageAvailable).toBe(false);
  });
});
