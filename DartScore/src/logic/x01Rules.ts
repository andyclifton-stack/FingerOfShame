import type { DartboardHit, FinishRule } from '../types/game'

export interface X01ThrowOutcome {
  nextScore: number
  isBust: boolean
  isWinningThrow: boolean
  bustReason: string | null
}

interface ApplyX01ThrowInput {
  currentScore: number
  hit: DartboardHit
  finishRule: FinishRule
}

export function applyX01Throw({
  currentScore,
  hit,
  finishRule,
}: ApplyX01ThrowInput): X01ThrowOutcome {
  const nextScore = currentScore - hit.score

  if (nextScore < 0) {
    return {
      nextScore: currentScore,
      isBust: true,
      isWinningThrow: false,
      bustReason: 'Bust: score went below zero.',
    }
  }

  if (finishRule === 'double-out' && nextScore === 1) {
    return {
      nextScore: currentScore,
      isBust: true,
      isWinningThrow: false,
      bustReason: 'Bust: double-out does not allow leaving 1.',
    }
  }

  if (nextScore === 0 && finishRule === 'double-out' && !hit.isFinishDouble) {
    return {
      nextScore: currentScore,
      isBust: true,
      isWinningThrow: false,
      bustReason: 'Bust: finish must be a double or inner bull.',
    }
  }

  if (nextScore === 0) {
    return {
      nextScore,
      isBust: false,
      isWinningThrow: true,
      bustReason: null,
    }
  }

  return {
    nextScore,
    isBust: false,
    isWinningThrow: false,
    bustReason: null,
  }
}
