import type { DartboardHit, DartboardRing } from '../types/game'

export const BOARD_SEGMENTS = [
  20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5,
] as const

export const BOARD_RADII = {
  innerBull: 6.35 / 170,
  outerBull: 15.9 / 170,
  trebleInner: 99 / 170,
  trebleOuter: 107 / 170,
  doubleInner: 162 / 170,
  doubleOuter: 1,
} as const

const SEGMENT_SWEEP = 360 / BOARD_SEGMENTS.length

function getRing(radius: number): DartboardRing {
  if (radius <= BOARD_RADII.innerBull) {
    return 'innerBull'
  }

  if (radius <= BOARD_RADII.outerBull) {
    return 'outerBull'
  }

  if (radius < BOARD_RADII.trebleInner) {
    return 'singleInner'
  }

  if (radius <= BOARD_RADII.trebleOuter) {
    return 'treble'
  }

  if (radius < BOARD_RADII.doubleInner) {
    return 'singleOuter'
  }

  if (radius <= BOARD_RADII.doubleOuter) {
    return 'double'
  }

  return 'miss'
}

function getSegmentFromAngle(angleFromTop: number): number {
  const index =
    Math.floor((angleFromTop + SEGMENT_SWEEP / 2) / SEGMENT_SWEEP) %
    BOARD_SEGMENTS.length

  return BOARD_SEGMENTS[index]
}

export function getDartboardHitFromPoint(
  normalizedX: number,
  normalizedY: number,
): DartboardHit {
  const radius = Math.sqrt(normalizedX ** 2 + normalizedY ** 2)
  const ring = getRing(radius)

  if (ring === 'miss') {
    return {
      ring,
      segment: null,
      multiplier: 0,
      score: 0,
      label: 'MISS',
      isFinishDouble: false,
    }
  }

  if (ring === 'innerBull') {
    return {
      ring,
      segment: null,
      multiplier: 2,
      score: 50,
      label: '50',
      isFinishDouble: true,
    }
  }

  if (ring === 'outerBull') {
    return {
      ring,
      segment: null,
      multiplier: 1,
      score: 25,
      label: '25',
      isFinishDouble: false,
    }
  }

  // atan2 starts at the positive X axis. Adding 450 degrees rotates that
  // system so 0 degrees sits at the top of the board and keeps clockwise order.
  const angleFromTop = (Math.atan2(normalizedY, normalizedX) * 180) / Math.PI
  const normalizedAngle = (angleFromTop + 450) % 360
  const segment = getSegmentFromAngle(normalizedAngle)

  const multiplier =
    ring === 'double' ? 2 : ring === 'treble' ? 3 : 1
  const score = segment * multiplier
  const label =
    multiplier === 3
      ? `T${segment}`
      : multiplier === 2
        ? `D${segment}`
        : `${segment}`

  return {
    ring,
    segment,
    multiplier,
    score,
    label,
    isFinishDouble: ring === 'double',
  }
}
