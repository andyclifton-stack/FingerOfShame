interface PlayerSetupProps {
  playerCount: number
  playerNames: string[]
  onPlayerCountChange: (playerCount: number) => void
  onPlayerNameChange: (index: number, name: string) => void
}

export function PlayerSetup({
  playerCount,
  playerNames,
  onPlayerCountChange,
  onPlayerNameChange,
}: PlayerSetupProps) {
  return (
    <section className="panel player-setup">
      <div className="section-heading">
        <span className="eyebrow">Players</span>
        <h2>Local line-up</h2>
      </div>

      <label className="field">
        <span>Number of players</span>
        <select
          value={playerCount}
          onChange={(event) =>
            onPlayerCountChange(Number.parseInt(event.target.value, 10))
          }
        >
          {[1, 2, 3, 4].map((count) => (
            <option key={count} value={count}>
              {count}
            </option>
          ))}
        </select>
      </label>

      <div className="player-grid">
        {playerNames.slice(0, playerCount).map((playerName, index) => (
          <label className="field" key={`player-${index + 1}`}>
            <span>Player {index + 1}</span>
            <input
              type="text"
              maxLength={24}
              placeholder={`Player ${index + 1}`}
              value={playerName}
              onChange={(event) =>
                onPlayerNameChange(index, event.target.value)
              }
            />
          </label>
        ))}
      </div>
    </section>
  )
}
