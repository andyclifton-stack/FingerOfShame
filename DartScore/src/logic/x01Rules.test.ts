import { describe, expect, it } from 'vitest'
import type { DartboardHit } from '../types/game'
import { applyX01Throw } from './x01Rules'

function makeHit(
  score: number,
  label: string,
  isFinishDouble = false,
): DartboardHit {
  return {
    ring: isFinishDouble ? 'double' : 'singleOuter',
    segment: score,
    multiplier: 1,
    score,
    label,
    isFinishDouble,
  }
}

describe('applyX01Throw', () => {
  it('subtracts a regular scoring dart', () => {
    expect(
      applyX01Throw({
        currentScore: 501,
        hit: makeHit(60, 'T20'),
        finishRule: 'double-out',
      }),
    ).toMatchObject({
      nextScore: 441,
      isBust: false,
      isWinningThrow: false,
    })
  })

  it('busts when the score would go below zero', () => {
    expect(
      applyX01Throw({
        currentScore: 40,
        hit: makeHit(60, 'T20'),
        finishRule: 'double-out',
      }),
    ).toMatchObject({
      isBust: true,
      isWinningThrow: false,
    })
  })

  it('allows a double-out finish', () => {
    expect(
      applyX01Throw({
        currentScore: 40,
        hit: makeHit(40, 'D20', true),
        finishRule: 'double-out',
      }),
    ).toMatchObject({
      nextScore: 0,
      isBust: false,
      isWinningThrow: true,
    })
  })

  it('busts exact zero on a non-double when double-out is enabled', () => {
    expect(
      applyX01Throw({
        currentScore: 20,
        hit: makeHit(20, '20'),
        finishRule: 'double-out',
      }),
    ).toMatchObject({
      isBust: true,
      isWinningThrow: false,
    })
  })

  it('busts if double-out would leave one remaining', () => {
    expect(
      applyX01Throw({
        currentScore: 33,
        hit: makeHit(32, 'D16', true),
        finishRule: 'double-out',
      }),
    ).toMatchObject({
      isBust: true,
      isWinningThrow: false,
    })
  })
})
