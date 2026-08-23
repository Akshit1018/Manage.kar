import type { Task } from "@/lib/domain/types"
import { localDateKey, normalizeDueDate } from "@/lib/dates/due-date"

export type TaskListFilter = "all" | "today" | "overdue" | "done"

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export function isTaskListFilter(value: string | null): value is TaskListFilter {
  return value === "all" || value === "today" || value === "overdue" || value === "done"
}

export function filterTasks(tasks: Task[], filter: TaskListFilter, now = new Date()): Task[] {
  const today = localDateKey(now)
  switch (filter) {
    case "all":
      return tasks
    case "today":
      return tasks.filter((task) => !task.completed && normalizeDueDate(task.dueDate, now) === today)
    case "overdue":
      return tasks.filter((task) => {
        if (task.completed) {
          return false
        }
        const due = normalizeDueDate(task.dueDate, now)
        return ISO_DATE.test(due) && due < today
      })
    case "done":
      return tasks.filter((task) => task.completed)
    default: {
      const exhaustive: never = filter
      return exhaustive
    }
  }
}
