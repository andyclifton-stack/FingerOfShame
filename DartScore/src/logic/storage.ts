import type { GameState, GameStatus } from '../types/game'

const STORAGE_KEY = 'dartscore.current.v1'
const STORAGE_VERSION = 1

interface StoredGameState {
  version: number
  gameState: GameState
}

function isGameStatus(value: unknown): value is GameStatus {
  return value === 'setup' || value === 'in_progress' || value === 'game_over'
}

function looksLikeGameState(value: unknown): value is GameState {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<GameState>

  return (
    isGameStatus(candidate.status) &&
    Array.isArray(candidate.players) &&
    typeof candidate.currentPlayerIndex === 'number' &&
    typeof candidate.lastUpdatedAt === 'string' &&
    typeof candidate.winnerId !== 'undefined' &&
    typeof candidate.statusMessage !== 'undefined' &&
    typeof candidate.turn === 'object' &&
    Array.isArray(candidate.undoStack) &&
    typeof candidate.mode === 'object'
  )
}

export function loadSavedGame(): GameState | null {
  if (typeof localStorage === 'undefined') {
    return null
  }

  try {
    const storedValue = localStorage.getItem(STORAGE_KEY)

    if (!storedValue) {
      return null
    }

    const parsed = JSON.parse(storedValue) as StoredGameState

    if (
      parsed.version !== STORAGE_VERSION ||
      !looksLikeGameState(parsed.gameState) ||
      parsed.gameState.status !== 'in_progress'
    ) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }

    return parsed.gameState
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function saveGame(gameState: GameState): void {
  if (typeof localStorage === 'undefined' || gameState.status !== 'in_progress') {
    return
  }

  const payload: StoredGameState = {
    version: STORAGE_VERSION,
    gameState,
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

export function clearSavedGame(): void {
  if (typeof localStorage === 'undefined') {
    return
  }

  localStorage.removeItem(STORAGE_KEY)
}
