import { describe, expect, it } from "vitest"
import { computeStreak, hydrateHabit, toggleHabitOnDate } from "./streak"
import type { Habit } from "@/lib/domain/types"

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

describe("habit streaks", () => {
  it("treats a 23:59 completion as not done after local midnight", () => {
    const afterToggle = toggleHabitOnDate(habit(), "2026-08-23")
    expect(afterToggle.completedToday).toBe(false)
    expect(hydrateHabit(afterToggle, "2026-08-23").completedToday).toBe(true)
    expect(hydrateHabit(afterToggle, "2026-08-24").completedToday).toBe(false)
  })

  it("computes streak from consecutive local dates ending today or yesterday", () => {
    const history = [
      { date: "2026-08-21", completed: true },
      { date: "2026-08-22", completed: true },
      { date: "2026-08-23", completed: true },
    ]
    expect(computeStreak(history, "2026-08-23")).toBe(3)
    expect(computeStreak(history, "2026-08-24")).toBe(3)
    expect(computeStreak(history, "2026-08-25")).toBe(0)
  })

  it("does not increment streak twice on the same day", () => {
    const first = toggleHabitOnDate(habit(), "2026-08-23")
    const second = toggleHabitOnDate(first, "2026-08-23")
    expect(hydrateHabit(first, "2026-08-23").streak).toBe(1)
    expect(hydrateHabit(second, "2026-08-23").completedToday).toBe(false)
    expect(hydrateHabit(second, "2026-08-23").streak).toBe(0)
  })

  it("does not record a completion on an unscheduled day", () => {
    const custom = habit({ frequency: "custom", customDays: ["Monday"] })
    const after = toggleHabitOnDate(custom, "2026-08-25", "monday")
    expect(after.history).toEqual([])
    expect(hydrateHabit(after, "2026-08-25", "monday").completedToday).toBe(false)
  })

  it("skips unscheduled days when computing a streak", () => {
    const history = [
      { date: "2026-08-17", completed: true },
      { date: "2026-08-24", completed: true },
    ]
    const scheduled = (date: string) => date === "2026-08-17" || date === "2026-08-24"
    expect(computeStreak(history, "2026-08-24", scheduled)).toBe(2)
  })
})
