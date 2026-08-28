import { keyboardOverlap } from "@/lib/ui/visual-viewport"

export const LONG_PRESS_MS = 2000
export const ICON_BAR_MS = 3000
export const DRAG_THRESHOLD_PX = 10
export const ORB_SIZE = 56
export const ORB_INSET = 8
export const ORB_BOTTOM_RESERVE = 76
export const ORB_NUDGE_PX = 16
export const ORB_SNAP_MS = 180

export type OrbReleaseAction = "show-icons" | "record" | "ignore"
export type OrbGestureOutcome = "show-icons" | "record" | "snap" | "idle"

export type OrbKeyboardIntent =
  | { type: "activate" }
  | { type: "nudge"; dx: number; dy: number }
  | { type: "park"; edge: "left" | "right" }

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

export function orbGestureOutcome(input: {
  moved: boolean
  longPressFired: boolean
  cancelled?: boolean
}): OrbGestureOutcome {
  if (input.moved) {
    return "snap"
  }
  if (input.cancelled) {
    return "idle"
  }
  const action = orbReleaseAction(input)
  switch (action) {
    case "show-icons":
    case "record":
      return action
    case "ignore":
      return "idle"
    default: {
      const _exhaustive: never = action
      throw new Error(`Unhandled orb release: ${_exhaustive}`)
    }
  }
}

export function orbKeyboardIntent(key: string): OrbKeyboardIntent | null {
  switch (key) {
    case "Enter":
    case " ":
      return { type: "activate" }
    case "ArrowLeft":
      return { type: "nudge", dx: -ORB_NUDGE_PX, dy: 0 }
    case "ArrowRight":
      return { type: "nudge", dx: ORB_NUDGE_PX, dy: 0 }
    case "ArrowUp":
      return { type: "nudge", dx: 0, dy: -ORB_NUDGE_PX }
    case "ArrowDown":
      return { type: "nudge", dx: 0, dy: ORB_NUDGE_PX }
    case "Home":
      return { type: "park", edge: "left" }
    case "End":
      return { type: "park", edge: "right" }
    default:
      return null
  }
}

export function applyOrbKeyboardIntent(
  position: { x: number; y: number },
  intent: Exclude<OrbKeyboardIntent, { type: "activate" }>,
  bounds: OrbBounds,
): { x: number; y: number } {
  switch (intent.type) {
    case "nudge":
      return clampOrbPosition(position.x + intent.dx, position.y + intent.dy, bounds)
    case "park":
      return snapOrbToEdge(
        { x: intent.edge === "left" ? 0 : bounds.width, y: position.y },
        bounds,
      )
    default: {
      const _exhaustive: never = intent
      throw new Error(`Unhandled orb keyboard intent: ${_exhaustive}`)
    }
  }
}

export function orbViewportBounds(input: {
  width: number
  height: number
  visualHeight?: number
  visualOffsetTop?: number
}): OrbBounds {
  const overlap = keyboardOverlap(
    input.height,
    input.visualHeight ?? input.height,
    input.visualOffsetTop ?? 0,
  )
  return {
    width: input.width,
    height: input.height,
    bottomReserve: Math.max(ORB_BOTTOM_RESERVE, overlap + ORB_INSET),
  }
}

export function orbPlacementTransitionMs(prefersReducedMotion: boolean): number {
  return prefersReducedMotion ? 0 : ORB_SNAP_MS
}

export function orbLostPointerShouldFinish(input: {
  activePointerId: number | null
  eventPointerId: number
  gestureEnded: boolean
}): boolean {
  if (input.gestureEnded || input.activePointerId == null) {
    return false
  }
  return input.eventPointerId === input.activePointerId
}

export function parseSavedOrbPosition(raw: string | null): { x: number; y: number } | null {
  if (!raw) {
    return null
  }
  try {
    const parsed = JSON.parse(raw) as { x?: unknown; y?: unknown }
    if (Number.isFinite(parsed.x) && Number.isFinite(parsed.y)) {
      return { x: parsed.x, y: parsed.y }
    }
  } catch {
    return null
  }
  return null
}

export function resolveOrbPlacement(input: {
  prev: { x: number; y: number } | null
  saved: { x: number; y: number } | null
  bounds: OrbBounds
  reason: "hydrate" | "viewport"
}): { next: { x: number; y: number }; persist: boolean } {
  const source = input.prev ?? input.saved ?? defaultOrbPosition(input.bounds)
  const next = clampOrbPosition(source.x, source.y, input.bounds)
  const changed = next.x !== source.x || next.y !== source.y
  const persist =
    changed && (input.reason === "viewport" || (input.reason === "hydrate" && input.saved != null))
  return { next, persist }
}

type OrbPointerFallbackTarget = {
  addEventListener: (type: string, listener: EventListenerOrEventListenerObject) => void
  removeEventListener: (type: string, listener: EventListenerOrEventListenerObject) => void
}

export function attachOrbPointerFallback(
  target: OrbPointerFallbackTarget,
  pointerId: number,
  handlers: {
    onMove: (clientX: number, clientY: number) => void
    onUp: () => void
    onCancel: () => void
  },
): () => void {
  const matches = (event: Event) => (event as PointerEvent).pointerId === pointerId
  const onMove = (event: Event) => {
    if (!matches(event)) {
      return
    }
    const pointer = event as PointerEvent
    handlers.onMove(pointer.clientX, pointer.clientY)
  }
  const onUp = (event: Event) => {
    if (!matches(event)) {
      return
    }
    handlers.onUp()
  }
  const onCancel = (event: Event) => {
    if (!matches(event)) {
      return
    }
    handlers.onCancel()
  }
  target.addEventListener("pointermove", onMove)
  target.addEventListener("pointerup", onUp)
  target.addEventListener("pointercancel", onCancel)
  return () => {
    target.removeEventListener("pointermove", onMove)
    target.removeEventListener("pointerup", onUp)
    target.removeEventListener("pointercancel", onCancel)
  }
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
    x: Math.round(Math.max(inset, Math.min(width - size - inset, x))),
    y: Math.round(Math.max(inset, Math.min(height - size - bottomReserve, y))),
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
  if (right <= left) {
    return clamped
  }
  const x = clamped.x - left <= right - clamped.x ? left : right
  return { x, y: clamped.y }
}

export function defaultOrbPosition(bounds: OrbBounds): { x: number; y: number } {
  return clampOrbPosition(bounds.width - 100, bounds.height - 100, bounds)
}

/** Width of the revealed icon bar: four 44px icons, three 8px gaps, 8px padding each side. */
export const ICON_BAR_WIDTH = 4 * 44 + 3 * 8 + 16

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
