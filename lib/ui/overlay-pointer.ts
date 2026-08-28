export const POINTER_THROUGH_GUARD_MS = 350

export type OverlayHitTarget = "backdrop" | "sheet" | "workspace"

export interface OverlayPointerResult {
  dismiss: boolean
  reachesWorkspace: false
}

export function overlayPointerResult(hit: OverlayHitTarget): OverlayPointerResult {
  switch (hit) {
    case "backdrop":
      return { dismiss: true, reachesWorkspace: false }
    case "sheet":
      return { dismiss: false, reachesWorkspace: false }
    case "workspace":
      return { dismiss: false, reachesWorkspace: false }
    default: {
      const _never: never = hit
      return _never
    }
  }
}

export interface BackdropPointerEvent {
  button: number
  pointerType: string
  preventDefault: () => void
  stopPropagation: () => void
}

export function backdropPointerDown(event: BackdropPointerEvent): "dismiss" | "ignore" {
  if (event.pointerType === "mouse" && event.button !== 0) {
    return "ignore"
  }
  event.preventDefault()
  event.stopPropagation()
  return "dismiss"
}

export interface PointerGuardDocument {
  addEventListener(type: string, listener: EventListener, options?: boolean): void
  removeEventListener(type: string, listener: EventListener, options?: boolean): void
}

export interface PointerGuardTimers<T = ReturnType<typeof setTimeout>> {
  schedule: (fn: () => void, ms: number) => T
  cancel: (id: T) => void
}

export function armPointerThroughGuard<T = ReturnType<typeof setTimeout>>(
  doc: PointerGuardDocument,
  timers: PointerGuardTimers<T>,
  durationMs = POINTER_THROUGH_GUARD_MS,
): () => void {
  const block: EventListener = (event) => {
    event.preventDefault()
    event.stopPropagation()
  }
  doc.addEventListener("click", block, true)
  doc.addEventListener("pointerup", block, true)
  const id = timers.schedule(() => {
    doc.removeEventListener("click", block, true)
    doc.removeEventListener("pointerup", block, true)
  }, durationMs)
  return () => {
    timers.cancel(id)
    doc.removeEventListener("click", block, true)
    doc.removeEventListener("pointerup", block, true)
  }
}
