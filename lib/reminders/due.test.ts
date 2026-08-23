import { describe, expect, it } from "vitest"
import { createEmptyWorkspace } from "@/lib/store/workspace"
import { completeRecurringTask, dueReminders } from "./due"

describe("local reminders and recurring tasks", () => {
  it("lists incomplete reminded tasks that are due today or overdue", () => {
    const workspace = createEmptyWorkspace()
    workspace.tasks.push(
      {
        id: 1,
        title: "Pay rent",
        completed: false,
        priority: "high",
        dueDate: "2026-08-23",
        reminders: true,
      },
      {
        id: 2,
        title: "Future work",
        completed: false,
        priority: "low",
        dueDate: "2026-08-30",
        reminders: true,
      },
      {
        id: 3,
        title: "Already done",
        completed: true,
        priority: "low",
        dueDate: "2026-08-23",
        reminders: true,
      },
    )
    workspace.settings.notifications.enabled = true
    workspace.settings.notifications.taskReminders = true

    const due = dueReminders(workspace, new Date("2026-08-23T12:00:00"))
    expect(due.map((item) => item.title)).toEqual(["Pay rent"])
  })

  it("holds habit reminders until the scheduled time on a scheduled day", () => {
    const workspace = createEmptyWorkspace()
    workspace.habits.push({
      id: 8,
      name: "Walk",
      category: "health",
      frequency: "custom",
      customDays: ["Sunday"],
      streak: 0,
      completed: false,
      completedToday: false,
      reminders: true,
      reminderTime: "18:00",
      createdAt: "2026-08-01T00:00:00.000Z",
      history: [],
    })
    workspace.settings.notifications.enabled = true
    workspace.settings.notifications.habitReminders = true

    expect(dueReminders(workspace, new Date(2026, 7, 23, 9, 0, 0)).map((item) => item.title)).toEqual([])
    expect(dueReminders(workspace, new Date(2026, 7, 23, 18, 0, 0)).map((item) => item.title)).toEqual(["Walk"])
    expect(dueReminders(workspace, new Date(2026, 7, 24, 18, 0, 0)).map((item) => item.title)).toEqual([])
  })

  it("spawns the next recurring instance when a task is completed", () => {
    const result = completeRecurringTask(
      {
        id: 4,
        title: "Daily standup",
        completed: false,
        priority: "medium",
        dueDate: "2026-08-23",
        recurring: "daily",
        reminders: true,
      },
      5,
    )

    expect(result.completed.completed).toBe(true)
    expect(result.next?.dueDate).toBe("2026-08-24")
    expect(result.next?.completed).toBe(false)
    expect(result.next?.id).toBe(5)
    expect(result.next?.title).toBe("Daily standup")
  })
})
