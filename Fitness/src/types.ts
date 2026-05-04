export type DayType = 'strength' | 'walk' | 'recovery' | 'rest' | 'review'

export type StepKind = 'timer' | 'reps' | 'hold' | 'info'

export interface ProgramStepBase {
  id: string
  kind: StepKind
  title: string
  description: string
  image?: string
  details?: string[]
}

export interface TimerStep extends ProgramStepBase {
  kind: 'timer'
  durationSeconds: number
  intensity?: 'easy' | 'moderate' | 'brisk'
}

export interface HoldStep extends ProgramStepBase {
  kind: 'hold'
  durationSeconds: number
}

export interface RepsStep extends ProgramStepBase {
  kind: 'reps'
  amount: string
}

export interface InfoStep extends ProgramStepBase {
  kind: 'info'
  prompts?: string[]
}

export type ProgramStep = TimerStep | HoldStep | RepsStep | InfoStep

export interface ProgramDay {
  dayNumber: number
  type: DayType
  title: string
  description: string
  image: string
  estimatedMinutes: number
  steps: ProgramStep[]
  completionCopy: string
}

export interface ProgramDefinition {
  id: string
  title: string
  subtitle: string
  description: string
  lengthDays: number
  safetyNotes: string[]
  days: ProgramDay[]
}

export interface ActiveRun {
  programId: string
  runId: string
  startedAt: number
  pace: 'completion'
  status: 'active'
}

export interface CompletionRecord {
  programId: string
  runId: string
  dayNumber: number
  dayTitle: string
  dayType: DayType
  completedAt: number
}

export interface QuickLog {
  id: string
  activityType: 'reps' | 'cardio'
  name: string
  summary: string
  timestamp: number
}

export interface FitnessState {
  activeRun: ActiveRun | null
  completionsByRun: Record<string, Record<string, CompletionRecord>>
  quickLogs: Record<string, QuickLog>
}
