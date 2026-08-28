import { describe, expect, it } from "vitest"
import { parseWorkspaceSearch, serializeWorkspaceSearch, workspaceViewTitle } from "./workspace-url"

describe("workspace URL state", () => {
  it("reads view and query from the search string", () => {
    expect(parseWorkspaceSearch("?view=tasks&q=rent")).toEqual({
      view: "tasks",
      q: "rent",
      filter: "all",
      session: "",
    })
    expect(parseWorkspaceSearch("?view=tasks&filter=overdue")).toEqual({
      view: "tasks",
      q: "",
      filter: "overdue",
      session: "",
    })
    expect(parseWorkspaceSearch("")).toEqual({ view: "overview", q: "", filter: "all", session: "" })
    expect(parseWorkspaceSearch("?view=nope")).toEqual({ view: "overview", q: "", filter: "all", session: "" })
  })

  it("reads the chats tab and an optional session id", () => {
    expect(parseWorkspaceSearch("?view=chats")).toEqual({ view: "chats", q: "", filter: "all", session: "" })
    expect(parseWorkspaceSearch("?view=chats&session=demo-local&q=vps")).toEqual({
      view: "chats",
      q: "vps",
      filter: "all",
      session: "demo-local",
    })
  })

  it("omits default overview, empty query, and the all filter", () => {
    expect(serializeWorkspaceSearch("overview", "")).toBe("")
    expect(serializeWorkspaceSearch("habits", " walk ")).toBe("?view=habits&q=walk")
    expect(serializeWorkspaceSearch("tasks", "", "overdue")).toBe("?view=tasks&filter=overdue")
    expect(serializeWorkspaceSearch("chats", "", "all", "demo-local")).toBe("?view=chats&session=demo-local")
  })

  it("names each workspace tab for the editorial heading", () => {
    expect(workspaceViewTitle("overview")).toBe("Home")
    expect(workspaceViewTitle("tasks")).toBe("Tasks")
    expect(workspaceViewTitle("notes")).toBe("Notes")
    expect(workspaceViewTitle("chats")).toBe("Chats")
    expect(workspaceViewTitle("habits")).toBe("Habits")
  })
})
