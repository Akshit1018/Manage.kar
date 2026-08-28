export const LONG_PRESS_MS = 2000
export const ICON_BAR_MS = 3000
export const DRAG_THRESHOLD_PX = 10
export const ORB_SIZE = 56
export const ORB_INSET = 8
export const ORB_BOTTOM_RESERVE = 76

export type OrbReleaseAction = "show-icons" | "record" | "ignore"

export type OrbBounds = {
  width: number
  height: number
  inset?: number
  bottomReserve?: number
}

export function movementExceeded(dx: number, dy: number, threshold = DRAG_THRESHOLD_PX): boolean {
  return Math.hypot(dx, dy) >= threshold
}

export function orbReleaseAction(input: { moved: boolean; longPressFired: boolean }): OrbReleaseAction {
  if (input.moved) {
    return "ignore"
  }
  if (input.longPressFired) {
    return "record"
  }
  return "show-icons"
}

function resolveBounds(bounds: OrbBounds) {
  return {
    width: bounds.width,
    height: bounds.height,
    inset: bounds.inset ?? ORB_INSET,
    bottomReserve: bounds.bottomReserve ?? ORB_BOTTOM_RESERVE,
  }
}

export function clampOrbPosition(
  x: number,
  y: number,
  bounds: OrbBounds,
  size = ORB_SIZE,
): { x: number; y: number } {
  const { width, height, inset, bottomReserve } = resolveBounds(bounds)
  return {
    x: Math.max(inset, Math.min(width - size - inset, x)),
    y: Math.max(inset, Math.min(height - size - bottomReserve, y)),
  }
}

export function snapOrbToEdge(
  position: { x: number; y: number },
  bounds: OrbBounds,
  size = ORB_SIZE,
): { x: number; y: number } {
  const clamped = clampOrbPosition(position.x, position.y, bounds, size)
  const { width, inset } = resolveBounds(bounds)
  const left = inset
  const right = width - size - inset
  const x = clamped.x - left <= right - clamped.x ? left : right
  return { x, y: clamped.y }
}

export function defaultOrbPosition(bounds: OrbBounds): { x: number; y: number } {
  return clampOrbPosition(bounds.width - 100, bounds.height - 100, bounds)
}

/** Width of the revealed icon bar: four 40px icons, three 8px gaps, 8px padding each side. */
export const ICON_BAR_WIDTH = 4 * 40 + 3 * 8 + 16

export function iconBarPosition(
  orb: { x: number; y: number },
  bounds: OrbBounds,
  barWidth = ICON_BAR_WIDTH,
): { x: number; y: number } {
  const { width, inset } = resolveBounds(bounds)
  const opensRight = orb.x + ORB_SIZE / 2 < width / 2
  const rawX = opensRight ? orb.x + 60 : orb.x - 60
  return {
    x: Math.max(inset, Math.min(width - barWidth - inset, rawX)),
    y: Math.max(inset, orb.y - 60),
  }
}
