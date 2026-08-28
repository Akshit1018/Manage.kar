import { describe, expect, it } from "vitest"
import {
  backdropPointerDown,
  createGhostEventShield,
  installGhostEventShield,
  overlayPointerGuardAfterOpenChange,
  overlayPointerResult,
  type PointerGuardDocument,
} from "./overlay-pointer"

describe("overlay pointer contract", () => {
  it("dismisses only from the backdrop and never forwards the hit to the workspace", () => {
    expect(overlayPointerResult("backdrop")).toEqual({ dismiss: true, reachesWorkspace: false })
    expect(overlayPointerResult("sheet")).toEqual({ dismiss: false, reachesWorkspace: false })
    expect(overlayPointerResult("workspace")).toEqual({ dismiss: false, reachesWorkspace: false })
  })

  it("closes on primary pointerdown and consumes the event so the leftover click cannot land underneath", () => {
    const events: string[] = []
    const result = backdropPointerDown({
      button: 0,
      pointerType: "touch",
      preventDefault: () => events.push("prevent"),
      stopPropagation: () => events.push("stop"),
    })
    expect(result).toBe("dismiss")
    expect(events).toEqual(["prevent", "stop"])
    expect(
      backdropPointerDown({
        button: 2,
        pointerType: "mouse",
        preventDefault: () => events.push("prevent"),
        stopPropagation: () => events.push("stop"),
      }),
    ).toBe("ignore")
  })
})

describe("one-shot ghost-event shield", () => {
  const origin = { pointerId: 7, clientX: 160, clientY: 6 }

  it("blocks the leftover same-gesture click once, then disarms", () => {
    const shield = createGhostEventShield(origin)
    expect(shield.armed).toBe(true)
    expect(shield.consume({ type: "click", clientX: 160, clientY: 6 })).toBe("block")
    expect(shield.armed).toBe(false)
    expect(shield.consume({ type: "click", clientX: 160, clientY: 6 })).toBe("ignore")
  })

  it("does not swallow a fresh tap from a new pointer 100ms later", () => {
    const shield = createGhostEventShield(origin)
    expect(
      shield.consume({ type: "pointerdown", pointerId: 8, clientX: 160, clientY: 6 }),
    ).toBe("ignore")
    expect(shield.armed).toBe(false)
    expect(
      shield.consume({ type: "pointerup", pointerId: 8, clientX: 160, clientY: 6 }),
    ).toBe("ignore")
    expect(shield.consume({ type: "click", clientX: 160, clientY: 6 })).toBe("ignore")
  })

  it("disarms on dismiss pointerup so a reused pointerId with no leftover click is not swallowed", () => {
    const shield = createGhostEventShield(origin)
    expect(
      shield.consume({ type: "pointerup", pointerId: 7, clientX: 160, clientY: 6 }),
    ).toBe("block")
    expect(shield.armed).toBe(false)
    expect(
      shield.consume({ type: "pointerdown", pointerId: 7, clientX: 290, clientY: 656 }),
    ).toBe("ignore")
    expect(shield.armed).toBe(false)
    expect(
      shield.consume({ type: "pointerup", pointerId: 7, clientX: 290, clientY: 656 }),
    ).toBe("ignore")
    expect(shield.consume({ type: "click", clientX: 290, clientY: 656 })).toBe("ignore")
  })

  it("clears on a later pointerdown that reuses the dismiss pointerId when no click arrives", () => {
    const shield = createGhostEventShield(origin)
    expect(
      shield.consume({ type: "pointerdown", pointerId: 7, clientX: 290, clientY: 656 }),
    ).toBe("ignore")
    expect(shield.armed).toBe(false)
    expect(
      shield.consume({ type: "pointerup", pointerId: 7, clientX: 290, clientY: 656 }),
    ).toBe("ignore")
    expect(shield.consume({ type: "click", clientX: 290, clientY: 656 })).toBe("ignore")
  })

  it("disarms without a leftover click so later events of the same pointerId pass through", () => {
    const shield = createGhostEventShield(origin)
    shield.disarm()
    expect(shield.armed).toBe(false)
    expect(
      shield.consume({ type: "pointerup", pointerId: 7, clientX: 160, clientY: 6 }),
    ).toBe("ignore")
    expect(shield.consume({ type: "click", clientX: 160, clientY: 6 })).toBe("ignore")
  })

  it("ignores a different pointer while still armed for the original gesture", () => {
    const shield = createGhostEventShield(origin)
    expect(
      shield.consume({ type: "pointerup", pointerId: 99, clientX: 10, clientY: 10 }),
    ).toBe("ignore")
    expect(shield.armed).toBe(true)
    expect(shield.consume({ type: "click", clientX: 160, clientY: 6 })).toBe("block")
    expect(shield.armed).toBe(false)
  })

  it("installs a capture listener that removes itself after the leftover click", () => {
    const listeners = new Map<string, EventListener>()
    const doc: PointerGuardDocument = {
      addEventListener(type, listener) {
        listeners.set(type, listener)
      },
      removeEventListener(type) {
        listeners.delete(type)
      },
    }
    const dispose = installGhostEventShield(doc, origin)
    expect(listeners.has("click")).toBe(true)
    expect(listeners.has("pointerup")).toBe(true)

    const events: string[] = []
    const leftover = {
      type: "click",
      clientX: 160,
      clientY: 6,
      preventDefault: () => events.push("prevent"),
      stopPropagation: () => events.push("stop"),
    }
    listeners.get("click")?.(leftover as unknown as Event)
    expect(events).toEqual(["prevent", "stop"])
    expect(listeners.size).toBe(0)
    dispose()
  })

  it("disposes on the dismiss pointerup when preventDefault suppressed the leftover click", () => {
    const listeners = new Map<string, EventListener>()
    const doc: PointerGuardDocument = {
      addEventListener(type, listener) {
        listeners.set(type, listener)
      },
      removeEventListener(type) {
        listeners.delete(type)
      },
    }
    installGhostEventShield(doc, origin)
    const events: string[] = []
    listeners.get("pointerup")?.({
      type: "pointerup",
      pointerId: 7,
      clientX: 160,
      clientY: 6,
      preventDefault: () => events.push("prevent"),
      stopPropagation: () => events.push("stop"),
    } as unknown as Event)
    expect(events).toEqual(["prevent", "stop"])
    expect(listeners.size).toBe(0)

    const later = {
      type: "pointerdown",
      pointerId: 7,
      clientX: 290,
      clientY: 656,
      preventDefault: () => events.push("later-prevent"),
      stopPropagation: () => events.push("later-stop"),
    }
    listeners.get("pointerdown")?.(later as unknown as Event)
    expect(events).toEqual(["prevent", "stop"])
  })

  it("disposes on a later same-pointerId pointerdown when no leftover click arrives", () => {
    const listeners = new Map<string, EventListener>()
    const doc: PointerGuardDocument = {
      addEventListener(type, listener) {
        listeners.set(type, listener)
      },
      removeEventListener(type) {
        listeners.delete(type)
      },
    }
    installGhostEventShield(doc, origin)
    const events: string[] = []
    listeners.get("pointerdown")?.({
      type: "pointerdown",
      pointerId: 7,
      clientX: 290,
      clientY: 656,
      preventDefault: () => events.push("prevent"),
      stopPropagation: () => events.push("stop"),
    } as unknown as Event)
    expect(events).toEqual([])
    expect(listeners.size).toBe(0)
  })
})

describe("overlay pointer guard lifetime", () => {
  it("disposes the installed shield when the sheet is no longer open", () => {
    expect(overlayPointerGuardAfterOpenChange(true)).toBe("keep")
    expect(overlayPointerGuardAfterOpenChange(false)).toBe("dispose")
  })
})
