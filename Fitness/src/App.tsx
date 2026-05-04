import { useEffect, useMemo, useState } from 'react'
import { images } from './assets'
import { programCatalog, restart30Program } from './data/restart30'
import { completeProgramDay, listenFitnessState, saveQuickLog, startProgramRun } from './logic/firebase'
import { completedDayNumbers, getNextDay, getProgressPercent, isDayComplete } from './logic/progress'
import type { ActiveRun, FitnessState, ProgramDay, ProgramDefinition, ProgramStep, QuickLog } from './types'

type Tab = 'dashboard' | 'programs' | 'tools'

interface SessionState {
  dayNumber: number
  initialStepIndex: number
}

interface SavedSession {
  programId: string
  runId: string
  dayNumber: number
  stepIndex: number
}

const SESSION_KEY = 'ac_fitness_session_v2'

const initialFitnessState: FitnessState = {
  activeRun: null,
  completionsByRun: {},
  quickLogs: {},
}

const readSavedSession = (): SavedSession | null => {
  const raw = window.localStorage.getItem(SESSION_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as SavedSession
    if (!parsed.programId || !parsed.runId || !parsed.dayNumber) return null
    return parsed
  } catch {
    return null
  }
}

const clearSavedSession = () => window.localStorage.removeItem(SESSION_KEY)

const formatDate = (timestamp: number) =>
  new Date(timestamp).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
  })

const formatSeconds = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const remaining = seconds % 60
  return `${minutes}:${remaining.toString().padStart(2, '0')}`
}

const stepAmountLabel = (step: ProgramStep): string => {
  if (step.kind === 'reps') return step.amount
  if (step.kind === 'hold' || step.kind === 'timer') return formatSeconds(step.durationSeconds)
  return 'Read'
}

const getActiveProgram = (activeRun: ActiveRun | null): ProgramDefinition =>
  programCatalog.find((program) => program.id === activeRun?.programId) ?? restart30Program

function App() {
  const [fitnessState, setFitnessState] = useState<FitnessState>(initialFitnessState)
  const [tab, setTab] = useState<Tab>('dashboard')
  const [session, setSession] = useState<SessionState | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => listenFitnessState(setFitnessState, setError), [])

  const activeProgram = getActiveProgram(fitnessState.activeRun)
  const nextDay = getNextDay(activeProgram, fitnessState.activeRun, fitnessState.completionsByRun)
  const completedDays = completedDayNumbers(fitnessState.activeRun, fitnessState.completionsByRun)
  const progressPercent = getProgressPercent(activeProgram, fitnessState.activeRun, fitnessState.completionsByRun)
  const activeDay = session ? activeProgram.days.find((day) => day.dayNumber === session.dayNumber) ?? null : null
  const savedSession = session ? null : readSavedSession()
  const validSavedSession =
    savedSession && fitnessState.activeRun && savedSession.runId === fitnessState.activeRun.runId
      ? savedSession
      : null

  const startDay = (day: ProgramDay, initialStepIndex = 0) => {
    setSession({ dayNumber: day.dayNumber, initialStepIndex })
    setTab('dashboard')
  }

  const handleStartProgram = async () => {
    try {
      await startProgramRun(restart30Program.id)
      clearSavedSession()
      setError(null)
      setTab('dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start program')
    }
  }

  const handleCompleteDay = async (day: ProgramDay) => {
    if (!fitnessState.activeRun) return
    try {
      await completeProgramDay(fitnessState.activeRun, day)
      clearSavedSession()
      setError(null)
      setSession(null)
      setTab('dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete day')
    }
  }

  if (session && activeDay && fitnessState.activeRun) {
    return (
      <SessionView
        activeRun={fitnessState.activeRun}
        day={activeDay}
        initialStepIndex={session.initialStepIndex}
        onBack={() => setSession(null)}
        onComplete={() => handleCompleteDay(activeDay)}
      />
    )
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Andy Clifton Fitness</p>
          <h1>AC Fitness</h1>
        </div>
        <div className="level-pill">{fitnessState.activeRun ? 'Restart' : 'Ready'}</div>
      </header>

      {error ? <div className="alert">Firebase connection issue: {error}</div> : null}

      <main className="main-content">
        {tab === 'dashboard' ? (
          <Dashboard
            activeProgram={activeProgram}
            activeRun={fitnessState.activeRun}
            completedDays={completedDays}
            nextDay={nextDay}
            progressPercent={progressPercent}
            savedSession={validSavedSession}
            onStartProgram={handleStartProgram}
            onStartDay={startDay}
            onResume={(saved) => {
              const day = activeProgram.days.find((programDay) => programDay.dayNumber === saved.dayNumber)
              if (day) startDay(day, saved.stepIndex)
            }}
          />
        ) : null}

        {tab === 'programs' ? (
          <Programs
            activeProgram={activeProgram}
            activeRun={fitnessState.activeRun}
            completionsByRun={fitnessState.completionsByRun}
            nextDay={nextDay}
            onStartProgram={handleStartProgram}
            onStartDay={startDay}
          />
        ) : null}

        {tab === 'tools' ? <Tools fitnessState={fitnessState} /> : null}
      </main>

      <nav className="bottom-nav" aria-label="Fitness navigation">
        <button className={tab === 'dashboard' ? 'active' : ''} type="button" onClick={() => setTab('dashboard')}>
          Dashboard
        </button>
        <button className={tab === 'programs' ? 'active' : ''} type="button" onClick={() => setTab('programs')}>
          Programs
        </button>
        <button className={tab === 'tools' ? 'active' : ''} type="button" onClick={() => setTab('tools')}>
          Tools
        </button>
      </nav>
    </div>
  )
}

interface DashboardProps {
  activeProgram: ProgramDefinition
  activeRun: ActiveRun | null
  completedDays: number[]
  nextDay: ProgramDay | null
  progressPercent: number
  savedSession: SavedSession | null
  onStartProgram: () => Promise<void>
  onStartDay: (day: ProgramDay, initialStepIndex?: number) => void
  onResume: (saved: SavedSession) => void
}

function Dashboard({
  activeProgram,
  activeRun,
  completedDays,
  nextDay,
  progressPercent,
  savedSession,
  onStartProgram,
  onStartDay,
  onResume,
}: DashboardProps) {
  const upcomingDays = activeProgram.days.filter((day) => nextDay && day.dayNumber > nextDay.dayNumber).slice(0, 2)

  if (!activeRun) {
    return (
      <section className="hero-panel">
        <img src={images.planWizard} alt="" />
        <div className="panel-body">
          <p className="status-label">No active plan</p>
          <h2>Start the 30-Day Restart</h2>
          <p>{restart30Program.subtitle}</p>
          <button className="primary-button" type="button" onClick={onStartProgram}>
            Start Program
          </button>
        </div>
      </section>
    )
  }

  if (!nextDay) {
    return (
      <section className="hero-panel">
        <img src={images.sessionDone} alt="" />
        <div className="panel-body">
          <p className="status-label">30 of 30 complete</p>
          <h2>Program complete</h2>
          <p>You finished the first month still able and willing to continue. That is the real win.</p>
          <button className="secondary-button" type="button" onClick={onStartProgram}>
            Start Again
          </button>
        </div>
      </section>
    )
  }

  return (
    <>
      <section className="progress-panel">
        <div>
          <p className="status-label">{activeProgram.title}</p>
          <h2>Day {nextDay.dayNumber}: {nextDay.title}</h2>
        </div>
        <div className="progress-copy">{completedDays.length}/{activeProgram.lengthDays}</div>
        <div className="progress-track" aria-label={`${progressPercent}% complete`}>
          <div style={{ width: `${progressPercent}%` }} />
        </div>
      </section>

      <section className="hero-panel">
        <img src={nextDay.image} alt="" />
        <div className="panel-body">
          <p className={`status-label type-${nextDay.type}`}>{nextDay.type}</p>
          <h2>{nextDay.title}</h2>
          <p>{nextDay.description}</p>
          <div className="button-row">
            <button className="primary-button" type="button" onClick={() => onStartDay(nextDay)}>
              Start Day {nextDay.dayNumber}
            </button>
            {savedSession ? (
              <button className="secondary-button" type="button" onClick={() => onResume(savedSession)}>
                Resume
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="list-panel">
        <h3>Coming Up</h3>
        {upcomingDays.map((day) => (
          <div className="day-row" key={day.dayNumber}>
            <span>Day {day.dayNumber}</span>
            <strong>{day.title}</strong>
          </div>
        ))}
      </section>
    </>
  )
}

interface ProgramsProps {
  activeProgram: ProgramDefinition
  activeRun: ActiveRun | null
  completionsByRun: FitnessState['completionsByRun']
  nextDay: ProgramDay | null
  onStartProgram: () => Promise<void>
  onStartDay: (day: ProgramDay) => void
}

function Programs({ activeProgram, activeRun, completionsByRun, nextDay, onStartProgram, onStartDay }: ProgramsProps) {
  return (
    <>
      <section className="program-card">
        <img src={images.planWizard} alt="" />
        <div>
          <p className="status-label">Program Template</p>
          <h2>{restart30Program.title}</h2>
          <p>{restart30Program.description}</p>
          <ul className="safety-list">
            {restart30Program.safetyNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
          <button className="primary-button" type="button" onClick={onStartProgram}>
            {activeRun?.programId === restart30Program.id ? 'Restart Program' : 'Start Program'}
          </button>
        </div>
      </section>

      {activeRun ? (
        <section className="list-panel">
          <h3>30-Day Schedule</h3>
          {activeProgram.days.map((day) => {
            const complete = isDayComplete(day.dayNumber, activeRun, completionsByRun)
            const isNext = nextDay?.dayNumber === day.dayNumber
            return (
              <div className={`day-row schedule-row ${complete ? 'complete' : ''}`} key={day.dayNumber}>
                <span>Day {day.dayNumber}</span>
                <strong>{day.title}</strong>
                <em>{day.type}</em>
                {isNext ? (
                  <button className="small-button" type="button" onClick={() => onStartDay(day)}>
                    Start
                  </button>
                ) : null}
              </div>
            )
          })}
        </section>
      ) : null}
    </>
  )
}

function Tools({ fitnessState }: { fitnessState: FitnessState }) {
  const [activityType, setActivityType] = useState<QuickLog['activityType']>('reps')
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [distance, setDistance] = useState('')
  const [saving, setSaving] = useState(false)
  const [toolError, setToolError] = useState<string | null>(null)

  const history = useMemo(() => {
    const completions = Object.values(fitnessState.completionsByRun)
      .flatMap((run) => Object.values(run))
      .map((record) => ({
        id: `${record.runId}_${record.dayNumber}`,
        title: `Day ${record.dayNumber}: ${record.dayTitle}`,
        detail: record.dayType,
        timestamp: record.completedAt,
      }))
    const quickLogs = Object.values(fitnessState.quickLogs).map((log) => ({
      id: log.id,
      title: log.name,
      detail: log.summary,
      timestamp: log.timestamp,
    }))
    return [...completions, ...quickLogs].sort((a, b) => b.timestamp - a.timestamp)
  }, [fitnessState.completionsByRun, fitnessState.quickLogs])

  const submitQuickLog = async () => {
    const trimmedName = name.trim() || (activityType === 'reps' ? 'Strength' : 'Cardio')
    const summary = activityType === 'reps' ? `${amount || '0'} reps` : `${amount || '0'} mins${distance ? ` (${distance})` : ''}`
    setSaving(true)
    try {
      await saveQuickLog(activityType, trimmedName, summary)
      setToolError(null)
      setName('')
      setAmount('')
      setDistance('')
    } catch (err) {
      setToolError(err instanceof Error ? err.message : 'Unable to save quick log')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <section className="form-panel">
        <h2>Quick Log</h2>
        {toolError ? <div className="alert">{toolError}</div> : null}
        <label>
          Activity Type
          <select value={activityType} onChange={(event) => setActivityType(event.target.value as QuickLog['activityType'])}>
            <option value="reps">Reps</option>
            <option value="cardio">Cardio / Time</option>
          </select>
        </label>
        <label>
          Activity Name
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Pushups" />
        </label>
        <div className="form-grid">
          <label>
            {activityType === 'reps' ? 'Count' : 'Minutes'}
            <input inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder={activityType === 'reps' ? '10' : '30'} />
          </label>
          {activityType === 'cardio' ? (
            <label>
              Distance
              <input value={distance} onChange={(event) => setDistance(event.target.value)} placeholder="Optional" />
            </label>
          ) : null}
        </div>
        <button className="primary-button" type="button" disabled={saving} onClick={submitQuickLog}>
          {saving ? 'Saving...' : 'Save to History'}
        </button>
      </section>

      <section className="list-panel">
        <h3>History</h3>
        {history.length === 0 ? <p className="muted">No v2 logs yet.</p> : null}
        {history.map((entry) => (
          <div className="history-row" key={entry.id}>
            <span>{formatDate(entry.timestamp)}</span>
            <div>
              <strong>{entry.title}</strong>
              <p>{entry.detail}</p>
            </div>
          </div>
        ))}
      </section>
    </>
  )
}

interface SessionViewProps {
  activeRun: ActiveRun
  day: ProgramDay
  initialStepIndex: number
  onBack: () => void
  onComplete: () => Promise<void>
}

function SessionView({ activeRun, day, initialStepIndex, onBack, onComplete }: SessionViewProps) {
  const [stepIndex, setStepIndex] = useState(initialStepIndex)
  const [saving, setSaving] = useState(false)
  const step = day.steps[stepIndex]
  const isLastStep = stepIndex === day.steps.length - 1

  useEffect(() => {
    const saved: SavedSession = {
      programId: activeRun.programId,
      runId: activeRun.runId,
      dayNumber: day.dayNumber,
      stepIndex,
    }
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(saved))
  }, [activeRun.programId, activeRun.runId, day.dayNumber, stepIndex])

  const next = async () => {
    if (!isLastStep) {
      setStepIndex((current) => current + 1)
      return
    }
    setSaving(true)
    await onComplete()
    setSaving(false)
  }

  return (
    <div className="session-shell">
      <header className="session-header">
        <button className="text-button" type="button" onClick={onBack}>
          Back
        </button>
        <div>
          <p className="status-label">Day {day.dayNumber}</p>
          <h1>{day.title}</h1>
        </div>
        <span>{stepIndex + 1}/{day.steps.length}</span>
      </header>

      <div className="segment-bar">
        {day.steps.map((programStep, index) => (
          <div className={index < stepIndex ? 'done' : index === stepIndex ? 'active' : ''} key={programStep.id} />
        ))}
      </div>

      <main className="session-card">
        <img src={step.image ?? day.image} alt="" />
        <p className="status-label">{stepAmountLabel(step)}</p>
        <h2>{step.title}</h2>
        <p>{step.description}</p>

        {step.kind === 'timer' || step.kind === 'hold' ? <TimerControls key={`${step.id}-${stepIndex}`} durationSeconds={step.durationSeconds} /> : null}
        {step.kind === 'reps' ? <div className="rep-counter">{step.amount}</div> : null}
        {step.kind === 'info' && step.prompts ? (
          <ul className="prompt-list">
            {step.prompts.map((prompt) => (
              <li key={prompt}>{prompt}</li>
            ))}
          </ul>
        ) : null}

        {step.details ? (
          <details className="instruction-box" open>
            <summary>Instructions</summary>
            <ul>
              {step.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          </details>
        ) : null}

        <div className="button-row">
          <button className="secondary-button" type="button" disabled={stepIndex === 0} onClick={() => setStepIndex((current) => Math.max(0, current - 1))}>
            Back
          </button>
          <button className="primary-button" type="button" disabled={saving} onClick={next}>
            {saving ? 'Saving...' : isLastStep ? 'Complete Day' : 'Done'}
          </button>
        </div>
      </main>
    </div>
  )
}

function TimerControls({ durationSeconds }: { durationSeconds: number }) {
  const [remaining, setRemaining] = useState(durationSeconds)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running || remaining <= 0) return undefined

    const intervalId = window.setInterval(() => {
      setRemaining((current) => Math.max(0, current - 1))
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [remaining, running])

  const progress = 1 - remaining / durationSeconds
  const buttonLabel = remaining === 0 ? 'Restart Timer' : running ? 'Pause Timer' : 'Start Timer'

  return (
    <div className="timer-block">
      <div className="timer-ring" style={{ background: `conic-gradient(#10b981 ${progress * 360}deg, #334155 0deg)` }}>
        <span>{formatSeconds(remaining)}</span>
      </div>
      <button
        className="secondary-button"
        type="button"
        onClick={() => {
          if (remaining === 0) {
            setRemaining(durationSeconds)
            setRunning(false)
            return
          }
          setRunning((current) => !current)
        }}
      >
        {buttonLabel}
      </button>
    </div>
  )
}

export default App
