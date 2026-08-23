import type { Task, Workspace } from "@/lib/domain/types"
import { isDueOnOrBefore, localDateKey, nextDueDate } from "@/lib/dates/due-date"
import { isHabitScheduledOn } from "@/lib/habits/schedule"
import { hydrateHabit } from "@/lib/habits/streak"
import { localTimeReached } from "@/lib/reminders/clock"

export interface DueReminder {
  kind: "task" | "habit"
  id: number
  title: string
  key: string
}

export function reminderKey(kind: DueReminder["kind"], id: number, date: string): string {
  return `${kind}:${id}:${date}`
}

export function dueReminders(workspace: Workspace, now = new Date()): DueReminder[] {
  if (!workspace.settings.notifications.enabled) {
    return []
  }

  const today = localDateKey(now)
  const weekStartsOn = workspace.settings.general.weekStartsOn
  const due: DueReminder[] = []

  if (workspace.settings.notifications.taskReminders) {
    for (const task of workspace.tasks) {
      if (task.reminders && !task.completed && isDueOnOrBefore(task.dueDate, now)) {
        due.push({
          kind: "task",
          id: task.id,
          title: task.title,
          key: reminderKey("task", task.id, today),
        })
      }
    }
  }

  if (workspace.settings.notifications.habitReminders) {
    for (const habit of workspace.habits) {
      const hydrated = hydrateHabit(habit, today, weekStartsOn)
      if (
        habit.reminders &&
        !hydrated.completedToday &&
        isHabitScheduledOn(habit, today, weekStartsOn) &&
        localTimeReached(now, habit.reminderTime ?? "00:00")
      ) {
        due.push({
          kind: "habit",
          id: habit.id,
          title: habit.name,
          key: reminderKey("habit", habit.id, today),
        })
      }
    }
  }

  return due.filter((item) => !workspace.firedReminderKeys.includes(item.key))
}

export function completeRecurringTask(
  task: Task,
  nextId: number,
): { completed: Task; next?: Task } {
  const completed: Task = { ...task, completed: true }
  if (!task.recurring || task.recurring === "none") {
    return { completed }
  }

  return {
    completed,
    next: {
      ...task,
      id: nextId,
      completed: false,
      dueDate: nextDueDate(task.dueDate, task.recurring),
    },
  }
}
