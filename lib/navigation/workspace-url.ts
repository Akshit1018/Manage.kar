import { isTaskListFilter, type TaskListFilter } from "@/lib/tasks/filter"

export type WorkspaceView = "overview" | "tasks" | "notes" | "habits"

export function parseWorkspaceSearch(search: string): {
  view: WorkspaceView
  q: string
  filter: TaskListFilter
} {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search)
  const view = params.get("view")
  const q = params.get("q")?.trim() ?? ""
  const rawFilter = params.get("filter")
  const filter: TaskListFilter = isTaskListFilter(rawFilter) ? rawFilter : "all"
  if (view === "tasks" || view === "notes" || view === "habits" || view === "overview") {
    return { view, q, filter }
  }
  return { view: "overview", q, filter }
}

export function serializeWorkspaceSearch(
  view: WorkspaceView,
  q: string,
  filter: TaskListFilter = "all",
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
  const serialized = params.toString()
  return serialized ? `?${serialized}` : ""
}
