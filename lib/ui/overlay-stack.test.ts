import { afterEach, describe, expect, it } from "vitest"
import {
  isTopmostOverlay,
  overlaySelectOrListboxOpen,
  overlayStackSize,
  popOverlay,
  pushOverlay,
  resetOverlayStack,
  shouldHandleOverlayEscape,
} from "./overlay-stack"

function queryable(hits: string[]) {
  return {
    querySelector(selector: string) {
      const tokens = selector.split(",").map((part) => part.trim())
      return tokens.some((token) => hits.includes(token)) ? { matched: true } : null
    },
  }
}

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

  it("suppresses Escape only for a listbox nested in the top sheet", () => {
    const parent = pushOverlay()
    const top = pushOverlay()
    const topSheet = queryable(['[role="listbox"]'])
    const parentSheet = queryable([])
    expect(overlaySelectOrListboxOpen(topSheet)).toBe(true)
    expect(overlaySelectOrListboxOpen(parentSheet)).toBe(false)
    expect(
      shouldHandleOverlayEscape({
        overlayId: top,
        key: "Escape",
        selectOrListboxOpen: overlaySelectOrListboxOpen(topSheet),
      }),
    ).toBe(false)
    expect(
      shouldHandleOverlayEscape({
        overlayId: parent,
        key: "Escape",
        selectOrListboxOpen: overlaySelectOrListboxOpen(parentSheet),
      }),
    ).toBe(false)
  })

  it("does not suppress top-sheet Escape for a composer wheel listbox elsewhere in the document", () => {
    const overlay = pushOverlay()
    const topSheet = queryable([])
    const documentScope = queryable(['[role="listbox"]', '[aria-expanded="true"][aria-haspopup="listbox"]'])
    expect(overlaySelectOrListboxOpen(documentScope)).toBe(true)
    expect(overlaySelectOrListboxOpen(topSheet)).toBe(false)
    expect(
      shouldHandleOverlayEscape({
        overlayId: overlay,
        key: "Escape",
        selectOrListboxOpen: overlaySelectOrListboxOpen(topSheet),
      }),
    ).toBe(true)
  })

  it("treats a portaled sheet select trigger as open inside that sheet", () => {
    const overlay = pushOverlay()
    const topSheet = queryable(['[data-slot="select-trigger"][data-state="open"]'])
    expect(overlaySelectOrListboxOpen(topSheet)).toBe(true)
    expect(
      shouldHandleOverlayEscape({
        overlayId: overlay,
        key: "Escape",
        selectOrListboxOpen: overlaySelectOrListboxOpen(topSheet),
      }),
    ).toBe(false)
  })
})
