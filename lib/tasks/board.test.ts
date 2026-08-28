import { describe, expect, it } from "vitest"
import type { Task } from "@/lib/domain/types"
import { groupTasksByStatus, isTaskStatus, statusLabel, taskStatus, withTaskStatus } from "./board"

function task(id: number, overrides: Partial<Task> = {}): Task {
  return {
    id,
    title: `Task ${id}`,
    completed: false,
    priority: "medium",
    dueDate: "2026-08-28",
    ...overrides,
  }
}

describe("isTaskStatus", () => {
  it("accepts only the three statuses", () => {
    expect(isTaskStatus("todo")).toBe(true)
    expect(isTaskStatus("doing")).toBe(true)
    expect(isTaskStatus("done")).toBe(true)
    expect(isTaskStatus("blocked")).toBe(false)
    expect(isTaskStatus(undefined)).toBe(false)
  })
})

describe("taskStatus", () => {
  it("maps old data: completed true is done, completed false is todo", () => {
    expect(taskStatus(task(1, { completed: true }))).toBe("done")
    expect(taskStatus(task(2, { completed: false }))).toBe("todo")
  })

  it("respects a doing marker on incomplete tasks", () => {
    expect(taskStatus(task(1, { status: "doing" }))).toBe("doing")
  })

  it("treats completed as the source of truth for done", () => {
    expect(taskStatus(task(1, { completed: true, status: "doing" }))).toBe("done")
    expect(taskStatus(task(2, { completed: false, status: "done" }))).toBe("todo")
  })
})

describe("withTaskStatus", () => {
  it("keeps completed in sync with the status", () => {
    const done = withTaskStatus(task(1), "done")
    expect(done.completed).toBe(true)
    expect(taskStatus(done)).toBe("done")

    const doing = withTaskStatus(done, "doing")
    expect(doing.completed).toBe(false)
    expect(taskStatus(doing)).toBe("doing")

    const todo = withTaskStatus(doing, "todo")
    expect(todo.completed).toBe(false)
    expect(taskStatus(todo)).toBe("todo")
  })
})

describe("groupTasksByStatus", () => {
  it("groups into all three columns, preserving order", () => {
    const tasks = [
      task(1),
      task(2, { status: "doing" }),
      task(3, { completed: true }),
      task(4),
    ]
    const grouped = groupTasksByStatus(tasks)
    expect(grouped.todo.map((item) => item.id)).toEqual([1, 4])
    expect(grouped.doing.map((item) => item.id)).toEqual([2])
    expect(grouped.done.map((item) => item.id)).toEqual([3])
  })
})

describe("statusLabel", () => {
  it("names every status", () => {
    expect(statusLabel("todo")).toBe("To do")
    expect(statusLabel("doing")).toBe("Doing")
    expect(statusLabel("done")).toBe("Done")
  })
})
