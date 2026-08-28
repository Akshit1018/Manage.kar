import { describe, expect, it } from "vitest"
import { readGlobalsCss } from "./editorial-surface-contract"
import {
  DESKTOP_DIALOG_MIN_WIDTH,
  IPHONE_VIEWPORTS,
  formGridColumns,
  mobileBackdropIsDismissible,
  overlayBlocksWorkspace,
  overlayContainingBlockIsSafe,
  overlayCssContract,
  overlayPlacement,
  overlayPositioning,
  sectionTabsShouldWrap,
  sheetFooterOrientation,
} from "./sheet-layout"

describe("iPhone 17 family overlay placement", () => {
  it("uses a full-viewport sheet on iPhone 17 through Pro Max, not a centered card", () => {
    expect(IPHONE_VIEWPORTS.iphone17).toEqual({ width: 402, height: 874 })
    expect(IPHONE_VIEWPORTS.iphone17Pro).toEqual({ width: 402, height: 874 })
    expect(IPHONE_VIEWPORTS.iphone17ProMax).toEqual({ width: 440, height: 956 })

    for (const viewport of Object.values(IPHONE_VIEWPORTS)) {
      expect(overlayPlacement(viewport.width)).toBe("viewport-full")
      const position = overlayPositioning(viewport.width)
      expect(position.position).toBe("fixed")
      expect(position.inset).toBe(0)
      expect(position.top).toBe("0")
      expect(position.transform).toBe("none")
      expect(position.height).toBe("100dvh")
    }
  })

  it("keeps a centered dialog only from tablet widths up", () => {
    expect(overlayPlacement(640)).toBe("centered-dialog")
    const desktop = overlayPositioning(1024)
    expect(desktop.top).toBe("50%")
    expect(desktop.transform).toBe("translate(-50%, -50%)")
  })

  it("rejects ancestor styles that turn position:fixed into document flow", () => {
    expect(overlayContainingBlockIsSafe({ backdropFilter: "none", filter: "none", transform: "none" })).toBe(true)
    expect(overlayContainingBlockIsSafe({ backdropFilter: "blur(20px)", filter: "none", transform: "none" })).toBe(false)
    expect(overlayContainingBlockIsSafe({ backdropFilter: "none", filter: "blur(2px)", transform: "none" })).toBe(false)
    expect(overlayContainingBlockIsSafe({ backdropFilter: "none", filter: "none", transform: "translateZ(0)" })).toBe(
      false,
    )
  })
})

describe("overlay pointer and form layout contracts", () => {
  it("keeps the backdrop dismissible on mobile while the overlay still blocks the workspace", () => {
    expect(mobileBackdropIsDismissible("auto")).toBe(true)
    expect(mobileBackdropIsDismissible("none")).toBe(false)
    expect(overlayBlocksWorkspace("auto")).toBe(true)
    expect(overlayBlocksWorkspace("none")).toBe(false)
  })

  it("wraps section tabs, stacks footers, and uses a single form column at 320", () => {
    expect(sectionTabsShouldWrap(320)).toBe(true)
    expect(sectionTabsShouldWrap(DESKTOP_DIALOG_MIN_WIDTH)).toBe(false)
    expect(formGridColumns(320)).toBe(1)
    expect(formGridColumns(360)).toBe(2)
    expect(sheetFooterOrientation(320)).toBe("stack")
    expect(sheetFooterOrientation(360)).toBe("row")
  })

  it("restores mobile backdrop dismissal and one scrolling safe-area body in CSS", () => {
    const contract = overlayCssContract(readGlobalsCss())
    expect(contract.mobileBackdropPointerNone).toBe(false)
    expect(contract.overlayCapturesPointer).toBe(true)
    expect(contract.singleScrollBody).toBe(true)
    expect(contract.safeAreaAware).toBe(true)
    expect(contract.keyboardAware).toBe(true)
    expect(contract.hasSheetTabs).toBe(true)
    expect(contract.hasSwitchRow).toBe(true)
    expect(contract.hasFormGrid).toBe(true)
    expect(contract.hasStackedFooter).toBe(true)
  })
})
