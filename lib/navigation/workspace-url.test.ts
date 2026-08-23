import { describe, expect, it } from "vitest"
import { parseWorkspaceSearch, serializeWorkspaceSearch } from "./workspace-url"

describe("workspace URL state", () => {
  it("reads view and query from the search string", () => {
    expect(parseWorkspaceSearch("?view=tasks&q=rent")).toEqual({ view: "tasks", q: "rent" })
    expect(parseWorkspaceSearch("")).toEqual({ view: "overview", q: "" })
    expect(parseWorkspaceSearch("?view=nope")).toEqual({ view: "overview", q: "" })
  })

  it("omits default overview and empty query", () => {
    expect(serializeWorkspaceSearch("overview", "")).toBe("")
    expect(serializeWorkspaceSearch("habits", " walk ")).toBe("?view=habits&q=walk")
  })
})
