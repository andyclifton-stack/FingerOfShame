import type { GameMode, Player } from '../types/game'

export function formatModeLabel(mode: GameMode): string {
  switch (mode.type) {
    case 'x01':
      return `${mode.startingScore} - ${mode.finishRule === 'double-out' ? 'Double-out' : 'Normal finish'}`
    case 'free':
      return `Free Scoring - First to ${mode.targetScore}`
    case 'round-clock':
      return `Round the Clock - 1 to ${mode.finalTarget}`
    case 'killer':
      return `Killer - ${mode.lives} lives`
  }
}

export function formatShortModeLabel(mode: GameMode): string {
  switch (mode.type) {
    case 'x01':
      return `${mode.startingScore} ${mode.finishRule === 'double-out' ? 'double-out' : 'normal finish'}`
    case 'free':
      return `Free Scoring to ${mode.targetScore}`
    case 'round-clock':
      return `Round the Clock`
    case 'killer':
      return `Killer`
  }
}

export function formatScoreLabel(mode: GameMode): string {
  switch (mode.type) {
    case 'x01':
      return 'Remaining'
    case 'free':
      return 'Score'
    case 'round-clock':
      return 'Target'
    case 'killer':
      return 'Lives'
  }
}

export function formatPlayerValue(player: Player, mode: GameMode): string {
  if (mode.type === 'round-clock') {
    return player.score > mode.finalTarget ? 'Done' : `${player.score}`
  }

  return `${player.score}`
}

export function formatPlayerStatus(
  player: Player,
  mode: GameMode,
  isCurrent: boolean,
  isWinner = false,
): string {
  if (isWinner) {
    return 'Winner'
  }

  if (mode.type === 'killer') {
    if (player.isEliminated) {
      return `Out - D${player.killerTarget ?? '-'}`
    }

    return `${isCurrent ? 'Throwing' : 'Waiting'} - D${player.killerTarget ?? '-'}`
  }

  if (mode.type === 'round-clock') {
    return `${isCurrent ? 'Throwing' : 'Waiting'} - target`
  }

  return isCurrent ? 'Throwing' : 'Waiting'
}

export function formatScoreboardDetail(player: Player, mode: GameMode): string {
  if (mode.type === 'killer') {
    if (player.isEliminated) {
      return `D${player.killerTarget ?? '-'} - eliminated`
    }

    return `D${player.killerTarget ?? '-'} - ${player.killerIsActive ? 'killer' : 'safe'}`
  }

  if (mode.type === 'round-clock') {
    return player.score > mode.finalTarget
      ? 'Completed'
      : `Needs ${player.score}`
  }

  return formatScoreLabel(mode)
}
