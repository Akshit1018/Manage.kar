export const LONG_PRESS_MS = 2000
export const ICON_BAR_MS = 3000
export const DRAG_THRESHOLD_PX = 10
export const ORB_SIZE = 56

export type OrbReleaseAction = "show-icons" | "ignore"

export function movementExceeded(dx: number, dy: number, threshold = DRAG_THRESHOLD_PX): boolean {
  return Math.hypot(dx, dy) >= threshold
}

export function orbReleaseAction(input: { moved: boolean; longPressFired: boolean }): OrbReleaseAction {
  if (input.longPressFired || input.moved) {
    return "ignore"
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

export function iconBarPosition(orb: { x: number; y: number }): { x: number; y: number } {
  return { x: orb.x - 60, y: orb.y - 60 }
}
