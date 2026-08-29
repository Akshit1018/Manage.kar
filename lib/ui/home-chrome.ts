import type { WorkspaceView } from "@/lib/navigation/workspace-url"

export const TOOL_LAUNCHER_MIN_WIDTH = 640
export const DESKTOP_SIDEBAR_MIN_WIDTH = 1024

export function showDesktopSidebar(width: number): boolean {
  return width >= DESKTOP_SIDEBAR_MIN_WIDTH
}

export function showMobileTabBar(width: number): boolean {
  return !showDesktopSidebar(width)
}

export function workspaceNavItems(): ReadonlyArray<readonly [WorkspaceView, string]> {
  return [
    ["overview", "Home"],
    ["tasks", "Tasks"],
    ["notes", "Notes"],
    ["chats", "Chats"],
    ["habits", "Habits"],
  ]
}

export function showGlobalCreateRow(view: WorkspaceView): boolean {
  switch (view) {
    case "tasks":
      return true
    case "overview":
    case "notes":
    case "chats":
    case "habits":
      return false
    default: {
      const _exhaustive: never = view
      return _exhaustive
    }
  }
}

export function showWorkspaceSearch(view: WorkspaceView): boolean {
  switch (view) {
    case "chats":
      return false
    case "overview":
    case "tasks":
    case "notes":
    case "habits":
      return true
    default: {
      const _exhaustive: never = view
      return _exhaustive
    }
  }
}

export function showToolLauncher(view: WorkspaceView, width: number): boolean {
  return view === "overview" && width >= TOOL_LAUNCHER_MIN_WIDTH
}

export function homeGreeting(profileName: string): string {
  const name = profileName.trim()
  if (name && name !== "User") {
    return `Hello, ${name}`
  }
  return "Today"
}

export function overviewUsesHomeFeed(source: string): boolean {
  return source.includes("<HomeFeed") && !source.includes("<TodaySection")
}
