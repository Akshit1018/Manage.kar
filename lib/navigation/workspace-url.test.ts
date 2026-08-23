import { describe, expect, it } from "vitest"
import { parseWorkspaceSearch, serializeWorkspaceSearch } from "./workspace-url"

describe("workspace URL state", () => {
  it("reads view and query from the search string", () => {
    expect(parseWorkspaceSearch("?view=tasks&q=rent")).toEqual({ view: "tasks", q: "rent", filter: "all" })
    expect(parseWorkspaceSearch("?view=tasks&filter=overdue")).toEqual({
      view: "tasks",
      q: "",
      filter: "overdue",
    })
    expect(parseWorkspaceSearch("")).toEqual({ view: "overview", q: "", filter: "all" })
    expect(parseWorkspaceSearch("?view=nope")).toEqual({ view: "overview", q: "", filter: "all" })
  })

  it("omits default overview, empty query, and the all filter", () => {
    expect(serializeWorkspaceSearch("overview", "")).toBe("")
    expect(serializeWorkspaceSearch("habits", " walk ")).toBe("?view=habits&q=walk")
    expect(serializeWorkspaceSearch("tasks", "", "overdue")).toBe("?view=tasks&filter=overdue")
  })
})
