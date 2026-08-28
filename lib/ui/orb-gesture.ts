export const LONG_PRESS_MS = 2000
export const ICON_BAR_MS = 3000
export const DRAG_THRESHOLD_PX = 10
export const ORB_SIZE = 56

export type OrbReleaseAction = "show-icons" | "record" | "ignore"

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

export function clampOrbPosition(
  x: number,
  y: number,
  viewport: { width: number; height: number },
  size = ORB_SIZE,
): { x: number; y: number } {
  return {
    x: Math.max(8, Math.min(viewport.width - size - 8, x)),
    y: Math.max(8, Math.min(viewport.height - size - 8, y)),
  }
}

export function defaultOrbPosition(viewport: { width: number; height: number }): { x: number; y: number } {
  return clampOrbPosition(viewport.width - 100, viewport.height - 100, viewport)
}

/** Width of the revealed icon bar: four 40px icons, three 8px gaps, 8px padding each side. */
export const ICON_BAR_WIDTH = 4 * 40 + 3 * 8 + 16

export function iconBarPosition(
  orb: { x: number; y: number },
  viewport: { width: number; height: number },
  barWidth = ICON_BAR_WIDTH,
): { x: number; y: number } {
  return {
    x: Math.max(8, Math.min(viewport.width - barWidth - 8, orb.x - 60)),
    y: Math.max(8, orb.y - 60),
  }
}
