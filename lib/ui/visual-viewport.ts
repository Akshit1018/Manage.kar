export function keyboardOverlap(
  layoutHeight: number,
  visualHeight: number,
  visualOffsetTop: number,
): number {
  return Math.max(0, layoutHeight - visualHeight - visualOffsetTop);
}
