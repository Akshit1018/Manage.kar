import { describe, expect, it } from "vitest"
import type { Task, Workspace } from "@/lib/domain/types"
import { createEmptyWorkspace } from "./workspace"
import { mergeWorkspaces, stampWorkspaceMutation } from "./merge"

function task(partial: Partial<Task> & Pick<Task, "id" | "title">): Task {
  return {
    completed: false,
    priority: "medium",
    dueDate: "2026-08-23",
    ...partial,
  }
}

function withTasks(workspace: Workspace, tasks: Task[]): Workspace {
  return { ...workspace, tasks }
}

describe("workspace merge", () => {
  it("keeps a local-only create and an incoming edit of a different task", () => {
    const base = createEmptyWorkspace()
    const current = withTasks(base, [
      task({ id: 1, title: "Shared", updatedAt: "2026-08-23T10:00:00.000Z" }),
      task({ id: 2, title: "Local only", updatedAt: "2026-08-23T10:05:00.000Z" }),
    ])
    const incoming = withTasks(base, [
      task({ id: 1, title: "Shared edited", completed: true, updatedAt: "2026-08-23T10:06:00.000Z" }),
    ])

    const merged = mergeWorkspaces(current, incoming)
    expect(merged.tasks.map((item) => item.title).sort()).toEqual(["Local only", "Shared edited"])
    expect(merged.tasks.find((item) => item.id === 1)?.completed).toBe(true)
  })

  it("honors tombstones so a delete in one tab is not resurrected", () => {
    const base = createEmptyWorkspace()
    const current = {
      ...withTasks(base, [
        task({ id: 1, title: "Keep", updatedAt: "2026-08-23T10:00:00.000Z" }),
        task({ id: 2, title: "About to die", updatedAt: "2026-08-23T10:00:00.000Z" }),
      ]),
    }
    const incoming = {
      ...withTasks(base, [task({ id: 1, title: "Keep", updatedAt: "2026-08-23T10:00:00.000Z" })]),
      deletedIds: { ...base.deletedIds, tasks: [2] },
    }

    const merged = mergeWorkspaces(current, incoming)
    expect(merged.tasks.map((item) => item.id)).toEqual([1])
    expect(merged.deletedIds.tasks).toContain(2)
  })

  it("does not revive a locally deleted entity that the other tab still has", () => {
    const base = createEmptyWorkspace()
    const current = {
      ...withTasks(base, []),
      deletedIds: { ...base.deletedIds, tasks: [9] },
    }
    const incoming = withTasks(base, [task({ id: 9, title: "Stale other tab", updatedAt: "2026-08-23T09:00:00.000Z" })])

    const merged = mergeWorkspaces(current, incoming)
    expect(merged.tasks).toEqual([])
    expect(merged.deletedIds.tasks).toContain(9)
  })

  it("prefers the newer updatedAt when both tabs edited the same id", () => {
    const base = createEmptyWorkspace()
    const current = withTasks(base, [task({ id: 1, title: "Older title", updatedAt: "2026-08-23T10:00:00.000Z" })])
    const incoming = withTasks(base, [task({ id: 1, title: "Newer title", updatedAt: "2026-08-23T10:01:00.000Z" })])

    expect(mergeWorkspaces(current, incoming).tasks[0]?.title).toBe("Newer title")
    expect(mergeWorkspaces(incoming, current).tasks[0]?.title).toBe("Newer title")
  })

  it("stamps updatedAt and tombstones when a mutation removes an entity", () => {
    const previous = withTasks(createEmptyWorkspace(), [task({ id: 1, title: "Gone" }), task({ id: 2, title: "Stay" })])
    const next = withTasks(previous, [task({ id: 2, title: "Stay edited" })])
    const stamped = stampWorkspaceMutation(previous, next, new Date("2026-08-23T15:00:00.000Z"))

    expect(stamped.deletedIds.tasks).toEqual([1])
    expect(stamped.tasks).toHaveLength(1)
    expect(stamped.tasks[0]?.title).toBe("Stay edited")
    expect(stamped.tasks[0]?.updatedAt).toBe("2026-08-23T15:00:00.000Z")
  })

  it("clears a tombstone when the same id is created again", () => {
    const previous = {
      ...createEmptyWorkspace(),
      deletedIds: { ...createEmptyWorkspace().deletedIds, tasks: [4] },
    }
    const next = withTasks(previous, [task({ id: 4, title: "Reborn" })])
    const stamped = stampWorkspaceMutation(previous, next, new Date("2026-08-23T16:00:00.000Z"))

    expect(stamped.deletedIds.tasks).toEqual([])
    expect(stamped.tasks[0]?.id).toBe(4)
  })
})
