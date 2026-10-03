import { describe, expect, it } from 'vitest';
import { isBoardTap } from './boardGesture';
describe('board touch gestures', () => {
  it('allows finger jitter on a deliberate tap', () => {
    expect(isBoardTap(100, 100, 104, 106, 200)).toBe(true);
  });
  it('rejects vertical scrolling in both directions', () => {
    expect(isBoardTap(100, 100, 100, 140, 200)).toBe(false);
    expect(isBoardTap(100, 100, 100, 60, 200)).toBe(false);
  });
  it('rejects horizontal and diagonal swipes', () => {
    expect(isBoardTap(100, 100, 130, 100, 200)).toBe(false);
    expect(isBoardTap(100, 100, 108, 108, 200)).toBe(false);
  });
  it('rejects long presses', () => {
    expect(isBoardTap(100, 100, 100, 100, 900)).toBe(false);
  });
});
