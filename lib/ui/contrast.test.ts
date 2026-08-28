import { describe, expect, it } from "vitest"
import {
  contrastRatio,
  featuredLightSupportContrast,
  mixSrgb,
  parseCssColor,
  rectFitsViewport,
} from "./contrast"

describe("contrast helpers", () => {
  it("computes WCAG contrast for black on white", () => {
    expect(contrastRatio(parseCssColor("#000000")!, parseCssColor("#ffffff")!)).toBeCloseTo(21, 5)
  })

  it("keeps light featured support text at least 4.5:1", () => {
    expect(featuredLightSupportContrast()).toBeGreaterThanOrEqual(4.5)
  })

  it("mixes sRGB channels the same way color-mix does", () => {
    const mixed = mixSrgb(parseCssColor("#e85d2a")!, parseCssColor("#e8f2fd")!, 0.78)
    expect(Math.round(mixed.r)).toBe(232)
    expect(Math.round(mixed.g)).toBe(126)
    expect(Math.round(mixed.b)).toBe(88)
  })
})

describe("rectFitsViewport", () => {
  it("rejects a control that paints past a 320px viewport", () => {
    expect(rectFitsViewport({ x: 212, width: 119 }, { width: 320 })).toBe(false)
    expect(rectFitsViewport({ x: 16, width: 273 }, { width: 320 })).toBe(true)
  })
})
