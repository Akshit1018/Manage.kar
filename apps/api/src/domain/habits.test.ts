import { describe, expect, it } from "vitest"
import { computeStreak, isHabitScheduledOn } from "./habits.js"
import { localDateKey } from "./dates.js"

describe("habit schedule and streak", () => {
  it("treats daily habits as scheduled every weekday", () => {
    expect(isHabitScheduledOn("daily", [], "2026-08-24", "monday")).toBe(true)
  })

  it("counts consecutive completed scheduled days", () => {
    const today = localDateKey()
    const history = [{ date: today, completed: true }]
    expect(computeStreak(history, today)).toBe(1)
  })

  it("returns zero when today and yesterday are incomplete", () => {
    expect(computeStreak([], "2026-08-24")).toBe(0)
  })
})
