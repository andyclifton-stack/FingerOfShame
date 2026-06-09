import { describe, expect, it } from 'vitest'
import type { DartThrowInput, GameState, DartboardHit } from '../types/game'
import {
  applyDartThrow,
  createGame,
  endTurn,
  replaceTurnDart,
  undoLastDart,
} from './gameEngine'

function makeThrow(
  score: number,
  label = `${score}`,
  hitOverrides: Partial<DartboardHit> = {},
): DartThrowInput {
  const segment =
    hitOverrides.segment ??
    (score === 0 || score === 25 || score === 50
      ? null
      : label.startsWith('T') || label.startsWith('D')
        ? Number.parseInt(label.slice(1), 10)
        : score)
  const ring =
    hitOverrides.ring ??
    (score === 50
      ? 'innerBull'
      : score === 25
        ? 'outerBull'
        : label.startsWith('T')
          ? 'treble'
          : label.startsWith('D')
            ? 'double'
            : 'singleOuter')
  const multiplier =
    hitOverrides.multiplier ??
    (ring === 'treble' ? 3 : ring === 'double' || ring === 'innerBull' ? 2 : 1)

  return {
    x: 0,
    y: 0,
    normalizedX: 0,
    normalizedY: 0,
    hit: {
      ring,
      segment,
      multiplier,
      score,
      label,
      isFinishDouble:
        hitOverrides.isFinishDouble ?? (label.startsWith('D') || score === 50),
      ...hitOverrides,
    },
  }
}

function withCurrentScore(state: GameState, score: number): GameState {
  const players = state.players.map((player, index) =>
    index === state.currentPlayerIndex ? { ...player, score } : player,
  )

  return {
    ...state,
    players,
    turn: {
      ...state.turn,
      startingScore: score,
    },
  }
}

describe('gameEngine', () => {
  it('starts an explicit 301 countdown game', () => {
    const state = createGame({
      playerNames: ['Alice', 'Bob'],
      mode: { type: 'x01', startingScore: 301, finishRule: 'double-out' },
    })

    expect(state.players[0].score).toBe(301)
    expect(state.turn.startingScore).toBe(301)
  })

  it('waits for review after three darts before advancing', () => {
    let state = createGame({
      playerNames: ['Alice', 'Bob'],
      mode: { type: 'free', targetScore: 100 },
    })

    state = applyDartThrow(state, makeThrow(20))
    state = applyDartThrow(state, makeThrow(20))
    state = applyDartThrow(state, makeThrow(20))

    expect(state.currentPlayerIndex).toBe(0)
    expect(state.players[0].score).toBe(60)
    expect(state.turn.darts).toHaveLength(3)
    expect(state.turn.isComplete).toBe(true)

    state = endTurn(state)

    expect(state.currentPlayerIndex).toBe(1)
    expect(state.turn.darts).toHaveLength(0)
  })

  it('ends a turn manually before all three darts are used', () => {
    let state = createGame({
      playerNames: ['Alice', 'Bob'],
      mode: { type: 'free', targetScore: 100 },
    })

    state = applyDartThrow(state, makeThrow(20))
    state = endTurn(state)

    expect(state.currentPlayerIndex).toBe(1)
    expect(state.players[0].score).toBe(20)
    expect(state.turn.playerId).toBe('player-2')
  })

  it('undoes the last dart and restores the prior score and turn', () => {
    let state = createGame({
      playerNames: ['Alice', 'Bob'],
      mode: { type: 'free', targetScore: 100 },
    })

    state = applyDartThrow(state, makeThrow(20))
    state = applyDartThrow(state, makeThrow(40, 'D20'))
    state = undoLastDart(state)

    expect(state.players[0].score).toBe(20)
    expect(state.turn.darts).toHaveLength(1)
    expect(state.turn.turnTotal).toBe(20)
  })

  it('restores the pre-bust state when undoing a busting dart', () => {
    let state = createGame({
      playerNames: ['Alice', 'Bob'],
      mode: { type: 'x01', startingScore: 501, finishRule: 'double-out' },
    })

    state = withCurrentScore(state, 40)
    state = applyDartThrow(state, makeThrow(60, 'T20'))

    expect(state.currentPlayerIndex).toBe(0)
    expect(state.players[0].score).toBe(40)
    expect(state.turn.isBust).toBe(true)
    expect(state.turn.isComplete).toBe(true)

    state = undoLastDart(state)

    expect(state.currentPlayerIndex).toBe(0)
    expect(state.players[0].score).toBe(40)
    expect(state.turn.darts).toHaveLength(0)
    expect(state.turn.startingScore).toBe(40)
  })

  it('recalculates the active turn when editing a confirmed dart', () => {
    let state = createGame({
      playerNames: ['Alice', 'Bob'],
      mode: { type: 'free', targetScore: 100 },
    })

    state = applyDartThrow(state, makeThrow(20))
    state = applyDartThrow(state, makeThrow(40, 'D20'))
    state = replaceTurnDart(state, state.turn.darts[1].id, makeThrow(10))

    expect(state.players[0].score).toBe(30)
    expect(state.turn.turnTotal).toBe(30)
    expect(state.turn.darts[1].score).toBe(10)
  })

  it('lets a busting dart be edited back to valid play', () => {
    let state = createGame({
      playerNames: ['Alice', 'Bob'],
      mode: { type: 'x01', startingScore: 501, finishRule: 'double-out' },
    })

    state = withCurrentScore(state, 40)
    state = applyDartThrow(state, makeThrow(60, 'T20'))
    state = replaceTurnDart(state, state.turn.darts[0].id, makeThrow(20, 'D10'))

    expect(state.players[0].score).toBe(20)
    expect(state.turn.isBust).toBe(false)
    expect(state.turn.isComplete).toBe(false)
  })

  it('marks the game over when a player hits the target score', () => {
    let state = createGame({
      playerNames: ['Alice', 'Bob'],
      mode: { type: 'free', targetScore: 50 },
    })

    state = applyDartThrow(state, makeThrow(50, '50'))

    expect(state.status).toBe('game_over')
    expect(state.winnerId).toBe('player-1')
  })

  it('undoes an accidental winning throw from game over', () => {
    let state = createGame({
      playerNames: ['Alice', 'Bob'],
      mode: { type: 'free', targetScore: 50 },
    })

    state = applyDartThrow(state, makeThrow(50, '50'))
    state = undoLastDart(state)

    expect(state.status).toBe('in_progress')
    expect(state.winnerId).toBeNull()
    expect(state.players[0].score).toBe(0)
    expect(state.turn.darts).toHaveLength(0)
  })

  it('advances round the clock only when the current target is hit', () => {
    let state = createGame({
      playerNames: ['Alice', 'Bob'],
      mode: { type: 'round-clock', finalTarget: 20 },
    })

    state = applyDartThrow(state, makeThrow(5, '5'))
    state = applyDartThrow(state, makeThrow(1, '1'))

    expect(state.players[0].score).toBe(2)
    expect(state.turn.turnTotal).toBe(1)
  })

  it('wins round the clock after hitting the final target', () => {
    let state = createGame({
      playerNames: ['Alice', 'Bob'],
      mode: { type: 'round-clock', finalTarget: 20 },
    })

    state = withCurrentScore(state, 19)
    state = applyDartThrow(state, makeThrow(19, '19'))
    state = applyDartThrow(state, makeThrow(20, '20'))

    expect(state.status).toBe('game_over')
    expect(state.winnerId).toBe('player-1')
  })

  it('activates a killer and lets them take an opponent life', () => {
    let state = createGame({
      playerNames: ['Alice', 'Bob'],
      mode: { type: 'killer', lives: 3 },
    })

    expect(state.players[0].killerTarget).toBe(20)
    expect(state.players[1].killerTarget).toBe(19)

    state = applyDartThrow(state, makeThrow(40, 'D20'))
    state = applyDartThrow(state, makeThrow(38, 'D19'))

    expect(state.players[0].killerIsActive).toBe(true)
    expect(state.players[1].score).toBe(2)
    expect(state.turn.turnTotal).toBe(1)
  })

  it('ends killer when one player remains', () => {
    let state = createGame({
      playerNames: ['Alice', 'Bob'],
      mode: { type: 'killer', lives: 1 },
    })

    state = applyDartThrow(state, makeThrow(40, 'D20'))
    state = applyDartThrow(state, makeThrow(38, 'D19'))

    expect(state.status).toBe('game_over')
    expect(state.winnerId).toBe('player-1')
    expect(state.players[1].isEliminated).toBe(true)
  })

  it('skips eliminated players in killer', () => {
    let state = createGame({
      playerNames: ['Alice', 'Bob', 'Charlie'],
      mode: { type: 'killer', lives: 1 },
    })

    state = applyDartThrow(state, makeThrow(40, 'D20'))
    state = applyDartThrow(state, makeThrow(38, 'D19'))
    state = endTurn(state)

    expect(state.currentPlayerIndex).toBe(2)
    expect(state.turn.playerId).toBe('player-3')
  })
})
