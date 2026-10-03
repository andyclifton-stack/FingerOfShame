import { Children, isValidElement, type ReactElement, type ReactNode, type SVGProps, type PointerEvent } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Dartboard } from './Dartboard';

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

function board() {
  const select = vi.fn();
  const tree = Dartboard({ canPlaceNewDart: true, editingDartId: null, markers: [], onCancelEdit: vi.fn(), onConfirmThrow: vi.fn(), onSelectDart: select });
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
  return { props, event, select, svg };
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

describe('dartboard pointer interaction', () => {
  it('does not place a touch dart until a tap is released', () => {
    const { props, event, svg } = board();
    props.onPointerDown!(event('pointerdown'));
    expect(hooks.placement).not.toHaveBeenCalled();
    expect(svg.setPointerCapture).not.toHaveBeenCalled();
    props.onPointerUp!(event('pointerup', 0, 0, 250));
    expect(hooks.placement).toHaveBeenCalledOnce();
    expect(hooks.placement.mock.calls[0][0].throwInput.hit.score).toBe(50);
  });
  it('ignores a swipe even when the finger returns to its starting position', () => {
    const { props, event } = board();
    props.onPointerDown!(event('pointerdown'));
    props.onPointerMove!(event('pointermove', 0, 40, 150));
    props.onPointerUp!(event('pointerup', 0, 0, 250));
    expect(hooks.placement).not.toHaveBeenCalled();
  });
  it('ignores a native scroll cancellation and its subsequent release', () => {
    const { props, event } = board();
    props.onPointerDown!(event('pointerdown'));
    props.onPointerCancel!(event('pointercancel', 0, 30, 150));
    props.onPointerUp!(event('pointerup', 0, 0, 250));
    expect(hooks.placement).not.toHaveBeenCalled();
  });
  it('does not select an existing marker during a scrolling gesture', () => {
    const { props, event, select } = board();
    props.onPointerDown!(event('pointerdown', 0, 0, 100, 'dart-1'));
    props.onPointerMove!(event('pointermove', 0, -30, 150, 'dart-1'));
    props.onPointerUp!(event('pointerup', 0, -30, 250, 'dart-1'));
    expect(select).not.toHaveBeenCalled();
    expect(hooks.placement).not.toHaveBeenCalled();
  });
  it('selects an existing marker only after a deliberate tap', () => {
    const { props, event, select } = board();
    props.onPointerDown!(event('pointerdown', 0, 0, 100, 'dart-1'));
    expect(select).not.toHaveBeenCalled();
    props.onPointerUp!(event('pointerup', 0, 0, 250, 'dart-1'));
    expect(select).toHaveBeenCalledWith('dart-1');
  });
  it('preserves mouse dragging for placement adjustment', () => {
    const { props, event, svg } = board();
    props.onPointerDown!(event('pointerdown', 0, 0, 100, null, 'mouse'));
    props.onPointerMove!(event('pointermove', 0, -50, 150, null, 'mouse'));
    expect(svg.setPointerCapture).toHaveBeenCalledWith(1);
    expect(hooks.placement).toHaveBeenCalledTimes(2);
  });
});
