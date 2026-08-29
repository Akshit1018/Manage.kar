import { describe, expect, it } from "vitest"
import { showSimulatedPairingControl } from "./developer"

describe("showSimulatedPairingControl", () => {
  it("hides simulate on the happy path", () => {
    expect(showSimulatedPairingControl({ hash: "", search: "" })).toBe(false)
    expect(showSimulatedPairingControl({ hash: "#machines", search: "?view=chats" })).toBe(false)
  })

  it("shows simulate only for explicit developer gates", () => {
    expect(showSimulatedPairingControl({ hash: "#dev", search: "" })).toBe(true)
    expect(showSimulatedPairingControl({ hash: "", search: "?dev=1" })).toBe(true)
    expect(showSimulatedPairingControl({ hash: "", search: "?view=chats&dev=1" })).toBe(true)
  })
})
