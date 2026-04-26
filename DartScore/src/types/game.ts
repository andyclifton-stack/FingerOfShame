export type FinishRule = 'straight' | 'double-out'

export type GameStatus = 'setup' | 'in_progress' | 'game_over'

export type DartboardRing =
  | 'innerBull'
  | 'outerBull'
  | 'singleInner'
  | 'treble'
  | 'singleOuter'
  | 'double'
  | 'miss'

export interface Player {
  id: string
  name: string
  score: number
}

export type GameMode =
  | {
      type: 'x01'
      startingScore: number
      finishRule: FinishRule
    }
  | {
      type: 'free'
      targetScore: number
    }

export interface DartboardHit {
  ring: DartboardRing
  segment: number | null
  multiplier: number
  score: number
  label: string
  isFinishDouble: boolean
}

export interface DartThrow {
  id: string
  x: number
  y: number
  normalizedX: number
  normalizedY: number
  hit: DartboardHit
  score: number
  turnIndex: number
  dartIndex: number
}

export interface TurnState {
  playerId: string
  startingScore: number
  darts: DartThrow[]
  turnTotal: number
  isBust: boolean
  isComplete: boolean
  turnIndex: number
}

export interface UndoSnapshot {
  players: Player[]
  currentPlayerIndex: number
  turn: TurnState
  status: GameStatus
  winnerId: string | null
  statusMessage: string | null
  lastUpdatedAt: string
}

export interface GameState {
  status: GameStatus
  mode: GameMode
  players: Player[]
  currentPlayerIndex: number
  turn: TurnState
  winnerId: string | null
  statusMessage: string | null
  lastUpdatedAt: string
  undoStack: UndoSnapshot[]
}

export interface CreateGameInput {
  playerNames: string[]
  mode: GameMode
}

export interface DartThrowInput {
  x: number
  y: number
  normalizedX: number
  normalizedY: number
  hit: DartboardHit
}
