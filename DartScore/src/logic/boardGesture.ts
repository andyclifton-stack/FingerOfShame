/** A swipe or long press must never place or select a dart. */
export function isBoardTap(startX: number, startY: number, x: number, y: number, elapsed: number): boolean {
  return Math.hypot(x - startX, y - startY) <= 10 && elapsed >= 0 && elapsed <= 600;
}
