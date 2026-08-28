import { describe, expect, it } from "vitest"
import {
  ICON_BAR_WIDTH,
  ORB_BOTTOM_RESERVE,
  ORB_INSET,
  ORB_NUDGE_PX,
  ORB_SIZE,
  applyOrbKeyboardIntent,
  attachOrbPointerFallback,
  clampOrbPosition,
  defaultOrbPosition,
  iconBarPosition,
  movementExceeded,
  orbGestureOutcome,
  orbKeyboardIntent,
  orbLostPointerShouldFinish,
  orbPlacementTransitionMs,
  orbReleaseAction,
  orbViewportBounds,
  parseSavedOrbPosition,
  resolveOrbPlacement,
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

  it("persists whole pixels after a fractional pointer sample", () => {
    expect(clampOrbPosition(8.4, 351.9999084472656, IPHONE_390)).toEqual({ x: 8, y: 352 })
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

describe("orbGestureOutcome", () => {
  it("keeps a short tap as show-icons", () => {
    expect(orbGestureOutcome({ moved: false, longPressFired: false })).toBe("show-icons")
  })

  it("records on release after a stationary long-press", () => {
    expect(orbGestureOutcome({ moved: false, longPressFired: true })).toBe("record")
  })

  it("snaps after a drag instead of opening actions", () => {
    expect(orbGestureOutcome({ moved: true, longPressFired: false })).toBe("snap")
    expect(orbGestureOutcome({ moved: true, longPressFired: true })).toBe("snap")
  })

  it("does not treat a cancelled press as a tap", () => {
    expect(orbGestureOutcome({ moved: false, longPressFired: false, cancelled: true })).toBe("idle")
  })

  it("still parks after a cancelled drag", () => {
    expect(orbGestureOutcome({ moved: true, longPressFired: false, cancelled: true })).toBe("snap")
  })
})

describe("orbKeyboardIntent", () => {
  it("activates the tray with Enter or Space", () => {
    expect(orbKeyboardIntent("Enter")).toEqual({ type: "activate" })
    expect(orbKeyboardIntent(" ")).toEqual({ type: "activate" })
  })

  it("nudges by 16px on arrow keys", () => {
    expect(ORB_NUDGE_PX).toBe(16)
    expect(orbKeyboardIntent("ArrowLeft")).toEqual({ type: "nudge", dx: -16, dy: 0 })
    expect(orbKeyboardIntent("ArrowRight")).toEqual({ type: "nudge", dx: 16, dy: 0 })
    expect(orbKeyboardIntent("ArrowUp")).toEqual({ type: "nudge", dx: 0, dy: -16 })
    expect(orbKeyboardIntent("ArrowDown")).toEqual({ type: "nudge", dx: 0, dy: 16 })
  })

  it("parks Home on the left edge and End on the right", () => {
    expect(orbKeyboardIntent("Home")).toEqual({ type: "park", edge: "left" })
    expect(orbKeyboardIntent("End")).toEqual({ type: "park", edge: "right" })
  })

  it("ignores unrelated keys", () => {
    expect(orbKeyboardIntent("Escape")).toBeNull()
    expect(orbKeyboardIntent("Tab")).toBeNull()
  })
})

describe("applyOrbKeyboardIntent", () => {
  it("clamps a nudge that would leave the viewport", () => {
    expect(applyOrbKeyboardIntent({ x: 8, y: 400 }, { type: "nudge", dx: -16, dy: 0 }, IPHONE_390)).toEqual({
      x: 8,
      y: 400,
    })
  })

  it("parks Home and End on opposite edges without changing y", () => {
    expect(applyOrbKeyboardIntent({ x: 200, y: 400 }, { type: "park", edge: "left" }, IPHONE_390)).toEqual({
      x: 8,
      y: 400,
    })
    expect(applyOrbKeyboardIntent({ x: 200, y: 400 }, { type: "park", edge: "right" }, IPHONE_390)).toEqual({
      x: 326,
      y: 400,
    })
  })
})

describe("orbViewportBounds", () => {
  it("keeps the 76px chrome reserve when the keyboard is closed", () => {
    expect(orbViewportBounds({ width: 390, height: 844 })).toEqual({
      width: 390,
      height: 844,
      bottomReserve: ORB_BOTTOM_RESERVE,
    })
  })

  it("raises the reserve so a 56px orb stays above an iOS keyboard", () => {
    const bounds = orbViewportBounds({
      width: 390,
      height: 844,
      visualHeight: 520,
      visualOffsetTop: 0,
    })
    const overlap = 844 - 520
    expect(bounds.bottomReserve).toBe(overlap + ORB_INSET)
    const pos = clampOrbPosition(200, 800, bounds)
    expect(pos.y + ORB_SIZE).toBeLessThanOrEqual(844 - overlap - ORB_INSET)
  })

  it("raises the reserve to a shared nav and composer chrome height", () => {
    const chromeReserve = 132
    const bounds = orbViewportBounds({
      width: 390,
      height: 844,
      chromeReserve,
    })
    expect(bounds.bottomReserve).toBe(chromeReserve)
    const parked = defaultOrbPosition(bounds)
    expect(parked.y + ORB_SIZE).toBeLessThanOrEqual(844 - chromeReserve)
    expect(snapOrbToEdge({ x: 280, y: 800 }, bounds)).toEqual({
      x: 326,
      y: 844 - ORB_SIZE - chromeReserve,
    })
  })

  it("does not shrink below the 76px floor when chrome is shorter", () => {
    expect(
      orbViewportBounds({ width: 390, height: 844, chromeReserve: 40 }).bottomReserve,
    ).toBe(ORB_BOTTOM_RESERVE)
  })
})

describe("orbPlacementTransitionMs", () => {
  it("places immediately when the user prefers reduced motion", () => {
    expect(orbPlacementTransitionMs(true)).toBe(0)
  })

  it("allows a short snap animation otherwise", () => {
    expect(orbPlacementTransitionMs(false)).toBe(180)
  })
})

describe("orbLostPointerShouldFinish", () => {
  it("finishes only the active unfinished gesture", () => {
    expect(
      orbLostPointerShouldFinish({ activePointerId: 7, eventPointerId: 7, gestureEnded: false }),
    ).toBe(true)
  })

  it("does not finish after pointerup already ended the gesture", () => {
    expect(
      orbLostPointerShouldFinish({ activePointerId: null, eventPointerId: 7, gestureEnded: true }),
    ).toBe(false)
    expect(
      orbLostPointerShouldFinish({ activePointerId: 7, eventPointerId: 7, gestureEnded: true }),
    ).toBe(false)
  })

  it("ignores a lost capture for a different pointer", () => {
    expect(
      orbLostPointerShouldFinish({ activePointerId: 7, eventPointerId: 3, gestureEnded: false }),
    ).toBe(false)
  })
})

describe("parseSavedOrbPosition", () => {
  it("reads a finite parked point", () => {
    expect(parseSavedOrbPosition('{"x":326,"y":712}')).toEqual({ x: 326, y: 712 })
  })

  it("rejects NaN, Infinity, and non-finite coordinates", () => {
    expect(parseSavedOrbPosition('{"x":null,"y":712}')).toBeNull()
    expect(parseSavedOrbPosition('{"x":"8","y":400}')).toBeNull()
    expect(parseSavedOrbPosition(JSON.stringify({ x: Number.NaN, y: 400 }))).toBeNull()
    expect(parseSavedOrbPosition(JSON.stringify({ x: 8, y: Number.POSITIVE_INFINITY }))).toBeNull()
  })

  it("rejects missing or corrupt payloads", () => {
    expect(parseSavedOrbPosition(null)).toBeNull()
    expect(parseSavedOrbPosition("{")).toBeNull()
    expect(parseSavedOrbPosition('{"y":400}')).toBeNull()
  })
})

describe("resolveOrbPlacement", () => {
  it("does not persist a first-paint default", () => {
    const result = resolveOrbPlacement({
      prev: null,
      saved: null,
      bounds: IPHONE_390,
      reason: "hydrate",
    })
    expect(result.next).toEqual(defaultOrbPosition(IPHONE_390))
    expect(result.persist).toBe(false)
  })

  it("persists a hydrate re-clamp of a previously saved point", () => {
    const result = resolveOrbPlacement({
      prev: null,
      saved: { x: 290, y: 744 },
      bounds: IPHONE_SE,
      reason: "hydrate",
    })
    expect(result.next).toEqual({ x: 256, y: 436 })
    expect(result.persist).toBe(true)
  })

  it("is safe to call twice with the same prev without changing the persist decision", () => {
    const input = {
      prev: { x: 326, y: 712 } as { x: number; y: number },
      saved: { x: 326, y: 712 } as { x: number; y: number },
      bounds: IPHONE_SE,
      reason: "viewport" as const,
    }
    const first = resolveOrbPlacement(input)
    const second = resolveOrbPlacement(input)
    expect(first).toEqual(second)
    expect(first.next).toEqual({ x: 256, y: 436 })
    expect(first.persist).toBe(true)
  })
})

describe("attachOrbPointerFallback", () => {
  it("routes matching pointer events and always detaches on cleanup", () => {
    const listeners = new Map<string, Set<EventListenerOrEventListenerObject>>()
    const target = {
      addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
        const set = listeners.get(type) ?? new Set()
        set.add(listener)
        listeners.set(type, set)
      },
      removeEventListener(type: string, listener: EventListenerOrEventListenerObject) {
        listeners.get(type)?.delete(listener)
      },
    }
    const moves: Array<[number, number]> = []
    const ends: string[] = []
    const detach = attachOrbPointerFallback(target, 9, {
      onMove: (x, y) => moves.push([x, y]),
      onUp: () => ends.push("up"),
      onCancel: () => ends.push("cancel"),
    })
    expect([...listeners.keys()].sort()).toEqual(["pointercancel", "pointermove", "pointerup"])

    const fire = (type: string, pointerId: number, clientX = 0, clientY = 0) => {
      const listener = [...(listeners.get(type) ?? [])][0] as EventListener
      listener({ pointerId, clientX, clientY } as PointerEvent)
    }
    fire("pointermove", 4, 10, 10)
    fire("pointermove", 9, 12, 40)
    fire("pointerup", 9)
    fire("pointercancel", 9)
    expect(moves).toEqual([[12, 40]])
    expect(ends).toEqual(["up", "cancel"])

    detach()
    expect([...listeners.values()].every((set) => set.size === 0)).toBe(true)
  })
})
