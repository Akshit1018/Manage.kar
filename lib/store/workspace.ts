import { z } from "zod"
import type {
  ActiveFocus,
  AppSettings,
  FocusSession,
  Goal,
  Habit,
  Note,
  Task,
  TimeEntry,
  UserProfile,
  Workspace,
} from "@/lib/domain/types"
import { localDateKey, normalizeDueDate } from "@/lib/dates/due-date"
import { hydrateHabit } from "@/lib/habits/streak"
import { sanitizeAvatarUrl } from "@/lib/profile/avatar"

export const WORKSPACE_KEY = "managekar.workspace.v1"
export const WORKSPACE_CHANGED_EVENT = "managekar:workspace-changed"
export const WORKSPACE_CORRUPT_PREFIX = "managekar.workspace.v1.corrupt."
export const WORKSPACE_DROPPED_KEY = "managekar.workspace.v1.dropped"
export const APP_VERSION = "0.2.0"

export interface KeyValueStore {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface DroppedCounts {
  tasks: number
  notes: number
  habits: number
  goals: number
  timeEntries: number
  focusSessions: number
}

export interface WorkspaceInspection {
  status: "ok" | "empty" | "corrupt"
  workspace: Workspace
  quarantineKey?: string
  dropped: DroppedCounts
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

const goalSchema = z
  .object({
    id: z.number(),
    title: z.string(),
    description: z.string(),
    category: z.enum(["personal", "work", "health", "learning", "financial"]),
    priority: z.enum(["high", "medium", "low"]),
    targetDate: z.string(),
    progress: z.number(),
    milestones: z.array(
      z.object({
        id: z.number(),
        title: z.string(),
        completed: z.boolean(),
        dueDate: z.string(),
      }),
    ),
    status: z.enum(["active", "completed", "paused"]),
    createdAt: z.string(),
  })
  .passthrough()

const timeEntrySchema = z
  .object({
    id: z.number(),
    taskName: z.string(),
    project: z.string(),
    startTime: z.string(),
    endTime: z.string().optional(),
    duration: z.number(),
    isRunning: z.boolean(),
  })
  .passthrough()

const focusSessionSchema = z
  .object({
    id: z.number(),
    type: z.enum(["pomodoro", "deep-work", "break", "custom"]),
    durationSeconds: z.number(),
    completed: z.boolean(),
    startTime: z.string(),
    endTime: z.string().optional(),
  })
  .passthrough()

const activeFocusSchema = z.object({
  sessionId: z.number(),
  type: z.enum(["pomodoro", "deep-work", "break", "custom"]),
  durationSeconds: z.number(),
  remainingSeconds: z.number(),
  isRunning: z.boolean(),
  startedAt: z.string(),
  accumulatedElapsed: z.number(),
})

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
    },
    appearance: {
      theme: "system",
      fontSize: "medium",
      animations: true,
    },
    privacy: {
      clipboardMonitor: false,
    },
    general: {
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

export function emptyDropped(): DroppedCounts {
  return {
    tasks: 0,
    notes: 0,
    habits: 0,
    goals: 0,
    timeEntries: 0,
    focusSessions: 0,
  }
}

export function createEmptyWorkspace(): Workspace {
  return {
    schemaVersion: 1,
    updatedAt: new Date(0).toISOString(),
    tasks: [],
    notes: [],
    habits: [],
    goals: [],
    timeEntries: [],
    focusSessions: [],
    activeFocus: null,
    importedShareHashes: [],
    firedReminderKeys: [],
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

function parseArray<T>(
  value: unknown,
  parseItem: (item: unknown) => T | null,
): { items: T[]; dropped: number; rejected: unknown[] } {
  if (!Array.isArray(value)) {
    return { items: [], dropped: 0, rejected: [] }
  }
  const items: T[] = []
  const rejected: unknown[] = []
  for (const item of value) {
    const parsed = parseItem(item)
    if (parsed) {
      items.push(parsed)
    } else {
      rejected.push(item)
    }
  }
  return { items, dropped: rejected.length, rejected }
}

function asTask(item: unknown): Task | null {
  const parsed = taskSchema.safeParse(item)
  if (!parsed.success) {
    return null
  }
  const task = parsed.data as Task
  return {
    ...task,
    title: task.title.trim(),
    dueDate: normalizeDueDate(task.dueDate),
  }
}

function asNote(item: unknown): Note | null {
  const parsed = noteSchema.safeParse(item)
  if (!parsed.success) {
    return null
  }
  const note = parsed.data as Note
  return { ...note, title: note.title.trim() }
}

function asHabit(item: unknown, today: string): Habit | null {
  const parsed = habitSchema.safeParse(item)
  if (!parsed.success) {
    return null
  }
  return hydrateHabit(parsed.data as Habit, today)
}

function asGoal(item: unknown): Goal | null {
  const parsed = goalSchema.safeParse(item)
  return parsed.success ? (parsed.data as Goal) : null
}

function asTimeEntry(item: unknown): TimeEntry | null {
  const parsed = timeEntrySchema.safeParse(item)
  if (!parsed.success) {
    return null
  }
  const entry = parsed.data as TimeEntry
  return {
    ...entry,
    startTime: typeof entry.startTime === "string" ? entry.startTime : new Date(entry.startTime).toISOString(),
  }
}

function asFocusSession(item: unknown): FocusSession | null {
  const parsed = focusSessionSchema.safeParse(item)
  if (!parsed.success) {
    return null
  }
  const session = parsed.data as FocusSession
  if (typeof (session as FocusSession & { duration?: number }).duration === "number" && !session.durationSeconds) {
    return {
      ...session,
      durationSeconds: (session as FocusSession & { duration: number }).duration,
    }
  }
  return session
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
    name: parsed.data.name?.trim() || base.name,
    email: parsed.data.email ?? base.email,
    phone: parsed.data.phone ?? base.phone,
    location: parsed.data.location ?? base.location,
    bio: parsed.data.bio ?? base.bio,
    avatar: sanitizeAvatarUrl(parsed.data.avatar ?? ""),
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
  const general = isRecord(value.general) ? value.general : {}

  return {
    notifications: {
      enabled: Boolean(notifications.enabled ?? base.notifications.enabled),
      taskReminders: Boolean(notifications.taskReminders ?? base.notifications.taskReminders),
      habitReminders: Boolean(notifications.habitReminders ?? base.notifications.habitReminders),
      focusBreaks: Boolean(notifications.focusBreaks ?? base.notifications.focusBreaks),
    },
    appearance: {
      theme:
        appearance.theme === "light" || appearance.theme === "dark" || appearance.theme === "system"
          ? appearance.theme
          : base.appearance.theme,
      fontSize:
        appearance.fontSize === "small" || appearance.fontSize === "medium" || appearance.fontSize === "large"
          ? appearance.fontSize
          : base.appearance.fontSize,
      animations: appearance.animations === undefined ? base.appearance.animations : Boolean(appearance.animations),
    },
    privacy: {
      clipboardMonitor: Boolean(privacy.clipboardMonitor ?? base.privacy.clipboardMonitor),
    },
    general: {
      weekStartsOn: general.weekStartsOn === "sunday" ? "sunday" : "monday",
      dateFormat:
        general.dateFormat === "MM/DD/YYYY" || general.dateFormat === "DD/MM/YYYY" || general.dateFormat === "YYYY-MM-DD"
          ? general.dateFormat
          : base.general.dateFormat,
    },
  }
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value.filter((item): item is string => typeof item === "string")
}

function mergeActiveFocus(value: unknown): ActiveFocus | null {
  const parsed = activeFocusSchema.safeParse(value)
  return parsed.success ? parsed.data : null
}

function normalizeWorkspaceDetailed(value: unknown): { workspace: Workspace | null; dropped: DroppedCounts; rejected: unknown[] } {
  if (!isRecord(value)) {
    return { workspace: null, dropped: emptyDropped(), rejected: [] }
  }

  const today = localDateKey()
  const tasks = parseArray(value.tasks, asTask)
  const notes = parseArray(value.notes, asNote)
  const habits = parseArray(value.habits, (item) => asHabit(item, today))
  const goals = parseArray(value.goals, asGoal)
  const timeEntries = parseArray(value.timeEntries, asTimeEntry)
  const focusSessions = parseArray(value.focusSessions, asFocusSession)
  const dropped = {
    tasks: tasks.dropped,
    notes: notes.dropped,
    habits: habits.dropped,
    goals: goals.dropped,
    timeEntries: timeEntries.dropped,
    focusSessions: focusSessions.dropped,
  }
  const rejected = [
    ...tasks.rejected,
    ...notes.rejected,
    ...habits.rejected,
    ...goals.rejected,
    ...timeEntries.rejected,
    ...focusSessions.rejected,
  ]

  return {
    workspace: {
      schemaVersion: 1,
      updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : new Date().toISOString(),
      tasks: tasks.items,
      notes: notes.items,
      habits: habits.items,
      goals: goals.items,
      timeEntries: timeEntries.items,
      focusSessions: focusSessions.items,
      activeFocus: mergeActiveFocus(value.activeFocus),
      importedShareHashes: asStringArray(value.importedShareHashes),
      firedReminderKeys: asStringArray(value.firedReminderKeys),
      settings: mergeSettings(value.settings),
      profile: mergeProfile(value.profile),
    },
    dropped,
    rejected,
  }
}

function quarantineCorrupt(storage: KeyValueStore, raw: string): string {
  const key = `${WORKSPACE_CORRUPT_PREFIX}${Date.now()}`
  storage.setItem(key, raw)
  storage.setItem(`${WORKSPACE_CORRUPT_PREFIX}latest`, key)
  return key
}

function persistDroppedRows(storage: KeyValueStore, rejected: unknown[]): void {
  if (rejected.length === 0) {
    return
  }
  storage.setItem(
    WORKSPACE_DROPPED_KEY,
    JSON.stringify({
      at: new Date().toISOString(),
      rows: rejected,
    }),
  )
}

function isCorruptRaw(raw: string | null): boolean {
  if (!raw) {
    return false
  }
  try {
    JSON.parse(raw)
    return false
  } catch {
    return true
  }
}

export function inspectWorkspace(storage: KeyValueStore): WorkspaceInspection {
  const raw = storage.getItem(WORKSPACE_KEY)
  if (!raw) {
    return { status: "empty", workspace: createEmptyWorkspace(), dropped: emptyDropped() }
  }

  if (isCorruptRaw(raw)) {
    const quarantineKey = quarantineCorrupt(storage, raw)
    return {
      status: "corrupt",
      workspace: createEmptyWorkspace(),
      quarantineKey,
      dropped: emptyDropped(),
    }
  }

  const normalized = normalizeWorkspaceDetailed(JSON.parse(raw))
  if (!normalized.workspace) {
    const quarantineKey = quarantineCorrupt(storage, raw)
    return {
      status: "corrupt",
      workspace: createEmptyWorkspace(),
      quarantineKey,
      dropped: emptyDropped(),
    }
  }

  persistDroppedRows(storage, normalized.rejected)
  return { status: "ok", workspace: normalized.workspace, dropped: normalized.dropped }
}

export function loadWorkspace(storage: KeyValueStore): Workspace {
  return inspectWorkspace(storage).workspace
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

export function mutateWorkspace(
  storage: KeyValueStore,
  mutator: (workspace: Workspace) => Workspace,
): Workspace {
  const raw = storage.getItem(WORKSPACE_KEY)
  if (isCorruptRaw(raw)) {
    inspectWorkspace(storage)
    return createEmptyWorkspace()
  }
  const current = loadWorkspace(storage)
  return saveWorkspace(storage, mutator(current))
}

export function resetCorruptWorkspace(storage: KeyValueStore): Workspace {
  return saveWorkspace(storage, createEmptyWorkspace())
}

export function migrateLegacyWorkspace(storage: KeyValueStore): Workspace {
  const existing = parseJson(storage.getItem(WORKSPACE_KEY))
  if (existing && isRecord(existing) && existing.schemaVersion === 1) {
    return loadWorkspace(storage)
  }

  const workspace = createEmptyWorkspace()
  workspace.tasks = parseArray(parseJson(storage.getItem("manageKarTasks")), asTask).items
  workspace.notes = parseArray(parseJson(storage.getItem("manageKarNotes")), asNote).items
  workspace.habits = parseArray(parseJson(storage.getItem("manageKarHabits")), (item) =>
    asHabit(item, localDateKey()),
  ).items
  workspace.settings = mergeSettings(parseJson(storage.getItem("manageKarAppSettings")))
  workspace.profile = mergeProfile(parseJson(storage.getItem("manageKarUserProfile")))

  return saveWorkspace(storage, workspace)
}

export function serializeBackup(workspace: Workspace): string {
  return JSON.stringify(
    {
      appName: "Manage.kar",
      appVersion: APP_VERSION,
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
  if (!isRecord(parsed)) {
    return { ok: false, error: "Invalid Manage.kar backup file." }
  }
  const isOfficial = parsed.schemaVersion === 1 || parsed.appName === "Manage.kar"
  if (!isOfficial) {
    return { ok: false, error: "This file is not a Manage.kar backup." }
  }
  const normalized = normalizeWorkspaceDetailed(parsed)
  if (!normalized.workspace) {
    return { ok: false, error: "Invalid Manage.kar backup file." }
  }
  return { ok: true, workspace: normalized.workspace }
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
  storage.removeItem("manageKarGoogleIntegration")
  storage.removeItem("manage-kar-permissions")
  storage.removeItem("importedTasks")
  storage.removeItem(WORKSPACE_DROPPED_KEY)
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
