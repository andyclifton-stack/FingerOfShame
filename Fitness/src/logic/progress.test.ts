import { describe, expect, it } from 'vitest'
import { restart30Program } from '../data/restart30'
import type { ActiveRun, CompletionRecord } from '../types'
import { completedDayNumbers, getNextDay, getProgressPercent } from './progress'

const activeRun: ActiveRun = {
  programId: 'restart30',
  runId: 'run_test',
  startedAt: 1,
  pace: 'completion',
  status: 'active',
}

const completion = (dayNumber: number): CompletionRecord => ({
  programId: 'restart30',
  runId: 'run_test',
  dayNumber,
  dayTitle: `Day ${dayNumber}`,
  dayType: 'strength',
  completedAt: dayNumber,
})

describe('restart30 program', () => {
  it('contains the planned 30 days and representative exact sessions', () => {
    expect(restart30Program.days).toHaveLength(30)
    expect(restart30Program.days[0].title).toBe('Bodyweight Session 1')
    expect(restart30Program.days[0].steps.some((step) => step.title.includes('Chair squat') && 'amount' in step && step.amount === '8 reps')).toBe(true)
    expect(restart30Program.days[0].steps.some((step) => step.title === 'Round 1: Chair squat')).toBe(true)
    expect(new Set(restart30Program.days[0].steps.map((step) => step.id)).size).toBe(restart30Program.days[0].steps.length)
    expect(restart30Program.days[15].title).toBe('Walk with gentle intervals')
    expect(restart30Program.days[15].steps.filter((step) => step.title.includes('brisk walk'))).toHaveLength(10)
    expect(restart30Program.days[21].steps.some((step) => step.title.includes('Incline plank') && 'durationSeconds' in step && step.durationSeconds === 20)).toBe(true)
    expect(restart30Program.days[29].steps.some((step) => step.title === '30-day review')).toBe(true)
  })

  it('advances by completion count rather than calendar date', () => {
    const completionsByRun = {
      run_test: {
        day_1: completion(1),
        day_2: completion(2),
      },
    }

    expect(completedDayNumbers(activeRun, completionsByRun)).toEqual([1, 2])
    expect(getNextDay(restart30Program, activeRun, completionsByRun)?.dayNumber).toBe(3)
    expect(getProgressPercent(restart30Program, activeRun, completionsByRun)).toBe(7)
  })

  it('ignores completions from old or inactive runs', () => {
    const completionsByRun = {
      other_run: {
        day_1: completion(1),
      },
    }

    expect(getNextDay(restart30Program, activeRun, completionsByRun)?.dayNumber).toBe(1)
  })
})
