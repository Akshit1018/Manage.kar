import { describe, expect, it } from "vitest"
import { weekdayOrder } from "./week"

describe("weekday order", () => {
  it("starts on Monday or Sunday based on settings", () => {
    expect(weekdayOrder("monday")[0]).toBe("Monday")
    expect(weekdayOrder("monday")[6]).toBe("Sunday")
    expect(weekdayOrder("sunday")[0]).toBe("Sunday")
    expect(weekdayOrder("sunday")[1]).toBe("Monday")
  })
})
