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

function buildDartThrow(
  turn: TurnState,
  throwInput: DartThrowInput,
  dartIndex = turn.darts.length + 1,
  existingId?: string,
): DartThrow {
  return {
    id: existingId ?? createDartId(turn.turnIndex, dartIndex - 1),
    x: throwInput.x,
    y: throwInput.y,
    normalizedX: throwInput.normalizedX,
    normalizedY: throwInput.normalizedY,
    hit: throwInput.hit,
    score: throwInput.hit.score,
    turnIndex: turn.turnIndex,
    dartIndex,
  }
}

function getTurnReviewMessage(state: GameState, turn: TurnState): string {
  const currentPlayer = state.players[state.currentPlayerIndex]

  if (turn.isBust) {
    return `${currentPlayer.name} busts. Review the turn, then pass to the next player.`
  }

  return `${currentPlayer.name} scored ${turn.turnTotal}. Review the turn, then pass to the next player.`
}

function evaluateTurnFromDarts(
  state: GameState,
  darts: DartThrow[],
): Pick<GameState, 'players' | 'status' | 'winnerId' | 'statusMessage'> & {
  turn: TurnState
} {
  const currentPlayer = state.players[state.currentPlayerIndex]
  const updatedPlayers = clonePlayers(state.players)
  const normalizedDarts: DartThrow[] = []
  let turnTotal = 0
  let isBust = false
  let isWinningThrow = false
  let statusMessage: string | null = null

  if (state.mode.type === 'x01') {
    let runningScore = state.turn.startingScore

    for (const [index, dart] of darts.entries()) {
      const nextDart = {
        ...dart,
        hit: { ...dart.hit },
        turnIndex: state.turn.turnIndex,
        dartIndex: index + 1,
      }
      const outcome = applyX01Throw({
        currentScore: runningScore,
        hit: nextDart.hit,
        finishRule: state.mode.finishRule,
      })

      normalizedDarts.push(nextDart)
      turnTotal += nextDart.score

      if (outcome.isBust) {
        isBust = true
        runningScore = state.turn.startingScore
        break
      }

      runningScore = outcome.nextScore

      if (outcome.isWinningThrow) {
        isWinningThrow = true
        statusMessage = `${currentPlayer.name} checks out with ${nextDart.hit.label}.`
        break
      }
    }

    const nextTurn: TurnState = {
      ...cloneTurn(state.turn),
      darts: normalizedDarts,
      turnTotal,
      isBust,
      isComplete: isBust || normalizedDarts.length === 3 || isWinningThrow,
    }

    updatedPlayers[state.currentPlayerIndex] = {
      ...currentPlayer,
      score: isBust ? state.turn.startingScore : runningScore,
    }

    if (!statusMessage && nextTurn.isComplete) {
      statusMessage = getTurnReviewMessage(
        {
          ...state,
          players: updatedPlayers,
        },
        nextTurn,
      )
    }

    return {
      players: updatedPlayers,
      turn: nextTurn,
      status: isWinningThrow ? 'game_over' : 'in_progress',
      winnerId: isWinningThrow ? currentPlayer.id : null,
      statusMessage,
    }
  }

  let nextScore = state.turn.startingScore

  for (const [index, dart] of darts.entries()) {
    const nextDart = {
      ...dart,
      hit: { ...dart.hit },
      turnIndex: state.turn.turnIndex,
      dartIndex: index + 1,
    }

    normalizedDarts.push(nextDart)
    turnTotal += nextDart.score
    nextScore += nextDart.score

    if (nextScore >= state.mode.targetScore) {
      isWinningThrow = true
      statusMessage = `${currentPlayer.name} hits the target with ${nextScore}.`
      break
    }
  }

  const nextTurn: TurnState = {
    ...cloneTurn(state.turn),
    darts: normalizedDarts,
    turnTotal,
    isBust: false,
    isComplete: normalizedDarts.length === 3 || isWinningThrow,
  }

  updatedPlayers[state.currentPlayerIndex] = {
    ...currentPlayer,
    score: nextScore,
  }

  if (!statusMessage && nextTurn.isComplete) {
    statusMessage = getTurnReviewMessage(
      {
        ...state,
        players: updatedPlayers,
      },
      nextTurn,
    )
  }

  return {
    players: updatedPlayers,
    turn: nextTurn,
    status: isWinningThrow ? 'game_over' : 'in_progress',
    winnerId: isWinningThrow ? currentPlayer.id : null,
    statusMessage,
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

  const dart = buildDartThrow(state.turn, throwInput)
  const undoStack = [...state.undoStack, createUndoSnapshot(state)]
  const evaluatedTurn = evaluateTurnFromDarts(state, [...state.turn.darts, dart])

  return {
    ...state,
    ...evaluatedTurn,
    lastUpdatedAt: getNowTimestamp(),
    undoStack,
  }
}

export function replaceTurnDart(
  state: GameState,
  dartId: string,
  throwInput: DartThrowInput,
): GameState {
  if (state.status !== 'in_progress' && state.status !== 'game_over') {
    return state
  }

  const dartIndex = state.turn.darts.findIndex((dart) => dart.id === dartId)

  if (dartIndex === -1) {
    return state
  }

  const replacementDart = buildDartThrow(
    state.turn,
    throwInput,
    dartIndex + 1,
    dartId,
  )
  const nextDarts = state.turn.darts.map((dart, index) =>
    index === dartIndex ? replacementDart : dart,
  )
  const evaluatedTurn = evaluateTurnFromDarts(state, nextDarts)

  return {
    ...state,
    ...evaluatedTurn,
    lastUpdatedAt: getNowTimestamp(),
    undoStack: [...state.undoStack, createUndoSnapshot(state)],
  }
}

export function advancePlayer(state: GameState): GameState {
  if (state.status !== 'in_progress') {
    return state
  }

  const currentPlayer = state.players[state.currentPlayerIndex]
  const turnMessage = state.turn.isBust
    ? `${currentPlayer.name} busts. Score returns to ${state.turn.startingScore}.`
    : `${currentPlayer.name} scored ${state.turn.turnTotal}.`

  return advancePlayerInternal(
    state,
    turnMessage,
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
