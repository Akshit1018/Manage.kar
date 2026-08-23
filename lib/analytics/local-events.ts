export const ANALYTICS_KEY = "managekar.events.v1"
export const MAX_LOCAL_EVENTS = 200

export interface KeyValueStore {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export type LocalEventName =
  | "export"
  | "import"
  | "share_link"
  | "task_created"
  | "task_deleted"
  | "workspace_cleared"
  | "error"

export interface LocalEvent {
  id: string
  name: LocalEventName
  at: string
  props?: Record<string, string | number | boolean>
}

function parseEvents(raw: string | null): LocalEvent[] {
  if (!raw) {
    return []
  }
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed.filter((item): item is LocalEvent => {
      return Boolean(item && typeof item === "object" && typeof item.id === "string" && typeof item.name === "string")
    })
  } catch {
    return []
  }
}

export function listEvents(storage: KeyValueStore): LocalEvent[] {
  return parseEvents(storage.getItem(ANALYTICS_KEY))
}

export function recordEvent(
  storage: KeyValueStore,
  name: LocalEventName,
  props?: Record<string, string | number | boolean>,
): LocalEvent {
  const event: LocalEvent = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    at: new Date().toISOString(),
    props,
  }
  const next = [...listEvents(storage), event].slice(-MAX_LOCAL_EVENTS)
  storage.setItem(ANALYTICS_KEY, JSON.stringify(next))
  return event
}

export function clearEvents(storage: KeyValueStore): void {
  storage.removeItem(ANALYTICS_KEY)
}

export function browserEventStorage(): KeyValueStore | null {
  if (typeof window === "undefined") {
    return null
  }
  return window.localStorage
}

export function recordBrowserEvent(
  name: LocalEventName,
  props?: Record<string, string | number | boolean>,
): void {
  const storage = browserEventStorage()
  if (!storage) {
    return
  }
  recordEvent(storage, name, props)
}
