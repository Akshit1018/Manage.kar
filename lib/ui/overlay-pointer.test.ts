import { describe, expect, it } from "vitest"
import {
  backdropPointerDown,
  createGhostEventShield,
  installGhostEventShield,
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
    expect(
      shield.consume({ type: "pointerup", pointerId: 7, clientX: 160, clientY: 6 }),
    ).toBe("block")
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
})
