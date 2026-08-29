import type { WorkspaceView } from "@/lib/navigation/workspace-url"

export const TOOL_LAUNCHER_MIN_WIDTH = 640

export function showGlobalCreateRow(view: WorkspaceView): boolean {
  switch (view) {
    case "overview":
    case "tasks":
      return true
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

export function overviewPlacesTodayBeforeCounts(source: string): boolean {
  const today = source.indexOf("<TodaySection")
  const featured = source.indexOf("mk-featured-surface")
  return today >= 0 && featured >= 0 && today < featured
}
