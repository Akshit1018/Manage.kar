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

  it("sizes the tray for four 44px buttons plus gaps and padding", () => {
    expect(ICON_BAR_WIDTH).toBe(4 * 44 + 3 * 8 + 16)
  })

  it("keeps a 44px-button tray visible at the 320 right edge", () => {
    const liveTrayWidth = 4 * 44 + 3 * 8 + 16
    const orb = snapOrbToEdge({ x: 300, y: 400 }, IPHONE_SE)
    const bar = iconBarPosition(orb, IPHONE_SE)
    expect(orb.x).toBe(256)
    expect(bar.x).toBeGreaterThanOrEqual(8)
    expect(bar.x + liveTrayWidth).toBeLessThanOrEqual(IPHONE_SE.width - 8)
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
    expect(next).toEqual({ x: 256, y: 436 })
  })

  it("leaves an already valid 320x568 point unchanged", () => {
    expect(clampOrbPosition(200, 300, IPHONE_SE)).toEqual({ x: 200, y: 300 })
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

  it("snaps the 390 parked-edge midpoint x=167 to the left edge", () => {
    expect(snapOrbToEdge({ x: 167, y: 400 }, IPHONE_390)).toEqual({ x: 8, y: 400 })
  })

  it("snaps just past the 390 parked-edge midpoint x=168 to the right edge", () => {
    expect(snapOrbToEdge({ x: 168, y: 400 }, IPHONE_390)).toEqual({ x: 326, y: 400 })
  })

  it("snaps a release in the reserved chrome band to the nearest edge and max y", () => {
    expect(snapOrbToEdge({ x: 280, y: 800 }, IPHONE_390)).toEqual({ x: 326, y: 712 })
  })

  it("does not snap to a negative x when the viewport is narrower than the orb", () => {
    const tiny = { width: 50, height: 200 }
    const snapped = snapOrbToEdge({ x: 20, y: 40 }, tiny)
    expect(snapped.x).toBeGreaterThanOrEqual(0)
    expect(snapped).toEqual(clampOrbPosition(20, 40, tiny))
  })
})
