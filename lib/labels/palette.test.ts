import { describe, expect, it } from "vitest"
import {
  LABEL_COLORS,
  defaultLabelColor,
  isLabelColor,
  labelColor,
  labelColorClasses,
  labelColorDotClass,
  nextLabelColor,
} from "./palette"

describe("label palette", () => {
  it("exposes a small fixed palette of named colors", () => {
    expect(LABEL_COLORS.length).toBeGreaterThanOrEqual(6)
    expect(LABEL_COLORS.length).toBeLessThanOrEqual(8)
    expect(new Set(LABEL_COLORS).size).toBe(LABEL_COLORS.length)
  })

  it("validates color names", () => {
    expect(isLabelColor("teal")).toBe(true)
    expect(isLabelColor("magenta-ish")).toBe(false)
    expect(isLabelColor(42)).toBe(false)
    expect(isLabelColor(undefined)).toBe(false)
  })

  it("assigns a stable default color from the label name", () => {
    const first = defaultLabelColor("groceries")
    expect(first).toBe(defaultLabelColor("groceries"))
    expect(LABEL_COLORS).toContain(first)
  })

  it("prefers an explicit color over the derived default", () => {
    const derived = defaultLabelColor("work")
    const explicit = LABEL_COLORS.find((color) => color !== derived)!
    expect(labelColor({ name: "work", color: explicit })).toBe(explicit)
    expect(labelColor({ name: "work" })).toBe(derived)
  })

  it("cycles through the palette in order", () => {
    let color = LABEL_COLORS[0]
    const seen = new Set([color])
    for (let index = 1; index < LABEL_COLORS.length; index++) {
      color = nextLabelColor(color)
      seen.add(color)
    }
    expect(seen.size).toBe(LABEL_COLORS.length)
    expect(nextLabelColor(color)).toBe(LABEL_COLORS[0])
  })

  it("maps every color to chip and dot classes", () => {
    for (const color of LABEL_COLORS) {
      expect(labelColorClasses(color).length).toBeGreaterThan(0)
      expect(labelColorDotClass(color).length).toBeGreaterThan(0)
    }
  })
})
