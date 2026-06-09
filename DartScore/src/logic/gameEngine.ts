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

const KILLER_TARGETS = [
  20, 19, 18, 17, 16, 15, 14, 13, 12, 11,
  10, 9, 8, 7, 6, 5, 4, 3, 2, 1,
]

function getNowTimestamp(): string {
  return new Date().toISOString()
}

function clonePlayers(players: Player[]): Player[] {
  return players.map((player) => ({ ...player }))
}

function cloneTurn(turn: TurnState): TurnState {
  return {
    ...turn,
    startingPlayers: turn.startingPlayers
      ? clonePlayers(turn.startingPlayers)
      : undefined,
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

function createTurnState(
  player: Player,
  turnIndex: number,
  startingPlayers: Player[],
): TurnState {
  return {
    playerId: player.id,
    startingScore: player.score,
    startingPlayers: clonePlayers(startingPlayers),
    darts: [],
    turnTotal: 0,
    isBust: false,
    isComplete: false,
    turnIndex,
  }
}

function getStartingScore(mode: GameMode): number {
  switch (mode.type) {
    case 'x01':
      return mode.startingScore
    case 'killer':
      return mode.lives
    case 'round-clock':
      return 1
    case 'free':
      return 0
  }
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

function getTurnStartingPlayers(state: GameState): Player[] {
  return state.turn.startingPlayers
    ? clonePlayers(state.turn.startingPlayers)
    : clonePlayers(state.players)
}

function formatLifeCount(lives: number): string {
  return `${lives} ${lives === 1 ? 'life' : 'lives'}`
}

function getTurnReviewMessage(state: GameState, turn: TurnState): string {
  const currentPlayer = state.players[state.currentPlayerIndex]

  if (state.mode.type === 'round-clock') {
    if (currentPlayer.score > state.mode.finalTarget) {
      return `${currentPlayer.name} completes Round the Clock.`
    }

    if (turn.turnTotal > 0) {
      return `${currentPlayer.name} advances to ${currentPlayer.score}. Review the turn, then pass to the next player.`
    }

    return `${currentPlayer.name} stays on ${currentPlayer.score}. Review the turn, then pass to the next player.`
  }

  if (state.mode.type === 'killer') {
    const startingPlayer = turn.startingPlayers?.[state.currentPlayerIndex]
    const becameKiller =
      currentPlayer.killerIsActive && !startingPlayer?.killerIsActive

    if (currentPlayer.isEliminated) {
      return `${currentPlayer.name} is eliminated. Review the turn, then pass to the next player.`
    }

    if (turn.turnTotal > 0) {
      return `${currentPlayer.name} takes ${formatLifeCount(turn.turnTotal)}. Review the turn, then pass to the next player.`
    }

    if (becameKiller) {
      return `${currentPlayer.name} is now a killer. Review the turn, then pass to the next player.`
    }

    return `${currentPlayer.name} did not take a life. Review the turn, then pass to the next player.`
  }

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
  const updatedPlayers =
    state.mode.type === 'killer'
      ? getTurnStartingPlayers(state)
      : clonePlayers(state.players)
  const normalizedDarts: DartThrow[] = []
  let turnTotal = 0
  let isBust = false
  let isWinningThrow = false
  let statusMessage: string | null = null
  let winnerId: string | null = null

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
        winnerId = currentPlayer.id
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
      winnerId,
      statusMessage,
    }
  }

  if (state.mode.type === 'free') {
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
        winnerId = currentPlayer.id
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
      winnerId,
      statusMessage,
    }
  }

  if (state.mode.type === 'round-clock') {
    let nextTarget = state.turn.startingScore

    for (const [index, dart] of darts.entries()) {
      const nextDart = {
        ...dart,
        hit: { ...dart.hit },
        turnIndex: state.turn.turnIndex,
        dartIndex: index + 1,
      }

      normalizedDarts.push(nextDart)

      if (nextDart.hit.segment === nextTarget) {
        turnTotal += 1
        nextTarget += 1

        if (nextTarget > state.mode.finalTarget) {
          isWinningThrow = true
          winnerId = currentPlayer.id
          statusMessage = `${currentPlayer.name} completes Round the Clock.`
          break
        }
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
      roundClockTarget: nextTarget,
      score: nextTarget,
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
      winnerId,
      statusMessage,
    }
  }

  let activeCurrentPlayer = updatedPlayers[state.currentPlayerIndex]

  for (const [index, dart] of darts.entries()) {
    const nextDart = {
      ...dart,
      hit: { ...dart.hit },
      turnIndex: state.turn.turnIndex,
      dartIndex: index + 1,
    }

    normalizedDarts.push(nextDart)

    if (activeCurrentPlayer.isEliminated) {
      break
    }

    if (nextDart.hit.ring === 'double' && nextDart.hit.segment !== null) {
      if (nextDart.hit.segment === activeCurrentPlayer.killerTarget) {
        if (activeCurrentPlayer.killerIsActive) {
          const nextLives = Math.max(0, activeCurrentPlayer.score - 1)
          activeCurrentPlayer = {
            ...activeCurrentPlayer,
            killerLives: nextLives,
            score: nextLives,
            isEliminated: nextLives === 0,
          }
          updatedPlayers[state.currentPlayerIndex] = activeCurrentPlayer
        } else {
          activeCurrentPlayer = {
            ...activeCurrentPlayer,
            killerIsActive: true,
          }
          updatedPlayers[state.currentPlayerIndex] = activeCurrentPlayer
        }
      } else if (activeCurrentPlayer.killerIsActive) {
        const opponentIndex = updatedPlayers.findIndex(
          (player, playerIndex) =>
            playerIndex !== state.currentPlayerIndex &&
            !player.isEliminated &&
            player.killerTarget === nextDart.hit.segment,
        )

        if (opponentIndex !== -1) {
          const opponent = updatedPlayers[opponentIndex]
          const nextLives = Math.max(0, opponent.score - 1)
          updatedPlayers[opponentIndex] = {
            ...opponent,
            killerLives: nextLives,
            score: nextLives,
            isEliminated: nextLives === 0,
          }
          turnTotal += 1
        }
      }
    }

    const survivors = updatedPlayers.filter((player) => !player.isEliminated)

    if (survivors.length === 1) {
      isWinningThrow = true
      winnerId = survivors[0].id
      statusMessage = `${survivors[0].name} wins Killer.`
      break
    }
  }

  const nextTurn: TurnState = {
    ...cloneTurn(state.turn),
    darts: normalizedDarts,
    turnTotal,
    isBust: false,
    isComplete:
      normalizedDarts.length === 3 ||
      isWinningThrow ||
      Boolean(updatedPlayers[state.currentPlayerIndex].isEliminated),
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
    winnerId,
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

  let nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length

  if (state.mode.type === 'killer') {
    for (let offset = 1; offset <= state.players.length; offset += 1) {
      const candidateIndex =
        (state.currentPlayerIndex + offset) % state.players.length

      if (!state.players[candidateIndex].isEliminated) {
        nextPlayerIndex = candidateIndex
        break
      }
    }
  }

  const nextPlayer = state.players[nextPlayerIndex]

  return {
    ...state,
    currentPlayerIndex: nextPlayerIndex,
    turn: createTurnState(nextPlayer, state.turn.turnIndex + 1, state.players),
    statusMessage,
    lastUpdatedAt: getNowTimestamp(),
  }
}

export function createGame({ playerNames, mode }: CreateGameInput): GameState {
  const players = playerNames.map((name, index) => {
    const playerName = name.trim() || `Player ${index + 1}`
    const basePlayer = {
      id: `player-${index + 1}`,
      name: playerName,
      score: getStartingScore(mode),
    }

    if (mode.type === 'round-clock') {
      return {
        ...basePlayer,
        roundClockTarget: 1,
      }
    }

    if (mode.type === 'killer') {
      return {
        ...basePlayer,
        killerTarget: KILLER_TARGETS[index],
        killerLives: mode.lives,
        killerIsActive: false,
        isEliminated: false,
      }
    }

    return basePlayer
  })

  return {
    status: 'in_progress',
    mode,
    players,
    currentPlayerIndex: 0,
    turn: createTurnState(players[0], 0, players),
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
  const startingPlayer = state.turn.startingPlayers?.[state.currentPlayerIndex]
  let turnMessage: string

  if (state.mode.type === 'round-clock') {
    turnMessage =
      state.turn.turnTotal > 0
        ? `${currentPlayer.name} advances to ${currentPlayer.score}.`
        : `${currentPlayer.name} stays on ${currentPlayer.score}.`
  } else if (state.mode.type === 'killer') {
    const becameKiller =
      currentPlayer.killerIsActive && !startingPlayer?.killerIsActive

    if (currentPlayer.isEliminated) {
      turnMessage = `${currentPlayer.name} is eliminated.`
    } else if (state.turn.turnTotal > 0) {
      turnMessage = `${currentPlayer.name} took ${formatLifeCount(state.turn.turnTotal)}.`
    } else if (becameKiller) {
      turnMessage = `${currentPlayer.name} is now a killer.`
    } else {
      turnMessage = `${currentPlayer.name} did not take a life.`
    }
  } else {
    turnMessage = state.turn.isBust
      ? `${currentPlayer.name} busts. Score returns to ${state.turn.startingScore}.`
      : `${currentPlayer.name} scored ${state.turn.turnTotal}.`
  }

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
