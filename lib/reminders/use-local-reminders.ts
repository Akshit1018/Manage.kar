"use client"

import { useEffect } from "react"
import type { Workspace } from "@/lib/domain/types"
import { dueReminders } from "@/lib/reminders/due"

export function useLocalReminders(
  workspace: Workspace,
  persist: (mutator: (current: Workspace) => Workspace) => Workspace,
  hydrated: boolean,
) {
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") {
      return
    }
    if (!workspace.settings.notifications.enabled || Notification.permission !== "granted") {
      return
    }

    const due = dueReminders(workspace)
    if (due.length === 0) {
      return
    }

    for (const item of due) {
      new Notification(item.kind === "task" ? "Task due" : "Habit reminder", {
        body: item.title,
      })
    }

    persist((current) => ({
      ...current,
      firedReminderKeys: [...current.firedReminderKeys, ...due.map((item) => item.key)],
    }))
  }, [hydrated, persist, workspace])
}
