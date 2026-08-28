import { isTaskListFilter, type TaskListFilter } from "@/lib/tasks/filter"

export type WorkspaceView = "overview" | "tasks" | "notes" | "habits" | "chats"

const VIEWS: readonly WorkspaceView[] = ["overview", "tasks", "notes", "habits", "chats"]

function isWorkspaceView(value: string | null): value is WorkspaceView {
  return value !== null && (VIEWS as readonly string[]).includes(value)
}

export function parseWorkspaceSearch(search: string): {
  view: WorkspaceView
  q: string
  filter: TaskListFilter
  session: string
} {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search)
  const viewParam = params.get("view")
  const view = isWorkspaceView(viewParam) ? viewParam : "overview"
  const q = params.get("q")?.trim() ?? ""
  const rawFilter = params.get("filter")
  const filter: TaskListFilter = isTaskListFilter(rawFilter) ? rawFilter : "all"
  const session = params.get("session")?.trim() ?? ""
  return { view, q, filter, session }
}

export function workspaceViewTitle(view: WorkspaceView): string {
  switch (view) {
    case "overview":
      return "Home"
    case "tasks":
      return "Tasks"
    case "notes":
      return "Notes"
    case "chats":
      return "Chats"
    case "habits":
      return "Habits"
    default: {
      const _exhaustive: never = view
      throw new Error(`Unhandled workspace view: ${_exhaustive}`)
    }
  }
}

export function serializeWorkspaceSearch(
  view: WorkspaceView,
  q: string,
  filter: TaskListFilter = "all",
  session = "",
): string {
  const params = new URLSearchParams()
  if (view !== "overview") {
    params.set("view", view)
  }
  const trimmed = q.trim()
  if (trimmed) {
    params.set("q", trimmed)
  }
  if (filter !== "all") {
    params.set("filter", filter)
  }
  const trimmedSession = session.trim()
  if (view === "chats" && trimmedSession) {
    params.set("session", trimmedSession)
  }
  const serialized = params.toString()
  return serialized ? `?${serialized}` : ""
}
