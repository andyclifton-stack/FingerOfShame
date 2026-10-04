import {
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  BOARD_RADII,
  BOARD_SEGMENTS,
  getDartboardHitFromPoint,
} from "../logic/dartboardScoring";
import type { DartThrow, DartThrowInput, DartboardHit } from "../types/game";

interface DartboardProps {
  suggestedHit?: DartboardHit;
  canPlaceNewDart: boolean;
  editingDartId: string | null;
  markers: DartThrow[];
  onCancelEdit: () => void;
  onConfirmThrow: (throwInput: DartThrowInput, dartId: string | null) => void;
}

interface PendingPlacement {
  dartId: string | null;
  throwInput: DartThrowInput;
}

const BOARD_RADIUS = 100;
const VIEWBOX_MIN = -125;
const VIEWBOX_SIZE = 250;

function polarToCartesian(radius: number, angleDegrees: number) {
  const radians = ((angleDegrees - 90) * Math.PI) / 180;

  return {
    x: radius * Math.cos(radians),
    y: radius * Math.sin(radians),
  };
}

function describeRingSlice(
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
): string {
  const outerStart = polarToCartesian(outerRadius, startAngle);
  const outerEnd = polarToCartesian(outerRadius, endAngle);
  const innerEnd = polarToCartesian(innerRadius, endAngle);
  const innerStart = polarToCartesian(innerRadius, startAngle);

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 0 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 0 0 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ");
}

function scaleRadius(radius: number): number {
  return radius * BOARD_RADIUS;
}

function buildThrowInput(svgX: number, svgY: number): DartThrowInput {
  const normalizedX = svgX / BOARD_RADIUS;
  const normalizedY = svgY / BOARD_RADIUS;
  const hit = getDartboardHitFromPoint(normalizedX, normalizedY);

  return {
    x: svgX,
    y: svgY,
    normalizedX,
    normalizedY,
    hit,
  };
}

function triggerHapticFeedback(pattern: number | number[] = 10) {
  globalThis.navigator?.vibrate?.(pattern);
}

export function Dartboard({
  suggestedHit,
  canPlaceNewDart,
  editingDartId,
  markers,
  onCancelEdit,
  onConfirmThrow,
}: DartboardProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [pendingPlacement, setPendingPlacement] =
    useState<PendingPlacement | null>(null);
  const activePointer = useRef<{
    id: number; x: number; y: number; moved: boolean;
    markerId: string | null; start: DartThrowInput;
  } | null>(null);
  const editingMarker = markers.find((marker) => marker.id === editingDartId);
  const previewMarker = markers.find(marker => marker.id === (pendingPlacement?.dartId ?? editingDartId));
  const isEditing = Boolean(editingMarker);
  const pendingDartIndex = previewMarker?.dartIndex ?? Math.min(markers.length + 1, 3);
  const activeThrow = pendingPlacement?.throwInput ??
    (editingMarker ? buildThrowInput(editingMarker.x, editingMarker.y) : null);

  const getThrowInputFromPointer = (
    event: ReactPointerEvent<SVGSVGElement>,
  ): DartThrowInput | null => {
    const svg = svgRef.current;

    if (!svg) {
      return null;
    }

    const matrix = svg.getScreenCTM();
    if (!matrix) return null;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    if (Math.abs(point.x) > 125 || Math.abs(point.y) > 125) return null;
    return buildThrowInput(point.x, point.y);
  };

  const cancelGesture = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (activePointer.current?.id !== event.pointerId) return;
    activePointer.current = null;
    setPendingPlacement(null);
  };

  const handlePointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!event.isPrimary) {
      // A second finger cancels placement rather than adding an accidental dart.
      activePointer.current = null;
      setPendingPlacement(null);
      return;
    }
    if (event.button !== 0) return;
    const markerId = (event.target as Element).closest("[data-dart-id]")?.getAttribute("data-dart-id") ?? null;
    if (!canPlaceNewDart && !isEditing && !markerId) return;
    const start = getThrowInputFromPointer(event);
    if (!start) return;
    activePointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false, markerId, start };
    event.currentTarget.setPointerCapture(event.pointerId);
    if (canPlaceNewDart || isEditing) setPendingPlacement({ dartId: editingDartId, throwInput: start });
  };

  const placementFromGesture = (event: ReactPointerEvent<SVGSVGElement>) => {
    const gesture = activePointer.current;
    if (!gesture || gesture.id !== event.pointerId) return null;
    gesture.moved ||= Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 6;
    const point = getThrowInputFromPointer(event);
    if (!point) return null;
    // A tap on an existing hit adds another dart. A drag moves that marker.
    const dartId = editingDartId ?? (gesture.moved ? gesture.markerId : null);
    if (!dartId && !canPlaceNewDart) return null;
    const marker = markers.find(item => item.id === dartId);
    const throwInput = marker && gesture.markerId === dartId && gesture.moved
      ? buildThrowInput(marker.x + point.x - gesture.start.x, marker.y + point.y - gesture.start.y)
      : point;
    return { dartId, throwInput };
  };

  const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const placement = placementFromGesture(event);
    if (placement) setPendingPlacement(placement);
  };

  const handlePointerEnd = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (activePointer.current?.id !== event.pointerId) return;
    const placement = placementFromGesture(event);
    activePointer.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    setPendingPlacement(null);
    if (placement) {
      onConfirmThrow(placement.throwInput, placement.dartId);
      triggerHapticFeedback(12);
    }
  };

  const previewLabel = activeThrow
    ? `${activeThrow.hit.label} · ${activeThrow.hit.score}`
    : canPlaceNewDart ? "Tap to add · drag to adjust" : "Drag a marker to correct it";

  return (
    <section className="panel dartboard-panel">
      <div className="section-heading board-heading">
        <span className="eyebrow">Board</span>
        <h2>{isEditing ? `Edit dart ${pendingDartIndex}` : "Place dart"}</h2>
      </div>

      <div className="dartboard-wrap">
        <svg
          aria-label="Interactive dartboard"
          className="dartboard"
          ref={svgRef}
          role="img"
          viewBox={`${VIEWBOX_MIN} ${VIEWBOX_MIN} ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={cancelGesture}
          onLostPointerCapture={cancelGesture}
          onContextMenu={(event) => event.preventDefault()}
        >
          <defs>
            <filter
              id="boardShadow"
              x="-18%"
              y="-18%"
              width="136%"
              height="136%"
            >
              <feDropShadow
                dx="0"
                dy="8"
                stdDeviation="7"
                floodColor="#05070c"
                floodOpacity="0.38"
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
            const isLight = index % 2 === 1;
            const centerAngle = index * 18;
            const startAngle = centerAngle - 9;
            const endAngle = centerAngle + 9;

            return (
              <g
                key={`segment-${segment}`}
                className={
                  suggestedHit?.segment === segment
                    ? "suggested-segment"
                    : undefined
                }
              >
                <path
                  className={
                    isLight
                      ? "single-slice single-slice--light"
                      : "single-slice single-slice--dark"
                  }
                  d={describeRingSlice(
                    scaleRadius(BOARD_RADII.outerBull),
                    scaleRadius(BOARD_RADII.trebleInner),
                    startAngle,
                    endAngle,
                  )}
                />
                <path
                  className={
                    isLight
                      ? "treble-slice treble-slice--green"
                      : "treble-slice treble-slice--red"
                  }
                  data-suggested={
                    suggestedHit?.segment === segment &&
                    suggestedHit.multiplier === 3
                  }
                  d={describeRingSlice(
                    scaleRadius(BOARD_RADII.trebleInner),
                    scaleRadius(BOARD_RADII.trebleOuter),
                    startAngle,
                    endAngle,
                  )}
                />
                <path
                  className={
                    isLight
                      ? "single-slice single-slice--light"
                      : "single-slice single-slice--dark"
                  }
                  d={describeRingSlice(
                    scaleRadius(BOARD_RADII.trebleOuter),
                    scaleRadius(BOARD_RADII.doubleInner),
                    startAngle,
                    endAngle,
                  )}
                />
                <path
                  className={
                    isLight
                      ? "double-slice double-slice--green"
                      : "double-slice double-slice--red"
                  }
                  data-suggested={
                    suggestedHit?.segment === segment &&
                    suggestedHit.multiplier === 2
                  }
                  d={describeRingSlice(
                    scaleRadius(BOARD_RADII.doubleInner),
                    scaleRadius(BOARD_RADII.doubleOuter),
                    startAngle,
                    endAngle,
                  )}
                />
              </g>
            );
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
            data-suggested={suggestedHit?.ring === "innerBull"}
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
            const position = polarToCartesian(113, index * 18);

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
            );
          })}

          {markers.map((marker) => {
            if (pendingPlacement?.dartId === marker.id) return null;
            const markerIsEditing = marker.id === (pendingPlacement?.dartId ?? editingDartId);

            return (
              <g
                key={marker.id}
                className={[
                  "throw-marker-group",
                  markerIsEditing ? "is-editing" : "",
                  "can-edit",
                ]
                  .filter(Boolean)
                  .join(" ")}
                data-dart-id={marker.id}
                transform={`translate(${marker.x} ${marker.y})`}

              >
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
            );
          })}

          {activeThrow && (
            <g
              className="pending-marker"
              transform={`translate(${activeThrow.x} ${activeThrow.y})`}
            >
              <line
                className="pending-marker__crosshair"
                x1="-14"
                x2="14"
                y1="0"
                y2="0"
              />
              <line
                className="pending-marker__crosshair"
                x1="0"
                x2="0"
                y1="-14"
                y2="14"
              />
              <circle className="pending-marker__halo" r="13" />
              <circle className="pending-marker__dot" r="6.5" />
              <text
                className="throw-marker__label"
                dominantBaseline="central"
                textAnchor="middle"
                x="0"
                y="0.5"
              >
                {pendingDartIndex}
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="dartboard-actions">
        <div className="dartboard-preview" aria-live="polite"><strong>{previewLabel}</strong></div>
        {isEditing && <button className="button button--compact" onClick={onCancelEdit}>Cancel edit</button>}
      </div>
    </section>
  );
}
