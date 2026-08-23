import { z } from "zod"
import type { AppSettings, Habit, Note, Task, UserProfile, Workspace } from "@/lib/domain/types"

export const WORKSPACE_KEY = "managekar.workspace.v1"
export const WORKSPACE_CHANGED_EVENT = "managekar:workspace-changed"

export interface KeyValueStore {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

const taskSchema = z
  .object({
    id: z.number(),
    title: z.string(),
    completed: z.boolean(),
    priority: z.enum(["high", "medium", "low"]),
    dueDate: z.string(),
    description: z.string().optional(),
    recurring: z.enum(["none", "daily", "weekly", "monthly"]).optional(),
    reminders: z.boolean().optional(),
    checklist: z
      .array(
        z.object({
          id: z.number(),
          text: z.string(),
          completed: z.boolean(),
        }),
      )
      .optional(),
  })
  .passthrough()

const noteSchema = z
  .object({
    id: z.number(),
    title: z.string(),
    content: z.string(),
    createdAt: z.string(),
  })
  .passthrough()

const habitSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    category: z.enum(["health", "productivity", "learning", "lifestyle", "fitness", "mindfulness"]),
    frequency: z.enum(["daily", "weekly", "custom"]),
    streak: z.number(),
    completed: z.boolean(),
    completedToday: z.boolean(),
    reminders: z.boolean(),
    createdAt: z.string(),
    history: z.array(
      z.object({
        date: z.string(),
        completed: z.boolean(),
        value: z.number().optional(),
      }),
    ),
  })
  .passthrough()

const profileSchema = z
  .object({
    name: z.string(),
    email: z.string().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    bio: z.string().optional(),
    avatar: z.string().optional(),
    joinDate: z.string().optional(),
  })
  .passthrough()

export function defaultSettings(): AppSettings {
  return {
    notifications: {
      enabled: false,
      taskReminders: false,
      habitReminders: false,
      focusBreaks: true,
      dailySummary: false,
      soundEnabled: false,
      volume: 70,
    },
    appearance: {
      theme: "system",
      accentColor: "blue",
      fontSize: "medium",
      animations: true,
    },
    privacy: {
      dataCollection: false,
      crashReports: false,
      analytics: false,
      locationAccess: false,
      clipboardMonitor: false,
    },
    data: {
      autoBackup: false,
      backupFrequency: "weekly",
    },
    general: {
      language: "English",
      timezone: "UTC",
      weekStartsOn: "monday",
      dateFormat: "YYYY-MM-DD",
    },
  }
}

export function defaultProfile(): UserProfile {
  return {
    name: "User",
    email: "",
    phone: "",
    location: "",
    bio: "",
    avatar: "",
    joinDate: new Date().toISOString().slice(0, 10),
  }
}

export function createEmptyWorkspace(): Workspace {
  return {
    schemaVersion: 1,
    updatedAt: new Date(0).toISOString(),
    tasks: [],
    notes: [],
    habits: [],
    settings: defaultSettings(),
    profile: defaultProfile(),
  }
}

export function nextNumericId(items: Array<{ id: number }>): number {
  if (items.length === 0) {
    return 1
  }
  return Math.max(...items.map((item) => item.id)) + 1
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function parseJson(value: string | null): unknown {
  if (!value) {
    return null
  }
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function asTaskArray(value: unknown): Task[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value.flatMap((item) => {
    const parsed = taskSchema.safeParse(item)
    return parsed.success ? [parsed.data as Task] : []
  })
}

function asNoteArray(value: unknown): Note[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value.flatMap((item) => {
    const parsed = noteSchema.safeParse(item)
    return parsed.success ? [parsed.data as Note] : []
  })
}

function asHabitArray(value: unknown): Habit[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value.flatMap((item) => {
    const parsed = habitSchema.safeParse(item)
    return parsed.success ? [parsed.data as Habit] : []
  })
}

function mergeProfile(value: unknown): UserProfile {
  const base = defaultProfile()
  if (!isRecord(value)) {
    return base
  }
  const parsed = profileSchema.safeParse(value)
  if (!parsed.success) {
    return base
  }
  return {
    ...base,
    ...parsed.data,
    name: parsed.data.name || base.name,
    email: parsed.data.email ?? base.email,
    phone: parsed.data.phone ?? base.phone,
    location: parsed.data.location ?? base.location,
    bio: parsed.data.bio ?? base.bio,
    avatar: parsed.data.avatar ?? base.avatar,
    joinDate: parsed.data.joinDate ?? base.joinDate,
  }
}

function mergeSettings(value: unknown): AppSettings {
  const base = defaultSettings()
  if (!isRecord(value)) {
    return base
  }
  const appearance = isRecord(value.appearance) ? value.appearance : {}
  const privacy = isRecord(value.privacy) ? value.privacy : {}
  const notifications = isRecord(value.notifications) ? value.notifications : {}
  const data = isRecord(value.data) ? value.data : {}
  const general = isRecord(value.general) ? value.general : {}

  return {
    notifications: { ...base.notifications, ...notifications },
    appearance: {
      ...base.appearance,
      ...appearance,
      theme:
        appearance.theme === "light" || appearance.theme === "dark" || appearance.theme === "system"
          ? appearance.theme
          : base.appearance.theme,
    },
    privacy: {
      ...base.privacy,
      ...privacy,
      clipboardMonitor: Boolean(privacy.clipboardMonitor ?? base.privacy.clipboardMonitor),
    },
    data: {
      autoBackup: Boolean(data.autoBackup ?? base.data.autoBackup),
      backupFrequency:
        data.backupFrequency === "daily" || data.backupFrequency === "weekly" || data.backupFrequency === "monthly"
          ? data.backupFrequency
          : base.data.backupFrequency,
    },
    general: { ...base.general, ...general },
  }
}

function normalizeWorkspace(value: unknown): Workspace | null {
  if (!isRecord(value)) {
    return null
  }

  const tasks = asTaskArray(value.tasks)
  const notes = asNoteArray(value.notes)
  const habits = asHabitArray(value.habits)

  return {
    schemaVersion: 1,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : new Date().toISOString(),
    tasks,
    notes,
    habits,
    settings: mergeSettings(value.settings),
    profile: mergeProfile(value.profile),
  }
}

export function loadWorkspace(storage: KeyValueStore): Workspace {
  const parsed = parseJson(storage.getItem(WORKSPACE_KEY))
  return normalizeWorkspace(parsed) ?? createEmptyWorkspace()
}

export function saveWorkspace(storage: KeyValueStore, workspace: Workspace): Workspace {
  const next: Workspace = {
    ...workspace,
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
  }
  storage.setItem(WORKSPACE_KEY, JSON.stringify(next))
  return next
}

export function migrateLegacyWorkspace(storage: KeyValueStore): Workspace {
  const existing = parseJson(storage.getItem(WORKSPACE_KEY))
  if (existing && isRecord(existing) && existing.schemaVersion === 1) {
    return loadWorkspace(storage)
  }

  const workspace = createEmptyWorkspace()
  workspace.tasks = asTaskArray(parseJson(storage.getItem("manageKarTasks")))
  workspace.notes = asNoteArray(parseJson(storage.getItem("manageKarNotes")))
  workspace.habits = asHabitArray(parseJson(storage.getItem("manageKarHabits")))
  workspace.settings = mergeSettings(parseJson(storage.getItem("manageKarAppSettings")))
  workspace.profile = mergeProfile(parseJson(storage.getItem("manageKarUserProfile")))

  return saveWorkspace(storage, workspace)
}

export function serializeBackup(workspace: Workspace): string {
  return JSON.stringify(
    {
      appName: "Manage.kar",
      appVersion: "2.0.0",
      exportDate: new Date().toISOString(),
      ...workspace,
      schemaVersion: 1,
    },
    null,
    2,
  )
}

export function parseBackup(raw: string): { ok: true; workspace: Workspace } | { ok: false; error: string } {
  const parsed = parseJson(raw)
  const workspace = normalizeWorkspace(parsed)
  if (!workspace) {
    return { ok: false, error: "Invalid Manage.kar backup file." }
  }
  if (
    workspace.tasks.length === 0 &&
    workspace.notes.length === 0 &&
    workspace.habits.length === 0 &&
    !isRecord(parsed) 
  ) {
    return { ok: false, error: "Invalid Manage.kar backup file." }
  }
  if (!isRecord(parsed)) {
    return { ok: false, error: "Invalid Manage.kar backup file." }
  }
  return { ok: true, workspace }
}

export function replaceWorkspace(storage: KeyValueStore, workspace: Workspace): Workspace {
  return saveWorkspace(storage, workspace)
}

export function clearWorkspace(storage: KeyValueStore): Workspace {
  const empty = createEmptyWorkspace()
  storage.removeItem("manageKarTasks")
  storage.removeItem("manageKarNotes")
  storage.removeItem("manageKarHabits")
  storage.removeItem("manageKarAppSettings")
  storage.removeItem("manageKarUserProfile")
  storage.removeItem("manageKarTheme")
  storage.removeItem("importedTasks")
  return saveWorkspace(storage, empty)
}

export function browserStorage(): KeyValueStore {
  return window.localStorage
}

export function notifyWorkspaceChanged(): void {
  if (typeof window === "undefined") {
    return
  }
  window.dispatchEvent(new Event(WORKSPACE_CHANGED_EVENT))
}
