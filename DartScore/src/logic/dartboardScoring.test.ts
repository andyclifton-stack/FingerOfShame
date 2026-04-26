import { describe, expect, it } from 'vitest'
import { BOARD_RADII, getDartboardHitFromPoint } from './dartboardScoring'

function pointFor(angleDegrees: number, radius: number) {
  const radians = ((angleDegrees - 90) * Math.PI) / 180

  return {
    x: radius * Math.cos(radians),
    y: radius * Math.sin(radians),
  }
}

describe('getDartboardHitFromPoint', () => {
  it('scores the center as inner bull', () => {
    expect(getDartboardHitFromPoint(0, 0)).toMatchObject({
      ring: 'innerBull',
      score: 50,
      label: '50',
    })
  })

  it('scores the outer bull ring correctly', () => {
    const radius = (BOARD_RADII.innerBull + BOARD_RADII.outerBull) / 2
    const point = pointFor(0, radius)

    expect(getDartboardHitFromPoint(point.x, point.y)).toMatchObject({
      ring: 'outerBull',
      score: 25,
      label: '25',
    })
  })

  it('treats points outside the board as misses', () => {
    expect(getDartboardHitFromPoint(1.08, 0)).toMatchObject({
      ring: 'miss',
      score: 0,
      label: 'MISS',
    })
  })

  it('maps the top of the board to the 20 segment', () => {
    const point = pointFor(0, 0.8)

    expect(getDartboardHitFromPoint(point.x, point.y)).toMatchObject({
      segment: 20,
      score: 20,
      label: '20',
    })
  })

  it('detects treble and double bands from radius', () => {
    const treblePoint = pointFor(
      0,
      (BOARD_RADII.trebleInner + BOARD_RADII.trebleOuter) / 2,
    )
    const doublePoint = pointFor(
      0,
      (BOARD_RADII.doubleInner + BOARD_RADII.doubleOuter) / 2,
    )

    expect(getDartboardHitFromPoint(treblePoint.x, treblePoint.y)).toMatchObject({
      ring: 'treble',
      label: 'T20',
      score: 60,
    })
    expect(getDartboardHitFromPoint(doublePoint.x, doublePoint.y)).toMatchObject({
      ring: 'double',
      label: 'D20',
      score: 40,
    })
  })

  it('switches segments cleanly across the 20/1 boundary', () => {
    const leftOfBoundary = pointFor(8.9, 0.8)
    const rightOfBoundary = pointFor(9.1, 0.8)

    expect(getDartboardHitFromPoint(leftOfBoundary.x, leftOfBoundary.y).segment).toBe(20)
    expect(getDartboardHitFromPoint(rightOfBoundary.x, rightOfBoundary.y).segment).toBe(1)
  })
})
