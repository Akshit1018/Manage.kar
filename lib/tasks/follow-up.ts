import type { FollowUpCadence, Task } from "@/lib/domain/types"
import { localDateKey } from "@/lib/dates/due-date"

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export function isFollowUpCadence(value: unknown): value is FollowUpCadence {
  return value === "daily" || value === "weekly"
}

function parseStamp(value: string | undefined): Date | null {
  if (!value) {
    return null
  }
  const ms = Date.parse(value)
  return Number.isNaN(ms) ? null : new Date(ms)
}

/**
 * Local follow-up nudges. These only appear while the app is open —
 * they are not push notifications.
 */
export function isFollowUpDue(task: Task, now = new Date()): boolean {
  if (!task.followUp || task.completed) {
    return false
  }
  const last = parseStamp(task.followUp.lastNudgedAt)
  if (!last) {
    return true
  }
  switch (task.followUp.cadence) {
    case "daily":
      return localDateKey(last) < localDateKey(now)
    case "weekly":
      return now.getTime() - last.getTime() >= WEEK_MS
    default: {
      const exhaustive: never = task.followUp.cadence
      return exhaustive
    }
  }
}

export function dueFollowUps(tasks: Task[], now = new Date()): Task[] {
  return tasks.filter((task) => isFollowUpDue(task, now))
}

export function nudgeFollowUp(task: Task, now = new Date()): Task {
  if (!task.followUp) {
    return task
  }
  return { ...task, followUp: { ...task.followUp, lastNudgedAt: now.toISOString() } }
}

export function followUpCopy(cadence: FollowUpCadence): string {
  switch (cadence) {
    case "daily":
      return "Follows up daily until done"
    case "weekly":
      return "Follows up weekly until done"
    default: {
      const exhaustive: never = cadence
      return exhaustive
    }
  }
}
