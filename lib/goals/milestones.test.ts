import { describe, expect, it } from "vitest"
import type { Goal } from "@/lib/domain/types"
import { addMilestone } from "./milestones"

const goal: Goal = {
  id: 1,
  title: "Ship leftovers",
  description: "",
  category: "work",
  priority: "high",
  targetDate: "2026-09-01",
  progress: 0,
  milestones: [],
  status: "active",
  createdAt: "2026-08-23T00:00:00.000Z",
}

describe("goal milestones", () => {
  it("appends a milestone and keeps progress at zero until completed", () => {
    const next = addMilestone(goal, "  Write tests  ", "2026-08-24", 11)
    expect(next.milestones).toEqual([
      { id: 11, title: "Write tests", completed: false, dueDate: "2026-08-24" },
    ])
    expect(next.progress).toBe(0)
  })

  it("rejects a blank title", () => {
    expect(() => addMilestone(goal, "   ", "2026-08-24", 12)).toThrow(/title/)
  })
})
