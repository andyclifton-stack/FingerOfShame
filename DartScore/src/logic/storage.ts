import type { CreateGameInput, GameState } from "../types/game";
import { isMatchComplete } from "./matchTools";
const STORAGE_KEY = "dartscore.current.v1";
export interface Preferences {
  input: "board" | "buttons" | "total";
  awake: boolean;
}
export const defaultPreferences: Preferences = { input: "board", awake: false };
export let storageAvailable = true;
export function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    storageAvailable = false;
    return fallback;
  }
}
export function writeLocal(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
}
function validGame(value: unknown): value is GameState {
  if (!value || typeof value !== "object") return false;
  const s = value as GameState;
  return (
    ["in_progress", "game_over"].includes(s.status) &&
    Array.isArray(s.players) &&
    s.players.length > 0 &&
    s.players.length <= 4 &&
    s.players.every(
      (p) =>
        typeof p.id === "string" &&
        typeof p.name === "string" &&
        Number.isFinite(p.score),
    ) &&
    Number.isInteger(s.currentPlayerIndex) &&
    s.currentPlayerIndex >= 0 &&
    s.currentPlayerIndex < s.players.length &&
    !!s.turn &&
    Array.isArray(s.turn.darts) &&
    s.turn.darts.length <= 3 &&
    s.turn.darts.every((d) => !!d.hit && Number.isFinite(d.score)) &&
    Number.isFinite(s.turn.startingScore) &&
    !!s.mode &&
    ["x01", "free", "round-clock", "killer"].includes(s.mode.type) &&
    Array.isArray(s.undoStack) &&
    (!s.visits || Array.isArray(s.visits)) &&
    (!s.match ||
      (!!s.match.id &&
        !!s.match.legsWon &&
        Number.isInteger(s.match.bestOf) &&
        Number.isInteger(s.match.leg)))
  );
}
export function loadSavedGame(): GameState | null {
  const saved = readLocal<{ version: number; gameState: unknown } | null>(
    STORAGE_KEY,
    null,
  );
  return saved?.version === 1 && validGame(saved.gameState)
    ? saved.gameState
    : null;
}
export function saveGame(s: GameState) {
  writeLocal(STORAGE_KEY, { version: 1, gameState: s });
}
export function clearSavedGame() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    storageAvailable = false;
  }
}
export function loadHistory(): GameState[] {
  const history = readLocal<unknown>("dartscore.history.v1", []);
  return Array.isArray(history) ? history.filter(validGame).slice(0, 50) : [];
}
export function reconcileHistory(s: GameState): GameState[] {
  const history = loadHistory().filter(
    (item) => item.match?.id !== s.match?.id,
  );
  if (isMatchComplete(s)) history.unshift({ ...s, undoStack: [] });
  writeLocal("dartscore.history.v1", history.slice(0, 50));
  return history.slice(0, 50);
}
export function loadSetup(): CreateGameInput {
  const fallback: CreateGameInput = {
    playerNames: ["Player 1", "Player 2"],
    mode: { type: "x01", startingScore: 501, finishRule: "double-out" },
    bestOf: 1,
  };
  const s = readLocal<CreateGameInput>("dartscore.setup.v1", fallback);
  return s &&
    Array.isArray(s.playerNames) &&
    s.playerNames.length >= 1 &&
    s.playerNames.length <= 4 &&
    s.playerNames.every((n) => typeof n === "string") &&
    s.mode &&
    ["x01", "free", "round-clock", "killer"].includes(s.mode.type)
    ? s
    : fallback;
}
export function loadPreferences(): Preferences {
  const p = readLocal<Preferences>(
    "dartscore.preferences.v1",
    defaultPreferences,
  );
  return {
    input:
      p && ["board", "buttons", "total"].includes(p.input) ? p.input : "board",
    awake: p?.awake === true,
  };
}
