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

export interface GhostPointerOrigin {
  pointerId: number
  clientX: number
  clientY: number
}

export interface GhostPointerEvent {
  type: "pointerdown" | "pointerup" | "click"
  pointerId?: number
  clientX?: number
  clientY?: number
}

const COORD_SLOP_PX = 16

function sameCoordinates(event: GhostPointerEvent, origin: GhostPointerOrigin): boolean {
  if (event.clientX == null || event.clientY == null) {
    return false
  }
  const dx = event.clientX - origin.clientX
  const dy = event.clientY - origin.clientY
  return dx * dx + dy * dy <= COORD_SLOP_PX * COORD_SLOP_PX
}

export function createGhostEventShield(origin: GhostPointerOrigin) {
  let armed = true

  return {
    get armed() {
      return armed
    },
    consume(event: GhostPointerEvent): "block" | "ignore" {
      if (!armed) {
        return "ignore"
      }
      if (event.type === "pointerdown" && event.pointerId != null && event.pointerId !== origin.pointerId) {
        armed = false
        return "ignore"
      }
      if (event.type === "pointerup") {
        if (event.pointerId != null && event.pointerId !== origin.pointerId) {
          return "ignore"
        }
        return "block"
      }
      if (event.type === "click" && sameCoordinates(event, origin)) {
        armed = false
        return "block"
      }
      return "ignore"
    },
  }
}

export interface PointerGuardDocument {
  addEventListener(type: string, listener: EventListener, options?: boolean): void
  removeEventListener(type: string, listener: EventListener, options?: boolean): void
}

function asGhostEvent(event: Event): GhostPointerEvent {
  const pointed = event as Event & { pointerId?: number; clientX?: number; clientY?: number }
  const type = event.type
  switch (type) {
    case "pointerdown":
    case "pointerup":
    case "click":
      return {
        type,
        pointerId: pointed.pointerId,
        clientX: pointed.clientX,
        clientY: pointed.clientY,
      }
    default:
      return { type: "click" }
  }
}

export function installGhostEventShield(doc: PointerGuardDocument, origin: GhostPointerOrigin): () => void {
  const shield = createGhostEventShield(origin)
  const onEvent: EventListener = (event) => {
    if (shield.consume(asGhostEvent(event)) !== "block") {
      if (!shield.armed) {
        dispose()
      }
      return
    }
    event.preventDefault()
    event.stopPropagation()
    if (!shield.armed) {
      dispose()
    }
  }
  const dispose = () => {
    doc.removeEventListener("click", onEvent, true)
    doc.removeEventListener("pointerup", onEvent, true)
    doc.removeEventListener("pointerdown", onEvent, true)
  }
  doc.addEventListener("click", onEvent, true)
  doc.addEventListener("pointerup", onEvent, true)
  doc.addEventListener("pointerdown", onEvent, true)
  return dispose
}
