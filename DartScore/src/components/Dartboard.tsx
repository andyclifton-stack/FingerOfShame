import type { PointerEvent as ReactPointerEvent } from 'react'
import {
  BOARD_RADII,
  BOARD_SEGMENTS,
  getDartboardHitFromPoint,
} from '../logic/dartboardScoring'
import type { DartThrow, DartThrowInput } from '../types/game'

interface DartboardProps {
  markers: DartThrow[]
  onThrow: (throwInput: DartThrowInput) => void
}

const BOARD_RADIUS = 100
const VIEWBOX_MIN = -125
const VIEWBOX_SIZE = 250

function polarToCartesian(radius: number, angleDegrees: number) {
  const radians = ((angleDegrees - 90) * Math.PI) / 180

  return {
    x: radius * Math.cos(radians),
    y: radius * Math.sin(radians),
  }
}

function describeRingSlice(
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
): string {
  const outerStart = polarToCartesian(outerRadius, startAngle)
  const outerEnd = polarToCartesian(outerRadius, endAngle)
  const innerEnd = polarToCartesian(innerRadius, endAngle)
  const innerStart = polarToCartesian(innerRadius, startAngle)

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 0 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 0 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ')
}

function scaleRadius(radius: number): number {
  return radius * BOARD_RADIUS
}

export function Dartboard({ markers, onThrow }: DartboardProps) {
  const handlePointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const svgX =
      ((event.clientX - bounds.left) / bounds.width) * VIEWBOX_SIZE + VIEWBOX_MIN
    const svgY =
      ((event.clientY - bounds.top) / bounds.height) * VIEWBOX_SIZE + VIEWBOX_MIN
    const normalizedX = svgX / BOARD_RADIUS
    const normalizedY = svgY / BOARD_RADIUS
    const hit = getDartboardHitFromPoint(normalizedX, normalizedY)

    onThrow({
      x: svgX,
      y: svgY,
      normalizedX,
      normalizedY,
      hit,
    })
  }

  return (
    <section className="panel dartboard-panel">
      <div className="section-heading">
        <span className="eyebrow">Board</span>
        <h2>Tap where the dart lands</h2>
      </div>

      <div className="dartboard-wrap">
        <svg
          aria-label="Interactive dartboard"
          className="dartboard"
          role="img"
          viewBox={`${VIEWBOX_MIN} ${VIEWBOX_MIN} ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
          onPointerDown={handlePointerDown}
        >
          <defs>
            <filter id="boardShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow
                dx="0"
                dy="12"
                stdDeviation="12"
                floodColor="#05070c"
                floodOpacity="0.55"
              />
            </filter>
          </defs>

          <circle cx="0" cy="0" r="118" className="board-trim" />
          <circle cx="0" cy="0" r="106" className="board-backplate" />
          <circle
            cx="0"
            cy="0"
            r={scaleRadius(BOARD_RADII.doubleOuter)}
            className="board-outer"
            filter="url(#boardShadow)"
          />

          {BOARD_SEGMENTS.map((segment, index) => {
            const isEven = index % 2 === 0
            const centerAngle = index * 18
            const startAngle = centerAngle - 9
            const endAngle = centerAngle + 9

            return (
              <g key={`segment-${segment}`}>
                <path
                  className={isEven ? 'single-slice single-slice--light' : 'single-slice single-slice--dark'}
                  d={describeRingSlice(
                    scaleRadius(BOARD_RADII.outerBull),
                    scaleRadius(BOARD_RADII.trebleInner),
                    startAngle,
                    endAngle,
                  )}
                />
                <path
                  className={isEven ? 'treble-slice treble-slice--green' : 'treble-slice treble-slice--red'}
                  d={describeRingSlice(
                    scaleRadius(BOARD_RADII.trebleInner),
                    scaleRadius(BOARD_RADII.trebleOuter),
                    startAngle,
                    endAngle,
                  )}
                />
                <path
                  className={isEven ? 'single-slice single-slice--light' : 'single-slice single-slice--dark'}
                  d={describeRingSlice(
                    scaleRadius(BOARD_RADII.trebleOuter),
                    scaleRadius(BOARD_RADII.doubleInner),
                    startAngle,
                    endAngle,
                  )}
                />
                <path
                  className={isEven ? 'double-slice double-slice--green' : 'double-slice double-slice--red'}
                  d={describeRingSlice(
                    scaleRadius(BOARD_RADII.doubleInner),
                    scaleRadius(BOARD_RADII.doubleOuter),
                    startAngle,
                    endAngle,
                  )}
                />
              </g>
            )
          })}

          <circle
            cx="0"
            cy="0"
            r={scaleRadius(BOARD_RADII.outerBull)}
            className="bull bull--outer"
          />
          <circle
            cx="0"
            cy="0"
            r={scaleRadius(BOARD_RADII.innerBull)}
            className="bull bull--inner"
          />
          <circle
            cx="0"
            cy="0"
            r={scaleRadius(BOARD_RADII.doubleOuter)}
            className="board-stroke"
          />
          <circle
            cx="0"
            cy="0"
            r={scaleRadius(BOARD_RADII.doubleInner)}
            className="ring-stroke"
          />
          <circle
            cx="0"
            cy="0"
            r={scaleRadius(BOARD_RADII.trebleOuter)}
            className="ring-stroke"
          />
          <circle
            cx="0"
            cy="0"
            r={scaleRadius(BOARD_RADII.trebleInner)}
            className="ring-stroke"
          />
          <circle
            cx="0"
            cy="0"
            r={scaleRadius(BOARD_RADII.outerBull)}
            className="ring-stroke"
          />
          <circle
            cx="0"
            cy="0"
            r={scaleRadius(BOARD_RADII.innerBull)}
            className="ring-stroke"
          />

          {BOARD_SEGMENTS.map((segment, index) => {
            const position = polarToCartesian(113, index * 18)

            return (
              <text
                key={`label-${segment}`}
                className="segment-label"
                dominantBaseline="central"
                textAnchor="middle"
                x={position.x}
                y={position.y}
              >
                {segment}
              </text>
            )
          })}

          {markers.map((marker) => (
            <g key={marker.id} transform={`translate(${marker.x} ${marker.y})`}>
              <circle className="throw-marker" r="5.5" />
              <circle className="throw-marker__halo" r="9" />
              <text
                className="throw-marker__label"
                dominantBaseline="central"
                textAnchor="middle"
                x="0"
                y="0.5"
              >
                {marker.dartIndex}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </section>
  )
}
