import { describe, expect, it } from "vitest"
import { createEmptyWorkspace } from "@/lib/store/workspace"
import { dueFromSnapshot, buildReminderSnapshot } from "./snapshot"

describe("reminder snapshot", () => {
  it("captures enough fields for the service worker to evaluate due items", () => {
    const workspace = createEmptyWorkspace()
    workspace.settings.notifications.enabled = true
    workspace.settings.notifications.taskReminders = true
    workspace.settings.notifications.habitReminders = true
    workspace.tasks.push({
      id: 1,
      title: "Pay rent",
      completed: false,
      priority: "high",
      dueDate: "2026-08-23",
      reminders: true,
    })
    workspace.habits.push({
      id: 8,
      name: "Walk",
      category: "health",
      frequency: "daily",
      streak: 0,
      completed: false,
      completedToday: false,
      reminders: true,
      reminderTime: "18:00",
      createdAt: "2026-08-01T00:00:00.000Z",
      history: [],
    })

    const snapshot = buildReminderSnapshot(workspace)
    expect(snapshot.tasks).toHaveLength(1)
    expect(snapshot.habits[0]?.reminderTime).toBe("18:00")

    expect(dueFromSnapshot(snapshot, new Date(2026, 7, 23, 12, 0, 0)).map((item) => item.title)).toEqual(["Pay rent"])
    expect(dueFromSnapshot(snapshot, new Date(2026, 7, 23, 18, 0, 0)).map((item) => item.title)).toEqual([
      "Pay rent",
      "Walk",
    ])
  })

  it("skips fired keys already recorded in the snapshot", () => {
    const workspace = createEmptyWorkspace()
    workspace.settings.notifications.enabled = true
    workspace.settings.notifications.taskReminders = true
    workspace.firedReminderKeys = ["task:1:2026-08-23"]
    workspace.tasks.push({
      id: 1,
      title: "Pay rent",
      completed: false,
      priority: "high",
      dueDate: "2026-08-23",
      reminders: true,
    })

    const snapshot = buildReminderSnapshot(workspace)
    expect(dueFromSnapshot(snapshot, new Date(2026, 7, 23, 12, 0, 0))).toEqual([])
  })
})
