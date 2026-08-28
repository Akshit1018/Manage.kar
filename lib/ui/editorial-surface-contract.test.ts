import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  countMkTouchMinSizeRules,
  iosZoomGuardIsUnlayered,
  iosZoomGuardLivesInBaseLayer,
  readGlobalsCss,
  touchTargetFloorIsUnlayered,
  touchTargetFloorLivesInBaseLayer,
} from "./editorial-surface-contract"

const BUTTON_TSX = readFileSync(path.join(process.cwd(), "components/ui/button.tsx"), "utf8")

describe("editorial surface CSS contract", () => {
  const globalsCss = readGlobalsCss()

  it("keeps the iOS zoom guard unlayered with max(16px, 1em) so it beats Tailwind text-sm", () => {
    expect(iosZoomGuardLivesInBaseLayer(globalsCss)).toBe(false)
    expect(iosZoomGuardIsUnlayered(globalsCss)).toBe(true)
  })

  it("keeps the 44px touch floor unlayered so utility min-height overrides cannot shrink controls", () => {
    expect(touchTargetFloorLivesInBaseLayer(globalsCss)).toBe(false)
    expect(touchTargetFloorIsUnlayered(globalsCss)).toBe(true)
  })

  it("defines mk-touch min-size in a single rule block", () => {
    expect(countMkTouchMinSizeRules(globalsCss)).toBe(1)
  })

  it("keeps Button sm height aligned with the 44px floor", () => {
    expect(BUTTON_TSX).toMatch(/sm:\s*"min-h-11 h-11/)
    expect(BUTTON_TSX).not.toMatch(/sm:\s*"min-h-11 h-10/)
  })

  it("defines shared bottom chrome and a theme-compatible featured surface", () => {
    expect(globalsCss).toMatch(/--mk-bottom-nav:/)
    expect(globalsCss).toMatch(/--mk-composer-slot:/)
    expect(globalsCss).toMatch(/--mk-bottom-chrome:/)
    expect(globalsCss).toMatch(/--mk-featured:/)
    expect(globalsCss).toMatch(/--mk-featured-foreground:/)
    expect(globalsCss).toMatch(/\.mk-featured-surface\s*\{/)
    expect(globalsCss).toMatch(/\.mk-pill-nav\s*\{/)
    expect(globalsCss).toMatch(/\.mk-workspace\s*\{/)
  })
})
