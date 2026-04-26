import { describe, expect, it } from 'vitest'
import type { DartThrowInput, GameState } from '../types/game'
import {
  applyDartThrow,
  createGame,
  endTurn,
  undoLastDart,
} from './gameEngine'

function makeThrow(score: number, label = `${score}`): DartThrowInput {
  return {
    x: 0,
    y: 0,
    normalizedX: 0,
    normalizedY: 0,
    hit: {
      ring:
        score === 50
          ? 'innerBull'
          : score === 25
            ? 'outerBull'
            : label.startsWith('T')
              ? 'treble'
              : label.startsWith('D')
                ? 'double'
                : 'singleOuter',
      segment: score === 0 || score === 25 || score === 50 ? null : score,
      multiplier: 1,
      score,
      label,
      isFinishDouble: label.startsWith('D') || score === 50,
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
  it('auto-advances to the next player after three darts', () => {
    let state = createGame({
      playerNames: ['Alice', 'Bob'],
      mode: { type: 'free', targetScore: 100 },
    })

    state = applyDartThrow(state, makeThrow(20))
    state = applyDartThrow(state, makeThrow(20))
    state = applyDartThrow(state, makeThrow(20))

    expect(state.currentPlayerIndex).toBe(1)
    expect(state.players[0].score).toBe(60)
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

    expect(state.currentPlayerIndex).toBe(1)
    expect(state.players[0].score).toBe(40)

    state = undoLastDart(state)

    expect(state.currentPlayerIndex).toBe(0)
    expect(state.players[0].score).toBe(40)
    expect(state.turn.darts).toHaveLength(0)
    expect(state.turn.startingScore).toBe(40)
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
})
