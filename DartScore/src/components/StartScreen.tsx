import { useState, type FormEvent } from 'react'
import type { CreateGameInput, FinishRule, GameMode, GameState } from '../types/game'
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
  const modeLabel =
    savedGame.mode.type === 'x01'
      ? `${savedGame.mode.startingScore} ${savedGame.mode.finishRule === 'double-out' ? 'double-out' : 'straight out'}`
      : `Free Scoring to ${savedGame.mode.targetScore}`
  const currentPlayer = savedGame.players[savedGame.currentPlayerIndex]

  return `${modeLabel} - ${currentPlayer.name} to throw`
}

export function StartScreen({
  savedGame,
  onResumeGame,
  onStartGame,
}: StartScreenProps) {
  const [modeType, setModeType] = useState<GameMode['type']>('x01')
  const [playerCount, setPlayerCount] = useState(2)
  const [playerNames, setPlayerNames] = useState<string[]>(buildInitialNames(4))
  const [finishRule, setFinishRule] = useState<FinishRule>('double-out')
  const [freeTargetScore, setFreeTargetScore] = useState('100')

  const handlePlayerCountChange = (nextCount: number) => {
    setPlayerCount(nextCount)
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

    const mode: GameMode =
      modeType === 'x01'
        ? {
            type: 'x01',
            startingScore: 501,
            finishRule,
          }
        : {
            type: 'free',
            targetScore: Math.max(
              1,
              Number.parseInt(freeTargetScore, 10) || 100,
            ),
          }

    onStartGame({
      playerNames: playerNames.slice(0, playerCount),
      mode,
    })
  }

  return (
    <section className="screen start-screen">
      <div className="hero-card panel">
        <span className="eyebrow">DartScore</span>
        <h1>Score live darts by tapping the board.</h1>
        <p>
          Built for tablet-side scoring with reliable rules, clean turn flow,
          and a maths-driven SVG dartboard.
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
              className={`mode-card ${modeType === 'x01' ? 'is-active' : ''}`}
              type="button"
              onClick={() => setModeType('x01')}
            >
              <span>501</span>
              <strong>X01</strong>
              <small>Countdown scoring with busts and finish rules.</small>
            </button>

            <button
              className={`mode-card ${modeType === 'free' ? 'is-active' : ''}`}
              type="button"
              onClick={() => setModeType('free')}
            >
              <span>Practice</span>
              <strong>Free Scoring</strong>
              <small>Build scores upward to a target for casual sessions.</small>
            </button>
          </div>

          {modeType === 'x01' && (
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

          {modeType === 'free' && (
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
        </section>

        <PlayerSetup
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
              <strong>
                {modeType === 'x01'
                  ? `501 - ${finishRule === 'double-out' ? 'Double-out' : 'Normal finish'}`
                  : `Free Scoring - First to ${Math.max(1, Number.parseInt(freeTargetScore, 10) || 100)}`}
              </strong>
            </div>
            <div>
              <span>Players</span>
              <strong>{playerCount}</strong>
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
