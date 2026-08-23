import type { Habit, Task, Workspace } from "@/lib/domain/types"
import { createEmptyWorkspace } from "@/lib/store/workspace"
import { dueReminders, type DueReminder } from "@/lib/reminders/due"

export const REMINDER_CACHE_NAME = "managekar-reminders-v1"
export const REMINDER_SNAPSHOT_PATH = "/__managekar/reminders.json"

export interface ReminderSnapshot {
  writtenAt: string
  settings: Workspace["settings"]
  firedReminderKeys: string[]
  tasks: Task[]
  habits: Habit[]
}

export function buildReminderSnapshot(workspace: Workspace): ReminderSnapshot {
  return {
    writtenAt: new Date().toISOString(),
    settings: workspace.settings,
    firedReminderKeys: workspace.firedReminderKeys,
    tasks: workspace.tasks,
    habits: workspace.habits,
  }
}

export function dueFromSnapshot(snapshot: ReminderSnapshot, now = new Date()): DueReminder[] {
  const workspace = createEmptyWorkspace()
  workspace.settings = snapshot.settings
  workspace.firedReminderKeys = snapshot.firedReminderKeys
  workspace.tasks = snapshot.tasks
  workspace.habits = snapshot.habits
  return dueReminders(workspace, now)
}

export async function writeReminderSnapshot(snapshot: ReminderSnapshot): Promise<void> {
  if (typeof caches === "undefined") {
    return
  }
  const cache = await caches.open(REMINDER_CACHE_NAME)
  await cache.put(
    REMINDER_SNAPSHOT_PATH,
    new Response(JSON.stringify(snapshot), {
      headers: { "content-type": "application/json" },
    }),
  )
}

export async function readReminderSnapshot(): Promise<ReminderSnapshot | null> {
  if (typeof caches === "undefined") {
    return null
  }
  const cache = await caches.open(REMINDER_CACHE_NAME)
  const response = await cache.match(REMINDER_SNAPSHOT_PATH)
  if (!response) {
    return null
  }
  try {
    return (await response.json()) as ReminderSnapshot
  } catch {
    return null
  }
}
