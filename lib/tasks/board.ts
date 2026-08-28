import type { Task, TaskStatus } from "@/lib/domain/types"

export const TASK_STATUSES: readonly TaskStatus[] = ["todo", "doing", "done"]

export const DEFAULT_TASK_OWNER = "me"

export function isTaskStatus(value: unknown): value is TaskStatus {
  return value === "todo" || value === "doing" || value === "done"
}

/**
 * `completed` remains the source of truth for done-ness so the existing
 * toggle paths cannot desync the board: a completed task is always "done",
 * and an incomplete task is only "doing" when explicitly marked.
 */
export function taskStatus(task: Pick<Task, "completed" | "status">): TaskStatus {
  if (task.completed) {
    return "done"
  }
  return task.status === "doing" ? "doing" : "todo"
}

export function withTaskStatus(task: Task, status: TaskStatus): Task {
  switch (status) {
    case "todo":
      return { ...task, completed: false, status: "todo" }
    case "doing":
      return { ...task, completed: false, status: "doing" }
    case "done":
      return { ...task, completed: true, status: "done" }
    default: {
      const exhaustive: never = status
      return exhaustive
    }
  }
}

export function groupTasksByStatus(tasks: Task[]): Record<TaskStatus, Task[]> {
  const grouped: Record<TaskStatus, Task[]> = { todo: [], doing: [], done: [] }
  for (const task of tasks) {
    grouped[taskStatus(task)].push(task)
  }
  return grouped
}

export function statusLabel(status: TaskStatus): string {
  switch (status) {
    case "todo":
      return "To do"
    case "doing":
      return "Doing"
    case "done":
      return "Done"
    default: {
      const exhaustive: never = status
      return exhaustive
    }
  }
}
