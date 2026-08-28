import { describe, expect, it } from "vitest"
import {
  POINTER_THROUGH_GUARD_MS,
  armPointerThroughGuard,
  backdropPointerDown,
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

  it("arms a capture guard that swallows the leftover click after a nested sheet unmounts", () => {
    const listeners = new Map<string, EventListener>()
    const doc: PointerGuardDocument = {
      addEventListener(type, listener) {
        listeners.set(type, listener)
      },
      removeEventListener(type) {
        listeners.delete(type)
      },
    }
    let scheduled: (() => void) | undefined
    const dispose = armPointerThroughGuard(doc, {
      schedule: (fn, ms) => {
        expect(ms).toBe(POINTER_THROUGH_GUARD_MS)
        scheduled = fn
        return 1
      },
      cancel: () => {
        scheduled = undefined
      },
    })

    const events: string[] = []
    const leftover = {
      preventDefault: () => events.push("prevent"),
      stopPropagation: () => events.push("stop"),
    } as unknown as Event
    listeners.get("click")?.(leftover)
    listeners.get("pointerup")?.(leftover)
    expect(events).toEqual(["prevent", "stop", "prevent", "stop"])

    scheduled?.()
    expect(listeners.size).toBe(0)
    dispose()
  })
})
