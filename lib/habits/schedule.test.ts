import { describe, expect, it } from "vitest"
import type { Habit } from "@/lib/domain/types"
import { isHabitScheduledOn, scheduledWeekdays } from "./schedule"

function habit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 1,
    name: "Write tests",
    category: "productivity",
    frequency: "daily",
    streak: 0,
    completed: false,
    completedToday: false,
    reminders: false,
    createdAt: "2026-08-01T00:00:00.000Z",
    history: [],
    ...overrides,
  }
}

describe("habit schedule", () => {
  it("treats daily habits as scheduled every day", () => {
    expect(isHabitScheduledOn(habit(), "2026-08-23", "monday")).toBe(true)
    expect(isHabitScheduledOn(habit(), "2026-08-24", "monday")).toBe(true)
  })

  it("limits custom habits to the selected weekdays", () => {
    const custom = habit({ frequency: "custom", customDays: ["Monday", "Wednesday"] })
    expect(isHabitScheduledOn(custom, "2026-08-24", "monday")).toBe(true)
    expect(isHabitScheduledOn(custom, "2026-08-25", "monday")).toBe(false)
    expect(isHabitScheduledOn(custom, "2026-08-26", "monday")).toBe(true)
  })

  it("defaults weekly habits with no days to the week-start weekday", () => {
    expect(scheduledWeekdays(habit({ frequency: "weekly" }), "monday")).toEqual(["Monday"])
    expect(isHabitScheduledOn(habit({ frequency: "weekly" }), "2026-08-24", "monday")).toBe(true)
    expect(isHabitScheduledOn(habit({ frequency: "weekly" }), "2026-08-25", "monday")).toBe(false)
    expect(isHabitScheduledOn(habit({ frequency: "weekly" }), "2026-08-23", "sunday")).toBe(true)
  })
})
