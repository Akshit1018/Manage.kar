export type OverlayId = symbol

const stack: OverlayId[] = []

export function pushOverlay(): OverlayId {
  const id = Symbol("mk-overlay")
  stack.push(id)
  return id
}

export function popOverlay(id: OverlayId): void {
  const index = stack.lastIndexOf(id)
  if (index === -1) {
    return
  }
  stack.splice(index, 1)
}

export function isTopmostOverlay(id: OverlayId): boolean {
  return stack.at(-1) === id
}

export function overlayStackSize(): number {
  return stack.length
}

export function resetOverlayStack(): void {
  stack.length = 0
}

export function shouldHandleOverlayEscape(input: {
  overlayId: OverlayId
  key: string
  selectOrListboxOpen: boolean
}): boolean {
  if (input.key !== "Escape") {
    return false
  }
  if (input.selectOrListboxOpen) {
    return false
  }
  return isTopmostOverlay(input.overlayId)
}
