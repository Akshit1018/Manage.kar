import { describe, expect, it } from "vitest"
import { keyboardOverlap } from "./visual-viewport"

describe("visual viewport keyboard overlap", () => {
  it("returns zero when the visual viewport matches the layout viewport", () => {
    expect(keyboardOverlap(874, 874, 0)).toBe(0)
  })

  it("lifts the sheet by the covered height when iOS opens the keyboard", () => {
    expect(keyboardOverlap(874, 520, 0)).toBe(354)
    expect(keyboardOverlap(956, 540, 48)).toBe(368)
  })

  it("never returns a negative inset", () => {
    expect(keyboardOverlap(800, 900, 0)).toBe(0)
  })
})
