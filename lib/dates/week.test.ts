import { describe, expect, it } from "vitest"
import { endOfWeek, weekdayName, weekdayOrder } from "./week"

describe("weekday order", () => {
  it("starts on Monday or Sunday based on settings", () => {
    expect(weekdayOrder("monday")[0]).toBe("Monday")
    expect(weekdayOrder("monday")[6]).toBe("Sunday")
    expect(weekdayOrder("sunday")[0]).toBe("Sunday")
    expect(weekdayOrder("sunday")[1]).toBe("Monday")
  })

  it("names a local ISO date and finds the end of the week", () => {
    expect(weekdayName("2026-08-23")).toBe("Sunday")
    expect(endOfWeek("2026-08-23", "monday")).toBe("2026-08-23")
    expect(endOfWeek("2026-08-24", "monday")).toBe("2026-08-30")
    expect(endOfWeek("2026-08-23", "sunday")).toBe("2026-08-29")
  })
})
