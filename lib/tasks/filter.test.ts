import { describe, expect, it } from "vitest"
import type { Task } from "@/lib/domain/types"
import { filterTasks } from "./filter"

function task(partial: Partial<Task> & Pick<Task, "id" | "title" | "dueDate">): Task {
  return {
    completed: false,
    priority: "medium",
    ...partial,
  }
}

const now = new Date(2026, 7, 23, 15, 0, 0)

const tasks: Task[] = [
  task({ id: 1, title: "Due today", dueDate: "2026-08-23" }),
  task({ id: 2, title: "Overdue", dueDate: "2026-08-20" }),
  task({ id: 3, title: "Later", dueDate: "2026-08-30" }),
  task({ id: 4, title: "Finished", dueDate: "2026-08-21", completed: true }),
  task({ id: 5, title: "Slogan leftover", dueDate: "someday" }),
]

describe("task list filters", () => {
  it("returns every task for all", () => {
    expect(filterTasks(tasks, "all", now).map((item) => item.id)).toEqual([1, 2, 3, 4, 5])
  })

  it("keeps incomplete tasks due today", () => {
    expect(filterTasks(tasks, "today", now).map((item) => item.title)).toEqual(["Due today"])
  })

  it("keeps incomplete tasks due before today and ignores unknown dates", () => {
    expect(filterTasks(tasks, "overdue", now).map((item) => item.title)).toEqual(["Overdue"])
  })

  it("keeps completed tasks for done", () => {
    expect(filterTasks(tasks, "done", now).map((item) => item.title)).toEqual(["Finished"])
  })
})
