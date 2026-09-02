import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"
import {
  DESKTOP_SIDEBAR_MIN_WIDTH,
  homeGreeting,
  overviewUsesHomeFeed,
  showComposerDock,
  showDesktopSidebar,
  showGlobalCreateRow,
  showMobileTabBar,
  showToolLauncher,
  showViewSupport,
  showWorkspaceExport,
  showWorkspaceSearch,
  workspaceSearchPlaceholder,
  workspaceNavItems,
} from "./home-chrome"

describe("home chrome", () => {
  it("hides global create on chats, notes, habits, and Tasks", () => {
    expect(showGlobalCreateRow("overview")).toBe(false)
    expect(showGlobalCreateRow("tasks")).toBe(false)
    expect(showGlobalCreateRow("chats")).toBe(false)
    expect(showGlobalCreateRow("notes")).toBe(false)
    expect(showGlobalCreateRow("habits")).toBe(false)
  })

  it("drops the permanent search field on chats and Home", () => {
    expect(showWorkspaceSearch("chats")).toBe(false)
    expect(showWorkspaceSearch("overview")).toBe(false)
    expect(showWorkspaceSearch("notes")).toBe(false)
    expect(showWorkspaceSearch("habits")).toBe(false)
    expect(showWorkspaceSearch("tasks")).toBe(true)
    expect(workspaceSearchPlaceholder("tasks")).toBe("Search tasks")
    expect(workspaceSearchPlaceholder("habits")).toBe("Search habits")
  })

  it("hides Export and the composer dock on Home, and the composer on Tasks, Notes, and Habits", () => {
    expect(showWorkspaceExport("overview")).toBe(false)
    expect(showWorkspaceExport("tasks")).toBe(true)
    expect(showWorkspaceExport("notes")).toBe(true)
    expect(showWorkspaceExport("habits")).toBe(true)
    expect(showWorkspaceExport("chats")).toBe(true)
    expect(showComposerDock("overview")).toBe(false)
    expect(showComposerDock("chats")).toBe(true)
    expect(showComposerDock("tasks")).toBe(false)
    expect(showComposerDock("notes")).toBe(false)
    expect(showComposerDock("habits")).toBe(false)
    expect(showViewSupport("tasks")).toBe(false)
    expect(showViewSupport("notes")).toBe(false)
    expect(showViewSupport("habits")).toBe(false)
    expect(showViewSupport("chats")).toBe(true)
  })

  it("keeps the tool strip off Home so the feed can breathe", () => {
    expect(showToolLauncher("overview", 320)).toBe(false)
    expect(showToolLauncher("overview", 640)).toBe(false)
    expect(showToolLauncher("overview", 1280)).toBe(false)
    expect(showToolLauncher("chats", 1280)).toBe(false)
  })

  it("shows a five-item desktop sidebar without replacing the phone tab bar", () => {
    expect(DESKTOP_SIDEBAR_MIN_WIDTH).toBe(1024)
    expect(showDesktopSidebar(320)).toBe(false)
    expect(showDesktopSidebar(1023)).toBe(false)
    expect(showDesktopSidebar(1024)).toBe(true)
    expect(showMobileTabBar(320)).toBe(true)
    expect(showMobileTabBar(1024)).toBe(false)
    expect(workspaceNavItems()).toEqual([
      ["overview", "Home"],
      ["tasks", "Tasks"],
      ["notes", "Notes"],
      ["chats", "Chats"],
      ["habits", "Habits"],
    ])
    expect(workspaceNavItems().some(([, label]) => /plugin/i.test(label))).toBe(false)
  })

  it("greets unnamed profiles as Today, not Your workspace", () => {
    expect(homeGreeting("")).toBe("Today")
    expect(homeGreeting("User")).toBe("Today")
    expect(homeGreeting("  User  ")).toBe("Today")
    expect(homeGreeting("Ada")).toBe("Hello, Ada")
  })

  it("renders the home feed instead of Today and count tiles", () => {
    const source = readFileSync(resolve(process.cwd(), "components/workspace/dashboard.tsx"), "utf8")
    expect(overviewUsesHomeFeed(source)).toBe(true)
    expect(source).toContain("setMoreToolsOpen(true)")
    expect(source).toContain("moreToolsOpen")
    expect(source).toContain("homeGreeting")
    expect(source).toContain("agentDayBriefing")
    expect(source).toContain("mk-home-briefing")
    expect(source).toContain("showWorkspaceExport")
    expect(source).toContain("showComposerDock")
    expect(source).toContain("<PairingSheet")
    expect(source).toContain('className="sr-only"')
    expect(source).toContain("workspaceViewTitle")
    expect(source.includes("mk-workspace-heading")).toBe(false)
    expect(source.includes("currentView === \"overview\" ? greeting")).toBe(false)
    expect(source.includes('greeting = "Your workspace"')).toBe(false)
  })
})
