import type {
  CreateGameInput,
  DartThrow,
  DartThrowInput,
  GameMode,
  GameState,
  Player,
  TurnState,
  UndoSnapshot,
} from '../types/game'
import { applyX01Throw } from './x01Rules'

function getNowTimestamp(): string {
  return new Date().toISOString()
}

function clonePlayers(players: Player[]): Player[] {
  return players.map((player) => ({ ...player }))
}

function cloneTurn(turn: TurnState): TurnState {
  return {
    ...turn,
    darts: turn.darts.map((dart) => ({
      ...dart,
      hit: { ...dart.hit },
    })),
  }
}

function createUndoSnapshot(state: GameState): UndoSnapshot {
  return {
    players: clonePlayers(state.players),
    currentPlayerIndex: state.currentPlayerIndex,
    turn: cloneTurn(state.turn),
    status: state.status,
    winnerId: state.winnerId,
    statusMessage: state.statusMessage,
    lastUpdatedAt: state.lastUpdatedAt,
  }
}

function createTurnState(player: Player, turnIndex: number): TurnState {
  return {
    playerId: player.id,
    startingScore: player.score,
    darts: [],
    turnTotal: 0,
    isBust: false,
    isComplete: false,
    turnIndex,
  }
}

function getStartingScore(mode: GameMode): number {
  return mode.type === 'x01' ? mode.startingScore : 0
}

function createDartId(turnIndex: number, dartIndex: number): string {
  return `${turnIndex + 1}-${dartIndex + 1}-${Math.random()
    .toString(16)
    .slice(2, 8)}`
}

function buildDartThrow(turn: TurnState, throwInput: DartThrowInput): DartThrow {
  return {
    id: createDartId(turn.turnIndex, turn.darts.length),
    x: throwInput.x,
    y: throwInput.y,
    normalizedX: throwInput.normalizedX,
    normalizedY: throwInput.normalizedY,
    hit: throwInput.hit,
    score: throwInput.hit.score,
    turnIndex: turn.turnIndex,
    dartIndex: turn.darts.length + 1,
  }
}

function advancePlayerInternal(
  state: GameState,
  statusMessage: string | null,
): GameState {
  if (state.status !== 'in_progress') {
    return state
  }

  const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length
  const nextPlayer = state.players[nextPlayerIndex]

  return {
    ...state,
    currentPlayerIndex: nextPlayerIndex,
    turn: createTurnState(nextPlayer, state.turn.turnIndex + 1),
    statusMessage,
    lastUpdatedAt: getNowTimestamp(),
  }
}

export function createGame({ playerNames, mode }: CreateGameInput): GameState {
  const players = playerNames.map((name, index) => ({
    id: `player-${index + 1}`,
    name: name.trim() || `Player ${index + 1}`,
    score: getStartingScore(mode),
  }))

  return {
    status: 'in_progress',
    mode,
    players,
    currentPlayerIndex: 0,
    turn: createTurnState(players[0], 0),
    winnerId: null,
    statusMessage: null,
    lastUpdatedAt: getNowTimestamp(),
    undoStack: [],
  }
}

export function applyDartThrow(
  state: GameState,
  throwInput: DartThrowInput,
): GameState {
  if (state.status !== 'in_progress' || state.turn.isComplete) {
    return state
  }

  const currentPlayer = state.players[state.currentPlayerIndex]
  const updatedPlayers = clonePlayers(state.players)
  const dart = buildDartThrow(state.turn, throwInput)
  const nextTurn = {
    ...cloneTurn(state.turn),
    darts: [...state.turn.darts, dart],
    turnTotal: state.turn.turnTotal + dart.score,
  }
  const undoStack = [...state.undoStack, createUndoSnapshot(state)]

  if (state.mode.type === 'x01') {
    const outcome = applyX01Throw({
      currentScore: currentPlayer.score,
      hit: dart.hit,
      finishRule: state.mode.finishRule,
    })

    updatedPlayers[state.currentPlayerIndex] = {
      ...currentPlayer,
      score: outcome.isBust ? state.turn.startingScore : outcome.nextScore,
    }

    const nextState: GameState = {
      ...state,
      players: updatedPlayers,
      turn: {
        ...nextTurn,
        isBust: outcome.isBust,
        isComplete: outcome.isBust || outcome.isWinningThrow,
      },
      winnerId: outcome.isWinningThrow ? currentPlayer.id : null,
      status: outcome.isWinningThrow ? 'game_over' : 'in_progress',
      statusMessage: null,
      lastUpdatedAt: getNowTimestamp(),
      undoStack,
    }

    if (outcome.isBust) {
      return advancePlayerInternal(
        nextState,
        `${currentPlayer.name} busts. Score returns to ${state.turn.startingScore}.`,
      )
    }

    if (outcome.isWinningThrow) {
      return {
        ...nextState,
        statusMessage: `${currentPlayer.name} checks out with ${dart.hit.label}.`,
      }
    }

    if (nextTurn.darts.length === 3) {
      return advancePlayerInternal(
        nextState,
        `${currentPlayer.name} scored ${nextTurn.turnTotal}.`,
      )
    }

    return nextState
  }

  const nextScore = currentPlayer.score + dart.score
  updatedPlayers[state.currentPlayerIndex] = {
    ...currentPlayer,
    score: nextScore,
  }

  const nextState: GameState = {
    ...state,
    players: updatedPlayers,
    turn: {
      ...nextTurn,
      isBust: false,
      isComplete: nextScore >= state.mode.targetScore,
    },
    winnerId: nextScore >= state.mode.targetScore ? currentPlayer.id : null,
    status: nextScore >= state.mode.targetScore ? 'game_over' : 'in_progress',
    statusMessage: null,
    lastUpdatedAt: getNowTimestamp(),
    undoStack,
  }

  if (nextScore >= state.mode.targetScore) {
    return {
      ...nextState,
      statusMessage: `${currentPlayer.name} hits the target with ${nextScore}.`,
    }
  }

  if (nextTurn.darts.length === 3) {
    return advancePlayerInternal(
      nextState,
      `${currentPlayer.name} added ${nextTurn.turnTotal}.`,
    )
  }

  return nextState
}

export function advancePlayer(state: GameState): GameState {
  if (state.status !== 'in_progress') {
    return state
  }

  const currentPlayer = state.players[state.currentPlayerIndex]
  return advancePlayerInternal(
    state,
    `${currentPlayer.name} finished the turn on ${state.turn.turnTotal}.`,
  )
}

export function endTurn(state: GameState): GameState {
  if (state.status !== 'in_progress' || state.turn.darts.length === 0) {
    return state
  }

  return advancePlayer(state)
}

export function undoLastDart(state: GameState): GameState {
  const previousSnapshot = state.undoStack[state.undoStack.length - 1]

  if (!previousSnapshot) {
    return state
  }

  return {
    ...state,
    players: clonePlayers(previousSnapshot.players),
    currentPlayerIndex: previousSnapshot.currentPlayerIndex,
    turn: cloneTurn(previousSnapshot.turn),
    status: previousSnapshot.status,
    winnerId: previousSnapshot.winnerId,
    statusMessage: previousSnapshot.statusMessage,
    lastUpdatedAt: getNowTimestamp(),
    undoStack: state.undoStack.slice(0, -1),
  }
}
