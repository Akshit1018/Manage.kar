import { describe, expect, it } from "vitest"
import {
  bindHermesSession,
  mapInboundSessionId,
  outboundHermesSessionId,
  resetHermesSessionMap,
} from "./session-map"

describe("Hermes session map", () => {
  it("rewrites inbound Hermes ids onto the dialer row and outbound the other way", () => {
    resetHermesSessionMap()
    bindHermesSession("machine-m1", "a1b2c3d4")
    expect(mapInboundSessionId("a1b2c3d4")).toBe("machine-m1")
    expect(outboundHermesSessionId("machine-m1")).toBe("a1b2c3d4")
    expect(mapInboundSessionId("unknown")).toBe("unknown")
    resetHermesSessionMap()
  })
})
