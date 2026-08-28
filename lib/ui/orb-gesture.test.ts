import { describe, expect, it } from "vitest"
import {
  ICON_BAR_WIDTH,
  ORB_SIZE,
  clampOrbPosition,
  defaultOrbPosition,
  iconBarPosition,
  movementExceeded,
  orbReleaseAction,
  snapOrbToEdge,
  type OrbBounds,
} from "./orb-gesture"

const IPHONE_390: OrbBounds = { width: 390, height: 844 }
const IPHONE_SE: OrbBounds = { width: 320, height: 568 }

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
    expect(defaultOrbPosition(IPHONE_390)).toEqual({ x: 290, y: 712 })
  })

  it("keeps a 56px orb above a 76px bottom reserve", () => {
    expect(ORB_SIZE).toBe(56)
    const pos = clampOrbPosition(-40, 2000, IPHONE_390)
    expect(pos).toEqual({ x: 8, y: 712 })
    expect(pos.y + ORB_SIZE).toBeLessThanOrEqual(IPHONE_390.height - 76)
  })

  it("sits the icon bar above and inward from a left-side ball", () => {
    expect(iconBarPosition({ x: 100, y: 744 }, IPHONE_390)).toEqual({ x: 160, y: 684 })
  })

  it("keeps all four icons on screen when the ball hugs the right edge", () => {
    const bar = iconBarPosition({ x: 290, y: 744 }, IPHONE_390)
    expect(bar.x + ICON_BAR_WIDTH).toBeLessThanOrEqual(IPHONE_390.width - 8)
    expect(bar.x).toBeGreaterThanOrEqual(8)
  })

  it("never pushes the bar above the top edge", () => {
    expect(iconBarPosition({ x: 100, y: 20 }, IPHONE_390).y).toBe(8)
  })

  it("re-clamps a previously valid 390x844 position inside 320x568", () => {
    const previous = { x: 290, y: 744 }
    const next = clampOrbPosition(previous.x, previous.y, IPHONE_SE)
    expect(next.x).toBeGreaterThanOrEqual(8)
    expect(next.x + ORB_SIZE).toBeLessThanOrEqual(IPHONE_SE.width - 8)
    expect(next.y).toBeGreaterThanOrEqual(8)
    expect(next.y + ORB_SIZE).toBeLessThanOrEqual(IPHONE_SE.height - 76)
    expect(next).not.toEqual(previous)
  })

  it("keeps the tray visible and inward on the left edge", () => {
    const orb = { x: 8, y: 400 }
    const bar = iconBarPosition(orb, IPHONE_390)
    expect(bar.x).toBeGreaterThan(orb.x)
    expect(bar.x).toBeGreaterThanOrEqual(8)
    expect(bar.x + ICON_BAR_WIDTH).toBeLessThanOrEqual(IPHONE_390.width - 8)
  })

  it("keeps the tray visible and inward on the right edge", () => {
    const orb = { x: IPHONE_390.width - ORB_SIZE - 8, y: 400 }
    const bar = iconBarPosition(orb, IPHONE_390)
    expect(bar.x + ICON_BAR_WIDTH).toBeLessThanOrEqual(orb.x + ORB_SIZE)
    expect(bar.x).toBeGreaterThanOrEqual(8)
    expect(bar.x + ICON_BAR_WIDTH).toBeLessThanOrEqual(IPHONE_390.width - 8)
  })

  it("snaps a right-side release to the nearest edge", () => {
    const snapped = snapOrbToEdge({ x: 280, y: 400 }, IPHONE_390)
    expect(snapped.x).toBe(IPHONE_390.width - ORB_SIZE - 8)
    expect(snapped.y).toBe(400)
  })

  it("snaps a left-side release to the nearest edge", () => {
    const snapped = snapOrbToEdge({ x: 60, y: 400 }, IPHONE_390)
    expect(snapped.x).toBe(8)
    expect(snapped.y).toBe(400)
  })
})
