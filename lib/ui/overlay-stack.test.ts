import { afterEach, describe, expect, it } from "vitest"
import {
  isTopmostOverlay,
  overlayStackSize,
  popOverlay,
  pushOverlay,
  resetOverlayStack,
  shouldHandleOverlayEscape,
} from "./overlay-stack"

describe("overlay escape stack", () => {
  afterEach(() => {
    resetOverlayStack()
  })

  it("treats the most recently pushed overlay as the only Escape target", () => {
    const settings = pushOverlay()
    const confirm = pushOverlay()
    expect(overlayStackSize()).toBe(2)
    expect(isTopmostOverlay(confirm)).toBe(true)
    expect(isTopmostOverlay(settings)).toBe(false)
    expect(
      shouldHandleOverlayEscape({ overlayId: confirm, key: "Escape", selectOrListboxOpen: false }),
    ).toBe(true)
    expect(
      shouldHandleOverlayEscape({ overlayId: settings, key: "Escape", selectOrListboxOpen: false }),
    ).toBe(false)

    popOverlay(confirm)
    expect(isTopmostOverlay(settings)).toBe(true)
    expect(
      shouldHandleOverlayEscape({ overlayId: settings, key: "Escape", selectOrListboxOpen: false }),
    ).toBe(true)
  })

  it("keeps Escape from closing any sheet while a select or listbox is open", () => {
    const overlay = pushOverlay()
    expect(
      shouldHandleOverlayEscape({ overlayId: overlay, key: "Escape", selectOrListboxOpen: true }),
    ).toBe(false)
    expect(
      shouldHandleOverlayEscape({ overlayId: overlay, key: "Enter", selectOrListboxOpen: false }),
    ).toBe(false)
  })
})
