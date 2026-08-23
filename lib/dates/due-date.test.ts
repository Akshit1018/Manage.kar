import { describe, expect, it } from "vitest"
import {
  formatDueDate,
  localDateKey,
  nextDueDate,
  normalizeDueDate,
} from "./due-date"

describe("due dates", () => {
  it("normalizes slogan due dates to local ISO dates", () => {
    const now = new Date("2026-08-23T15:00:00-04:00")

    expect(normalizeDueDate("Today", now)).toBe("2026-08-23")
    expect(normalizeDueDate("Tomorrow", now)).toBe("2026-08-24")
    expect(normalizeDueDate("2026-09-01", now)).toBe("2026-09-01")
  })

  it("formats ISO dates using the workspace date format", () => {
    expect(formatDueDate("2026-08-23", "YYYY-MM-DD")).toBe("2026-08-23")
    expect(formatDueDate("2026-08-23", "MM/DD/YYYY")).toBe("08/23/2026")
    expect(formatDueDate("2026-08-23", "DD/MM/YYYY")).toBe("23/08/2026")
  })

  it("advances recurring due dates", () => {
    expect(nextDueDate("2026-08-23", "daily")).toBe("2026-08-24")
    expect(nextDueDate("2026-08-23", "weekly")).toBe("2026-08-30")
    expect(nextDueDate("2026-01-31", "monthly")).toBe("2026-02-28")
  })

  it("uses the local calendar date, not UTC", () => {
    const lateEveningLocal = new Date(2026, 7, 23, 23, 30, 0)
    expect(localDateKey(lateEveningLocal)).toBe("2026-08-23")
  })
})
