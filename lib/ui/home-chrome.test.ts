import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"
import {
  overviewPlacesTodayBeforeCounts,
  showGlobalCreateRow,
  showToolLauncher,
  showWorkspaceSearch,
} from "./home-chrome"

describe("home chrome", () => {
  it("hides global create on chats, notes, and habits", () => {
    expect(showGlobalCreateRow("overview")).toBe(true)
    expect(showGlobalCreateRow("tasks")).toBe(true)
    expect(showGlobalCreateRow("chats")).toBe(false)
    expect(showGlobalCreateRow("notes")).toBe(false)
    expect(showGlobalCreateRow("habits")).toBe(false)
  })

  it("drops the permanent search field on chats", () => {
    expect(showWorkspaceSearch("chats")).toBe(false)
    expect(showWorkspaceSearch("overview")).toBe(true)
  })

  it("hides the tool launcher below 640px", () => {
    expect(showToolLauncher("overview", 320)).toBe(false)
    expect(showToolLauncher("overview", 639)).toBe(false)
    expect(showToolLauncher("overview", 640)).toBe(true)
    expect(showToolLauncher("chats", 1280)).toBe(false)
  })

  it("places Today before count tiles in the dashboard source", () => {
    const source = readFileSync(resolve(process.cwd(), "components/workspace/dashboard.tsx"), "utf8")
    expect(overviewPlacesTodayBeforeCounts(source)).toBe(true)
    expect(source).toContain("setMoreToolsOpen(true)")
    expect(source).toContain("moreToolsOpen")
  })
})
