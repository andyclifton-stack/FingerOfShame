import { Children, isValidElement, type ReactElement, type ReactNode, type SVGProps, type PointerEvent } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Dartboard } from './Dartboard';
import { buttonThrow } from '../logic/matchTools';

// Exercise the component's actual pointer handlers without a browser or DOM dependency.
const hooks = vi.hoisted(() => ({ placement: vi.fn() }));
vi.mock('react', async (original) => ({
  ...await original<typeof import('react')>(),
  useState: () => [null, hooks.placement],
  useRef: () => ({ current: null }),
}));

function findSvg(node: ReactNode): ReactElement<SVGProps<SVGSVGElement>> | undefined {
  if (!isValidElement<{ children?: ReactNode }>(node)) return;
  if (node.type === 'svg') return node as ReactElement<SVGProps<SVGSVGElement>>;
  for (const child of Children.toArray(node.props.children)) {
    const match = findSvg(child);
    if (match) return match;
  }
}

function board(canPlaceNewDart = true, editingDartId: string | null = null) {
  const commit = vi.fn();
  const markers = [{ ...buttonThrow(50), id: 'dart-1', dartIndex: 1, turnIndex: 0, score: 50 }];
  const tree = Dartboard({ canPlaceNewDart, editingDartId, markers, onCancelEdit: vi.fn(), onConfirmThrow: commit });
  const props = findSvg(tree)!.props;
  const svg = {
    getScreenCTM: () => ({ inverse: () => null }),
    setPointerCapture: vi.fn(), hasPointerCapture: () => false, releasePointerCapture: vi.fn(),
  };
  (props.ref as { current: unknown }).current = svg;
  function event(type: string, x = 0, y = 0, timeStamp = 100, markerId: string | null = null, pointerType = 'touch') {
    return { type, pointerId: 1, pointerType, isPrimary: true, button: 0, clientX: x, clientY: y, timeStamp,
      target: { closest: () => markerId ? { getAttribute: () => markerId } : null }, currentTarget: svg,
    } as unknown as PointerEvent<SVGSVGElement>;
  }
  return { props, event, commit, svg };
}

beforeEach(() => {
  hooks.placement.mockClear();
  vi.stubGlobal('DOMPoint', class {
    x: number;
    y: number;
    constructor(x: number, y: number) { this.x = x; this.y = y; }
    matrixTransform() { return this; }
  });
});
afterEach(() => { vi.unstubAllGlobals(); });

describe('direct dart placement', () => {
  it('records a tap on release with no confirmation step', () => {
    const { props, event, commit } = board();
    props.onPointerDown!(event('pointerdown'));
    expect(commit).not.toHaveBeenCalled();
    props.onPointerUp!(event('pointerup'));
    expect(commit).toHaveBeenCalledOnce();
    expect(commit.mock.calls[0][0].hit.score).toBe(50);
    expect(commit.mock.calls[0][1]).toBeNull();
  });
  it('aims a new dart by dragging and records only the release position', () => {
    const { props, event, commit, svg } = board();
    props.onPointerDown!(event('pointerdown', 0, -80));
    props.onPointerMove!(event('pointermove', 0, -60));
    expect(commit).not.toHaveBeenCalled();
    props.onPointerUp!(event('pointerup', 0, -60));
    expect(svg.setPointerCapture).toHaveBeenCalledWith(1);
    expect(commit.mock.calls[0][0].hit.label).toBe('T20');
    expect(commit.mock.calls[0][1]).toBeNull();
  });
  it('drags an existing marker without adding another dart', () => {
    const { props, event, commit } = board();
    props.onPointerDown!(event('pointerdown', 0, 0, 100, 'dart-1'));
    props.onPointerMove!(event('pointermove', 0, -60, 150, 'dart-1'));
    props.onPointerUp!(event('pointerup', 0, -60, 250, 'dart-1'));
    expect(commit).toHaveBeenCalledOnce();
    expect(commit.mock.calls[0][1]).toBe('dart-1');
    expect(commit.mock.calls[0][0].hit.label).toBe('T20');
  });
  it('allows repeated taps on the same marker to add overlapping darts', () => {
    const { props, event, commit } = board();
    props.onPointerDown!(event('pointerdown', 0, 0, 100, 'dart-1'));
    props.onPointerUp!(event('pointerup', 0, 0, 250, 'dart-1'));
    expect(commit.mock.calls[0][1]).toBeNull();
  });
  it('allows marker correction after the third dart but ignores extra taps', () => {
    const { props, event, commit } = board(false);
    props.onPointerDown!(event('pointerdown', 0, 0, 100, 'dart-1'));
    props.onPointerUp!(event('pointerup', 0, 0, 250, 'dart-1'));
    expect(commit).not.toHaveBeenCalled();
    props.onPointerDown!(event('pointerdown', 0, 0, 300, 'dart-1'));
    props.onPointerUp!(event('pointerup', 0, -60, 450, 'dart-1'));
    expect(commit.mock.calls[0][1]).toBe('dart-1');
  });
  it('repositions the dart selected in the footer with a single tap', () => {
    const { props, event, commit } = board(false, 'dart-1');
    props.onPointerDown!(event('pointerdown', 0, -60));
    props.onPointerUp!(event('pointerup', 0, -60));
    expect(commit.mock.calls[0][1]).toBe('dart-1');
  });
  it('discards cancelled gestures', () => {
    const { props, event, commit } = board();
    props.onPointerDown!(event('pointerdown'));
    props.onPointerMove!(event('pointermove', 0, -60));
    props.onPointerCancel!(event('pointercancel'));
    props.onPointerUp!(event('pointerup'));
    expect(commit).not.toHaveBeenCalled();
  });
  it('cancels a release outside the board area', () => {
    const { props, event, commit } = board();
    props.onPointerDown!(event('pointerdown'));
    props.onPointerUp!(event('pointerup', 200, 200));
    expect(commit).not.toHaveBeenCalled();
  });
  it('cancels when a second finger touches the board', () => {
    const { props, event, commit } = board();
    props.onPointerDown!(event('pointerdown'));
    props.onPointerDown!({ ...event('pointerdown'), isPrimary: false, pointerId: 2 });
    props.onPointerUp!(event('pointerup'));
    expect(commit).not.toHaveBeenCalled();
  });
  it('supports mouse drag and commits only once', () => {
    const { props, event, commit } = board();
    props.onPointerDown!(event('pointerdown', 0, 0, 100, null, 'mouse'));
    props.onPointerMove!(event('pointermove', 0, -60, 150, null, 'mouse'));
    props.onPointerUp!(event('pointerup', 0, -60, 250, null, 'mouse'));
    props.onPointerUp!(event('pointerup', 0, -60, 260, null, 'mouse'));
    expect(commit).toHaveBeenCalledOnce();
  });
});
