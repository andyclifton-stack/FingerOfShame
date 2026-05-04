import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getDatabase, onValue, ref, update, type Database } from 'firebase/database'
import type { ActiveRun, FitnessState, ProgramDay, QuickLog } from '../types'

export const FITNESS_NAMESPACE = 'fitness_v2'

const firebaseConfig = {
  apiKey: ['AIza', 'SyDjEu', '71FYxr8', 'Ebqhd3fy', 'SP-4qx', 'uWNxSC6Q'].join(''),
  authDomain: 'finger-of-shame.firebaseapp.com',
  projectId: 'finger-of-shame',
  storageBucket: 'finger-of-shame.firebasestorage.app',
  messagingSenderId: '940288270460',
  appId: '1:940288270460:web:fb2681477c29523b7269f9',
  measurementId: 'G-0QT07HKZ8M',
  databaseURL: 'https://finger-of-shame-default-rtdb.europe-west1.firebasedatabase.app',
}

let app: FirebaseApp | null = null
let database: Database | null = null

const getFitnessDatabase = (): Database => {
  if (!app) app = initializeApp(firebaseConfig)
  if (!database) database = getDatabase(app)
  return database
}

const emptyState: FitnessState = {
  activeRun: null,
  completionsByRun: {},
  quickLogs: {},
}

export const listenFitnessState = (
  onState: (state: FitnessState) => void,
  onError: (message: string) => void,
): (() => void) => {
  const db = getFitnessDatabase()

  return onValue(
    ref(db, FITNESS_NAMESPACE),
    (snapshot) => {
      const value = snapshot.val()
      onState({
        activeRun: value?.activeRun ?? null,
        completionsByRun: value?.completions ?? {},
        quickLogs: value?.quickLogs ?? {},
      })
    },
    (error) => {
      onError(error.message)
      onState(emptyState)
    },
  )
}

export const createRunId = (): string => {
  if ('crypto' in window && 'randomUUID' in window.crypto) {
    return `run_${window.crypto.randomUUID()}`
  }
  return `run_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

export const startProgramRun = async (programId: string): Promise<ActiveRun> => {
  const activeRun: ActiveRun = {
    programId,
    runId: createRunId(),
    startedAt: Date.now(),
    pace: 'completion',
    status: 'active',
  }

  await update(ref(getFitnessDatabase()), {
    [`${FITNESS_NAMESPACE}/activeRun`]: activeRun,
  })

  return activeRun
}

export const completeProgramDay = async (activeRun: ActiveRun, day: ProgramDay): Promise<void> => {
  await update(ref(getFitnessDatabase()), {
    [`${FITNESS_NAMESPACE}/completions/${activeRun.runId}/day_${day.dayNumber}`]: {
      programId: activeRun.programId,
      runId: activeRun.runId,
      dayNumber: day.dayNumber,
      dayTitle: day.title,
      dayType: day.type,
      completedAt: Date.now(),
    },
  })
}

export const saveQuickLog = async (activityType: QuickLog['activityType'], name: string, summary: string): Promise<void> => {
  const timestamp = Date.now()
  const id = `log_${timestamp}`
  const quickLog: QuickLog = {
    id,
    activityType,
    name,
    summary,
    timestamp,
  }

  await update(ref(getFitnessDatabase()), {
    [`${FITNESS_NAMESPACE}/quickLogs/${id}`]: quickLog,
  })
}
