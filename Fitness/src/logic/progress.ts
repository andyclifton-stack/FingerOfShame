import type { ActiveRun, CompletionRecord, ProgramDay, ProgramDefinition } from '../types'

export const completedDayNumbers = (
  activeRun: ActiveRun | null,
  completionsByRun: Record<string, Record<string, CompletionRecord>>,
): number[] => {
  if (!activeRun) return []
  return Object.values(completionsByRun[activeRun.runId] ?? {})
    .map((record) => record.dayNumber)
    .sort((a, b) => a - b)
}

export const getNextDay = (
  program: ProgramDefinition,
  activeRun: ActiveRun | null,
  completionsByRun: Record<string, Record<string, CompletionRecord>>,
): ProgramDay | null => {
  const completed = new Set(completedDayNumbers(activeRun, completionsByRun))
  return program.days.find((day) => !completed.has(day.dayNumber)) ?? null
}

export const getProgressPercent = (
  program: ProgramDefinition,
  activeRun: ActiveRun | null,
  completionsByRun: Record<string, Record<string, CompletionRecord>>,
): number => Math.round((completedDayNumbers(activeRun, completionsByRun).length / program.lengthDays) * 100)

export const isDayComplete = (
  dayNumber: number,
  activeRun: ActiveRun | null,
  completionsByRun: Record<string, Record<string, CompletionRecord>>,
): boolean => completedDayNumbers(activeRun, completionsByRun).includes(dayNumber)
