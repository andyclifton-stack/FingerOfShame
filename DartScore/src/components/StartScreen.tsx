import { useState, type FormEvent } from 'react'
import type { CreateGameInput, FinishRule, GameMode, GameState } from '../types/game'
import { formatModeLabel, formatShortModeLabel } from '../logic/gameModePresentation'
import { PlayerSetup } from './PlayerSetup'

interface StartScreenProps {
  savedGame: GameState | null
  onResumeGame: () => void
  onStartGame: (config: CreateGameInput) => void
}

function buildInitialNames(count: number): string[] {
  return Array.from({ length: count }, (_, index) => `Player ${index + 1}`)
}

function describeSavedGame(savedGame: GameState): string {
  const currentPlayer = savedGame.players[savedGame.currentPlayerIndex]

  return `${formatShortModeLabel(savedGame.mode)} - ${currentPlayer.name} to throw`
}

type SetupMode = '301' | '501' | 'round-clock' | 'killer' | 'free'

function buildMode(
  modeChoice: SetupMode,
  finishRule: FinishRule,
  freeTargetScore: string,
  killerLives: number,
): GameMode {
  if (modeChoice === '301' || modeChoice === '501') {
    return {
      type: 'x01',
      startingScore: Number.parseInt(modeChoice, 10),
      finishRule,
    }
  }

  if (modeChoice === 'round-clock') {
    return {
      type: 'round-clock',
      finalTarget: 20,
    }
  }

  if (modeChoice === 'killer') {
    return {
      type: 'killer',
      lives: killerLives,
    }
  }

  return {
    type: 'free',
    targetScore: Math.max(
      1,
      Number.parseInt(freeTargetScore, 10) || 100,
    ),
  }
}

export function StartScreen({
  savedGame,
  onResumeGame,
  onStartGame,
}: StartScreenProps) {
  const [modeChoice, setModeChoice] = useState<SetupMode>('501')
  const [playerCount, setPlayerCount] = useState(2)
  const [playerNames, setPlayerNames] = useState<string[]>(buildInitialNames(4))
  const [finishRule, setFinishRule] = useState<FinishRule>('double-out')
  const [freeTargetScore, setFreeTargetScore] = useState('100')
  const [killerLives, setKillerLives] = useState(3)
  const selectedMode = buildMode(
    modeChoice,
    finishRule,
    freeTargetScore,
    killerLives,
  )
  const minPlayers = modeChoice === 'killer' ? 2 : 1

  const handleModeSelect = (nextMode: SetupMode) => {
    setModeChoice(nextMode)

    if (nextMode === 'killer' && playerCount < 2) {
      setPlayerCount(2)
    }
  }

  const handlePlayerCountChange = (nextCount: number) => {
    setPlayerCount(Math.max(minPlayers, nextCount))
    setPlayerNames((currentNames) =>
      Array.from(
        { length: 4 },
        (_, index) => currentNames[index] ?? `Player ${index + 1}`,
      ),
    )
  }

  const handlePlayerNameChange = (index: number, name: string) => {
    setPlayerNames((currentNames) =>
      currentNames.map((currentName, currentIndex) =>
        currentIndex === index ? name : currentName,
      ),
    )
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const safePlayerCount = Math.max(minPlayers, playerCount)

    onStartGame({
      playerNames: playerNames.slice(0, safePlayerCount),
      mode: selectedMode,
    })
  }

  return (
    <section className="screen start-screen">
      <div className="hero-card panel">
        <span className="eyebrow">DartScore</span>
        <h1>Score darts with match-night precision.</h1>
        <p>
          Built for phone-side scoring with reliable rules, fast turn review,
          and a precise interactive dartboard.
        </p>

        {savedGame && (
          <div className="resume-card">
            <div>
              <strong>Resume unfinished game</strong>
              <p>{describeSavedGame(savedGame)}</p>
            </div>
            <button
              className="button button--accent"
              type="button"
              onClick={onResumeGame}
            >
              Resume Game
            </button>
          </div>
        )}
      </div>

      <form className="setup-grid" onSubmit={handleSubmit}>
        <section className="panel">
          <div className="section-heading">
            <span className="eyebrow">Mode</span>
            <h2>Choose the match</h2>
          </div>

          <div className="mode-grid">
            <button
              className={`mode-card ${modeChoice === '301' ? 'is-active' : ''}`}
              type="button"
              onClick={() => handleModeSelect('301')}
            >
              <span>301</span>
              <strong>Countdown</strong>
              <small>Short checkout game with busts and finish rules.</small>
            </button>

            <button
              className={`mode-card ${modeChoice === '501' ? 'is-active' : ''}`}
              type="button"
              onClick={() => handleModeSelect('501')}
            >
              <span>501</span>
              <strong>Countdown</strong>
              <small>Match checkout game with busts and finish rules.</small>
            </button>

            <button
              className={`mode-card ${modeChoice === 'round-clock' ? 'is-active' : ''}`}
              type="button"
              onClick={() => handleModeSelect('round-clock')}
            >
              <span>1-20</span>
              <strong>Round the Clock</strong>
              <small>Hit each number in order. First through 20 wins.</small>
            </button>

            <button
              className={`mode-card ${modeChoice === 'killer' ? 'is-active' : ''}`}
              type="button"
              onClick={() => handleModeSelect('killer')}
            >
              <span>Lives</span>
              <strong>Killer</strong>
              <small>Own your double, then take lives from opponents.</small>
            </button>

            <button
              className={`mode-card ${modeChoice === 'free' ? 'is-active' : ''}`}
              type="button"
              onClick={() => handleModeSelect('free')}
            >
              <span>Practice</span>
              <strong>Free Scoring</strong>
              <small>Build scores upward to a target for casual sessions.</small>
            </button>
          </div>

          {(modeChoice === '301' || modeChoice === '501') && (
            <label className="field">
              <span>Finish rule</span>
              <select
                value={finishRule}
                onChange={(event) =>
                  setFinishRule(event.target.value as FinishRule)
                }
              >
                <option value="double-out">Double-out</option>
                <option value="straight">Normal finish</option>
              </select>
            </label>
          )}

          {modeChoice === 'free' && (
            <label className="field">
              <span>Target score</span>
              <input
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                value={freeTargetScore}
                onChange={(event) => setFreeTargetScore(event.target.value)}
              />
            </label>
          )}

          {modeChoice === 'killer' && (
            <label className="field">
              <span>Lives per player</span>
              <select
                value={killerLives}
                onChange={(event) =>
                  setKillerLives(Number.parseInt(event.target.value, 10))
                }
              >
                {[3, 5, 7].map((lifeCount) => (
                  <option key={lifeCount} value={lifeCount}>
                    {lifeCount}
                  </option>
                ))}
              </select>
            </label>
          )}
        </section>

        <PlayerSetup
          minPlayers={minPlayers}
          playerCount={playerCount}
          playerNames={playerNames}
          onPlayerCountChange={handlePlayerCountChange}
          onPlayerNameChange={handlePlayerNameChange}
        />

        <section className="panel launch-panel">
          <div className="section-heading">
            <span className="eyebrow">Ready</span>
            <h2>Open the board</h2>
          </div>

          <div className="launch-summary">
            <div>
              <span>Mode</span>
              <strong>{formatModeLabel(selectedMode)}</strong>
            </div>
            <div>
              <span>Players</span>
              <strong>{Math.max(minPlayers, playerCount)}</strong>
            </div>
          </div>

          <button className="button button--accent button--large" type="submit">
            Start Game
          </button>
        </section>
      </form>
    </section>
  )
}
