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
    case "overview":
    case "tasks":
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
    case "overview":
    case "notes":
    case "habits":
      return false
    case "tasks":
      return true
    default: {
      const _exhaustive: never = view
      return _exhaustive
    }
  }
}

export function showWorkspaceExport(view: WorkspaceView): boolean {
  switch (view) {
    case "overview":
    case "chats":
      return false
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

export function showComposerDock(view: WorkspaceView): boolean {
  switch (view) {
    case "overview":
    case "tasks":
    case "notes":
    case "habits":
      return false
    case "chats":
      return true
    default: {
      const _exhaustive: never = view
      return _exhaustive
    }
  }
}

export function showViewSupport(view: WorkspaceView): boolean {
  switch (view) {
    case "overview":
    case "tasks":
    case "notes":
    case "habits":
    case "chats":
      return false
    default: {
      const _exhaustive: never = view
      return _exhaustive
    }
  }
}

export function workspaceSearchPlaceholder(view: WorkspaceView): string {
  switch (view) {
    case "tasks":
      return "Search tasks"
    case "notes":
      return "Search notes"
    case "habits":
      return "Search habits"
    case "overview":
    case "chats":
      return "Search tasks, notes, habits, and chats..."
    default: {
      const _exhaustive: never = view
      return _exhaustive
    }
  }
}

export function showToolLauncher(view: WorkspaceView, width: number): boolean {
  void width
  switch (view) {
    case "overview":
    case "tasks":
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
