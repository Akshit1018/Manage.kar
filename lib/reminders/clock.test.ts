import { describe, expect, it } from "vitest"
import { localTimeReached } from "./clock"

describe("local reminder clock", () => {
  it("is reached at or after the HH:MM on the same local day", () => {
    expect(localTimeReached(new Date(2026, 7, 23, 8, 59, 0), "09:00")).toBe(false)
    expect(localTimeReached(new Date(2026, 7, 23, 9, 0, 0), "09:00")).toBe(true)
    expect(localTimeReached(new Date(2026, 7, 23, 21, 15, 0), "09:00")).toBe(true)
  })
})
