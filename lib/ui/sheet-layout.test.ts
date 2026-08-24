import { describe, expect, it } from "vitest"
import {
  IPHONE_VIEWPORTS,
  overlayContainingBlockIsSafe,
  overlayPositioning,
  overlayPlacement,
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
