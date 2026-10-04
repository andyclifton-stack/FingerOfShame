import {
  useEffect,
  useId,
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
  const boardId = useId();
  const markersId = useId();
  const lensClipId = useId();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [precision, setPrecision] = useState(false);
  const [lensOffset, setLensOffset] = useState(-62);
  useEffect(() => () => { if (holdTimer.current !== null) clearTimeout(holdTimer.current); }, []);
  const hideLens = () => {
    if (holdTimer.current !== null) clearTimeout(holdTimer.current);
    holdTimer.current = null;
    setPrecision(false);
  };
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
    hideLens();
    activePointer.current = null;
    setPendingPlacement(null);
  };

  const handlePointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!event.isPrimary) {
      // A second finger cancels placement rather than adding an accidental dart.
      activePointer.current = null;
      hideLens();
      setPendingPlacement(null);
      return;
    }
    if (event.button !== 0) return;
    const markerId = (event.target as Element).closest("[data-dart-id]")?.getAttribute("data-dart-id") ?? null;
    if (!canPlaceNewDart && !isEditing && !markerId) return;
    const start = getThrowInputFromPointer(event);
    if (!start) return;
    hideLens();
    // Choose a side once per gesture so small adjustments cannot flip the lens.
    setLensOffset(start.y < -25 ? 62 : -62);
    activePointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false, markerId, start };
    event.currentTarget.setPointerCapture(event.pointerId);
    if (canPlaceNewDart || isEditing) setPendingPlacement({ dartId: editingDartId, throwInput: start });
    else if (markerId) {
      const marker = markers.find(item => item.id === markerId);
      if (marker) setPendingPlacement({ dartId: markerId, throwInput: buildThrowInput(marker.x, marker.y) });
    }
    holdTimer.current = setTimeout(() => {
      if (activePointer.current) setPrecision(true);
    }, 220);
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
    if (placement) {
      setPendingPlacement(placement);
      if (activePointer.current?.moved) setPrecision(true);
    } else if (activePointer.current?.id === event.pointerId) {
      setPendingPlacement(null);
    }
  };

  const handlePointerEnd = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (activePointer.current?.id !== event.pointerId) return;
    const placement = placementFromGesture(event);
    hideLens();
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
    : canPlaceNewDart ? "Tap to add · hold for precision" : "Drag a marker to correct it";

  // Follow the dart on the chosen side, stopping gently at the viewBox edges.
  const lensX = Math.max(-87, Math.min(87, activeThrow?.x ?? 0));
  const aimY = activeThrow?.y ?? 0;
  const lensY = Math.max(-87, Math.min(87, aimY + lensOffset));

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

          <g id={boardId}>
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

          </g>

          <g id={markersId}>
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

          </g>

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
          {precision && pendingPlacement && activeThrow && (
            <g className="precision-lens" aria-hidden="true" transform={`translate(${lensX} ${lensY})`}>
              <defs><clipPath id={lensClipId}><circle r="35" /></clipPath></defs>
              <circle className="precision-lens__base" r="36" />
              <g clipPath={`url(#${lensClipId})`}>
                <g transform={`scale(2.5) translate(${-activeThrow.x} ${-activeThrow.y})`}>
                  <use href={`#${boardId}`} />
                  <use href={`#${markersId}`} />
                </g>
                <path className="precision-lens__crosshair" d="M -12 0 H -3 M 3 0 H 12 M 0 -12 V -3 M 0 3 V 12" />
                <circle className="precision-lens__point" r="1.5" />
                <rect className="precision-lens__label-bg" x="-35" y="18" width="70" height="18" />
                <text className="precision-lens__label" textAnchor="middle" y="29">{activeThrow.hit.label} · {activeThrow.hit.score}</text>
              </g>
              <circle className="precision-lens__rim" r="35" />
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
