export type WorkspaceView = "overview" | "tasks" | "notes" | "habits"

export function parseWorkspaceSearch(search: string): { view: WorkspaceView; q: string } {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search)
  const view = params.get("view")
  const q = params.get("q")?.trim() ?? ""
  if (view === "tasks" || view === "notes" || view === "habits" || view === "overview") {
    return { view, q }
  }
  return { view: "overview", q }
}

export function serializeWorkspaceSearch(view: WorkspaceView, q: string): string {
  const params = new URLSearchParams()
  if (view !== "overview") {
    params.set("view", view)
  }
  const trimmed = q.trim()
  if (trimmed) {
    params.set("q", trimmed)
  }
  const serialized = params.toString()
  return serialized ? `?${serialized}` : ""
}
