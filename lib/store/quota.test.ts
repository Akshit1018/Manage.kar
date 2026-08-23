import { describe, expect, it } from "vitest"
import { createEmptyWorkspace } from "./workspace"
import { QUOTA_WARN_BYTES, estimateWorkspaceBytes, shouldWarnQuota } from "./quota"

describe("workspace quota estimate", () => {
  it("measures the serialized workspace size", () => {
    const workspace = createEmptyWorkspace()
    workspace.tasks.push({
      id: 1,
      title: "Pay rent",
      completed: false,
      priority: "high",
      dueDate: "2026-08-23",
    })

    const bytes = estimateWorkspaceBytes(workspace)
    expect(bytes).toBeGreaterThan(100)
    expect(bytes).toBe(new TextEncoder().encode(JSON.stringify(workspace)).length)
  })

  it("warns at the soft localStorage ceiling", () => {
    expect(shouldWarnQuota(QUOTA_WARN_BYTES - 1)).toBe(false)
    expect(shouldWarnQuota(QUOTA_WARN_BYTES)).toBe(true)
    expect(shouldWarnQuota(4_000_000)).toBe(true)
  })
})
