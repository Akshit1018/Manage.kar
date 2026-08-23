import { describe, expect, it } from "vitest"
import { createEmptyWorkspace } from "@/lib/store/workspace"
import { importSharedTasks, sharePayloadHash } from "./import-tasks"

describe("shared task import", () => {
  it("is idempotent for the same payload hash", () => {
    const payload = {
      userName: "Ada",
      sharedAt: "2026-08-23T00:00:00.000Z",
      tasks: [
        {
          id: 9,
          title: "Imported once",
          completed: false,
          priority: "high" as const,
          dueDate: "2026-08-24",
        },
      ],
    }
    const hash = sharePayloadHash(payload)
    let workspace = createEmptyWorkspace()

    const first = importSharedTasks(workspace, payload)
    expect(first.imported).toBe(1)
    expect(first.skipped).toBe(0)
    workspace = first.workspace

    const second = importSharedTasks(workspace, payload)
    expect(second.imported).toBe(0)
    expect(second.skipped).toBe(1)
    expect(second.workspace.tasks).toHaveLength(1)
    expect(second.workspace.importedShareHashes).toContain(hash)
  })
})
