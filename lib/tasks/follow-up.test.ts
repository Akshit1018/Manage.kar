import { describe, expect, it } from "vitest"
import type { Task } from "@/lib/domain/types"
import { dueFollowUps, isFollowUpDue, nudgeFollowUp } from "./follow-up"

const NOW = new Date("2026-08-28T12:00:00")

function task(id: number, overrides: Partial<Task> = {}): Task {
  return {
    id,
    title: `Task ${id}`,
    completed: false,
    priority: "medium",
    dueDate: "2026-08-20",
    ...overrides,
  }
}

describe("isFollowUpDue", () => {
  it("is never due without a follow-up rule", () => {
    expect(isFollowUpDue(task(1), NOW)).toBe(false)
  })

  it("is never due once the task is done", () => {
    expect(isFollowUpDue(task(1, { completed: true, followUp: { cadence: "daily" } }), NOW)).toBe(false)
  })

  it("is due immediately when never nudged", () => {
    expect(isFollowUpDue(task(1, { followUp: { cadence: "daily" } }), NOW)).toBe(true)
    expect(isFollowUpDue(task(2, { followUp: { cadence: "weekly" } }), NOW)).toBe(true)
  })

  it("daily: due again the next day, not the same day", () => {
    const nudgedToday = task(1, { followUp: { cadence: "daily", lastNudgedAt: "2026-08-28T08:00:00" } })
    const nudgedYesterday = task(2, { followUp: { cadence: "daily", lastNudgedAt: "2026-08-27T23:00:00" } })
    expect(isFollowUpDue(nudgedToday, NOW)).toBe(false)
    expect(isFollowUpDue(nudgedYesterday, NOW)).toBe(true)
  })

  it("weekly: due again after seven days", () => {
    const nudgedRecently = task(1, { followUp: { cadence: "weekly", lastNudgedAt: "2026-08-24T12:00:00" } })
    const nudgedLastWeek = task(2, { followUp: { cadence: "weekly", lastNudgedAt: "2026-08-20T12:00:00" } })
    expect(isFollowUpDue(nudgedRecently, NOW)).toBe(false)
    expect(isFollowUpDue(nudgedLastWeek, NOW)).toBe(true)
  })

  it("treats an unparseable stamp as never nudged", () => {
    expect(isFollowUpDue(task(1, { followUp: { cadence: "daily", lastNudgedAt: "garbage" } }), NOW)).toBe(true)
  })
})

describe("dueFollowUps", () => {
  it("returns only tasks whose follow-up is due", () => {
    const tasks = [
      task(1, { followUp: { cadence: "daily" } }),
      task(2),
      task(3, { completed: true, followUp: { cadence: "daily" } }),
      task(4, { followUp: { cadence: "daily", lastNudgedAt: "2026-08-28T08:00:00" } }),
    ]
    expect(dueFollowUps(tasks, NOW).map((item) => item.id)).toEqual([1])
  })
})

describe("nudgeFollowUp", () => {
  it("stamps the follow-up so it stops being due today", () => {
    const item = task(1, { followUp: { cadence: "daily" } })
    const nudged = nudgeFollowUp(item, NOW)
    expect(isFollowUpDue(nudged, NOW)).toBe(false)
    expect(nudged.followUp?.cadence).toBe("daily")
  })

  it("leaves tasks without a follow-up untouched", () => {
    const item = task(1)
    expect(nudgeFollowUp(item, NOW)).toEqual(item)
  })
})
