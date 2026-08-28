import { describe, expect, it } from "vitest"
import {
  clampOrbPosition,
  defaultOrbPosition,
  iconBarPosition,
  movementExceeded,
  orbReleaseAction,
} from "./orb-gesture"

describe("movementExceeded", () => {
  it("ignores finger jitter under 10px", () => {
    expect(movementExceeded(6, 6)).toBe(false)
  })

  it("treats 10px as a drag", () => {
    expect(movementExceeded(10, 0)).toBe(true)
  })
})

describe("orbReleaseAction", () => {
  it("shows the small task/note icons on a short tap", () => {
    expect(orbReleaseAction({ moved: false, longPressFired: false })).toBe("show-icons")
  })

  it("records after a long-press, not the small icons", () => {
    expect(orbReleaseAction({ moved: false, longPressFired: true })).toBe("record")
  })

  it("does not toggle icons after a drag", () => {
    expect(orbReleaseAction({ moved: true, longPressFired: false })).toBe("ignore")
  })
})

describe("orb placement", () => {
  it("parks the ball near the bottom-right", () => {
    expect(defaultOrbPosition({ width: 390, height: 844 })).toEqual({ x: 290, y: 744 })
  })

  it("keeps the ball inside the viewport", () => {
    expect(clampOrbPosition(-40, 2000, { width: 390, height: 844 })).toEqual({ x: 8, y: 780 })
  })

  it("sits the icon bar above and left of the ball", () => {
    expect(iconBarPosition({ x: 100, y: 744 }, { width: 390, height: 844 })).toEqual({ x: 40, y: 684 })
  })

  it("keeps all four icons on screen when the ball hugs the right edge", () => {
    const bar = iconBarPosition({ x: 290, y: 744 }, { width: 390, height: 844 })
    expect(bar.x + 176).toBeLessThanOrEqual(390 - 8)
    expect(bar.x).toBeGreaterThanOrEqual(8)
  })

  it("never pushes the bar above the top edge", () => {
    expect(iconBarPosition({ x: 100, y: 20 }, { width: 390, height: 844 }).y).toBe(8)
  })
})
