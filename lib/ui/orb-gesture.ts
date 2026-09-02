import { DESKTOP_SIDEBAR_MIN_WIDTH } from "@/lib/ui/home-chrome"
import { keyboardOverlap } from "@/lib/ui/visual-viewport"
import type { WorkspaceView } from "@/lib/navigation/workspace-url"

export const LONG_PRESS_MS = 500
export const ICON_BAR_MS = 3000
export const DRAG_THRESHOLD_PX = 10
export const ORB_SIZE = 56
export const HOME_ORB_SIZE = 120
export const HOME_BALL_STAGE_MIN_PX = 168
export const ORB_INSET = 8
export const ORB_BOTTOM_RESERVE = 76
export const ORB_NUDGE_PX = 16
export const ORB_SNAP_MS = 180
/** 4.75rem nav + 3.5rem composer slot at a 16px root. Never use the 76px orb floor. */
export const WORKSPACE_CHROME_FALLBACK_PX = 132

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
  topInset?: number
  leftInset?: number
  rightInset?: number
  bottomReserve?: number
}

export type OrbStage = "home" | "edge"

export type OrbStageRect = {
  left: number
  top: number
  width: number
  height: number
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

export function parseResolvedLengthPx(raw: string, rootFontSizePx = 16): number {
  const value = raw.trim()
  if (!value) {
    return 0
  }
  const px = /^(-?\d+(?:\.\d+)?)px$/i.exec(value)
  if (px) {
    return Number(px[1])
  }
  const rem = /^(-?\d+(?:\.\d+)?)rem$/i.exec(value)
  if (rem) {
    return Number(rem[1]) * rootFontSizePx
  }
  return 0
}

export function readChromeReservePx(input: { probeHeight?: number; computedChromePx?: number }): number {
  const probe = Number.isFinite(input.probeHeight) ? Number(input.probeHeight) : 0
  const computed = Number.isFinite(input.computedChromePx) ? Number(input.computedChromePx) : 0
  const measured = Math.max(probe, computed)
  if (measured > 0) {
    return Math.round(measured)
  }
  return WORKSPACE_CHROME_FALLBACK_PX
}

export function resolveCustomPropertyPx(
  owner: {
    appendChild: (node: HTMLElement) => void
    removeChild: (node: HTMLElement) => void
  },
  createElement: (tag: "div") => HTMLElement,
  property: string,
  axis: "width" | "height" = "height",
): number {
  const probe = createElement("div")
  probe.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;${axis}:var(${property})`
  owner.appendChild(probe)
  const box = probe.getBoundingClientRect()
  owner.removeChild(probe)
  const size = axis === "width" ? box.width : box.height
  if (size > 0) {
    return Math.round(size)
  }
  return 0
}

export function resolveSafeAreaInsets(input: {
  top?: number
  right?: number
  bottom?: number
  left?: number
}): { top: number; right: number; bottom: number; left: number } {
  const asPx = (value: number | undefined) => {
    const numeric = Number.isFinite(value) ? Number(value) : 0
    return Math.max(0, Math.round(numeric))
  }
  return {
    top: asPx(input.top),
    right: asPx(input.right),
    bottom: asPx(input.bottom),
    left: asPx(input.left),
  }
}

export function orbViewportBounds(input: {
  width: number
  height: number
  visualHeight?: number
  visualOffsetTop?: number
  chromeReserve?: number
  topInset?: number
  leftInset?: number
  rightInset?: number
}): OrbBounds {
  const overlap = keyboardOverlap(
    input.height,
    input.visualHeight ?? input.height,
    input.visualOffsetTop ?? 0,
  )
  const insets = resolveSafeAreaInsets({
    top: input.topInset,
    left: input.leftInset,
    right: input.rightInset,
  })
  const bounds: OrbBounds = {
    width: input.width,
    height: input.height,
    bottomReserve: Math.max(
      ORB_BOTTOM_RESERVE,
      input.chromeReserve ?? 0,
      overlap + ORB_INSET,
    ),
  }
  if (insets.top > 0) {
    bounds.topInset = insets.top
  }
  if (insets.left > 0) {
    bounds.leftInset = insets.left
  }
  if (insets.right > 0) {
    bounds.rightInset = insets.right
  }
  return bounds
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
    if (
      typeof parsed.x === "number" &&
      typeof parsed.y === "number" &&
      Number.isFinite(parsed.x) &&
      Number.isFinite(parsed.y)
    ) {
      return { x: parsed.x, y: parsed.y }
    }
  } catch {
    return null
  }
  return null
}

export function shouldStageHomeBall(view: WorkspaceView, width: number): boolean {
  switch (view) {
    case "overview":
      return width < DESKTOP_SIDEBAR_MIN_WIDTH
    case "tasks":
    case "notes":
    case "chats":
    case "habits":
      return false
    default: {
      const _exhaustive: never = view
      return _exhaustive
    }
  }
}

export function orbSizeForStage(stage: OrbStage): number {
  switch (stage) {
    case "home":
      return HOME_ORB_SIZE
    case "edge":
      return ORB_SIZE
    default: {
      const _exhaustive: never = stage
      return _exhaustive
    }
  }
}

export function homeOrbPositionFromRect(rect: OrbStageRect, size = HOME_ORB_SIZE): { x: number; y: number } {
  return {
    x: Math.round(rect.left + (rect.width - size) / 2),
    y: Math.round(rect.top + (rect.height - size) / 2),
  }
}

export function homeOrbPosition(bounds: OrbBounds, size = HOME_ORB_SIZE): { x: number; y: number } {
  const { width, height, leftInset, rightInset, topInset, bottomReserve } = resolveBounds(bounds)
  const usableWidth = width - leftInset - rightInset
  const usableHeight = height - topInset - bottomReserve
  return clampOrbPosition(
    leftInset + (usableWidth - size) / 2,
    topInset + (usableHeight - size) / 2,
    bounds,
    size,
  )
}

export function resolveOrbPlacement(input: {
  prev: { x: number; y: number } | null
  saved: { x: number; y: number } | null
  bounds: OrbBounds
  reason: "hydrate" | "viewport"
  stage?: OrbStage
  size?: number
  stageRect?: OrbStageRect | null
}): { next: { x: number; y: number }; persist: boolean } {
  const stage = input.stage ?? "edge"
  const size = input.size ?? orbSizeForStage(stage)
  if (stage === "home") {
    const raw = input.stageRect
      ? homeOrbPositionFromRect(input.stageRect, size)
      : homeOrbPosition(input.bounds, size)
    return { next: clampOrbPosition(raw.x, raw.y, input.bounds, size), persist: false }
  }
  const source =
    input.reason === "hydrate"
      ? (input.saved ?? defaultOrbPosition(input.bounds))
      : (input.prev ?? input.saved ?? defaultOrbPosition(input.bounds))
  const next = clampOrbPosition(source.x, source.y, input.bounds, size)
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
  const inset = bounds.inset ?? ORB_INSET
  return {
    width: bounds.width,
    height: bounds.height,
    inset,
    leftInset: Math.max(inset, bounds.leftInset ?? inset),
    rightInset: Math.max(inset, bounds.rightInset ?? inset),
    topInset: Math.max(inset, bounds.topInset ?? inset),
    bottomReserve: bounds.bottomReserve ?? ORB_BOTTOM_RESERVE,
  }
}

export function clampOrbPosition(
  x: number,
  y: number,
  bounds: OrbBounds,
  size = ORB_SIZE,
): { x: number; y: number } {
  const { width, height, leftInset, rightInset, topInset, bottomReserve } = resolveBounds(bounds)
  return {
    x: Math.round(Math.max(leftInset, Math.min(width - size - rightInset, x))),
    y: Math.round(Math.max(topInset, Math.min(height - size - bottomReserve, y))),
  }
}

export function snapOrbToEdge(
  position: { x: number; y: number },
  bounds: OrbBounds,
  size = ORB_SIZE,
): { x: number; y: number } {
  const clamped = clampOrbPosition(position.x, position.y, bounds, size)
  const { width, leftInset, rightInset } = resolveBounds(bounds)
  const left = leftInset
  const right = width - size - rightInset
  if (right <= left) {
    return clamped
  }
  const x = clamped.x - left <= right - clamped.x ? left : right
  return { x, y: clamped.y }
}

export function defaultOrbPosition(bounds: OrbBounds): { x: number; y: number } {
  return snapOrbToEdge(clampOrbPosition(bounds.width, bounds.height, bounds), bounds)
}

/** Width of the revealed icon bar: four 44px icons, three 8px gaps, 8px padding each side. */
export const ICON_BAR_WIDTH = 4 * 44 + 3 * 8 + 16

export function iconBarPosition(
  orb: { x: number; y: number },
  bounds: OrbBounds,
  barWidth = ICON_BAR_WIDTH,
  size = ORB_SIZE,
): { x: number; y: number } {
  const { width, inset, leftInset, rightInset, topInset } = resolveBounds(bounds)
  const opensRight = orb.x + size / 2 < width / 2
  const rawX = opensRight ? orb.x + size + inset : orb.x - barWidth - inset
  const beside = {
    x: Math.max(leftInset, Math.min(width - barWidth - rightInset, rawX)),
    y: Math.max(topInset, orb.y - 60),
  }
  if (
    !rectsOverlap(
      { x: beside.x, y: beside.y, width: barWidth, height: 60 },
      { x: orb.x, y: orb.y, width: size, height: size },
    )
  ) {
    return beside
  }
  return {
    x: Math.max(leftInset, Math.min(width - barWidth - rightInset, orb.x + size / 2 - barWidth / 2)),
    y: Math.max(topInset, orb.y - 60 - inset),
  }
}

export function orbHoverOpensTray(input: { hoverCapable: boolean; finePointer: boolean }): boolean {
  return input.hoverCapable && input.finePointer
}

export function orbLostPointerPolicy(input: {
  activePointerId: number | null
  eventPointerId: number
  gestureEnded: boolean
}): "handoff" | "ignore" {
  if (input.gestureEnded || input.activePointerId == null || input.eventPointerId !== input.activePointerId) {
    return "ignore"
  }
  return "handoff"
}

export function rectsOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
}
