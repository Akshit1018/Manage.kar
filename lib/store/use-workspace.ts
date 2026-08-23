"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { Workspace } from "@/lib/domain/types"
import { toast } from "sonner"
import { applyAppearance } from "@/lib/theme/apply-theme"
import { mergeWorkspaces, sameWorkspaceEntities } from "@/lib/store/merge"
import { estimateWorkspaceBytes, shouldWarnQuota } from "@/lib/store/quota"
import { createIndexedDbVoiceStore, migrateVoiceDataUrls } from "@/lib/media/voice-store"
import { buildReminderSnapshot, readReminderSnapshot, writeReminderSnapshot } from "@/lib/reminders/snapshot"
import {
  WORKSPACE_CHANGED_EVENT,
  WORKSPACE_KEY,
  WorkspaceSaveError,
  browserStorage,
  createEmptyWorkspace,
  emptyDropped,
  inspectWorkspace,
  loadWorkspace,
  migrateLegacyWorkspace,
  mutateWorkspace,
  resetCorruptWorkspace,
  saveWorkspace,
  type DroppedCounts,
  type WorkspaceInspection,
} from "@/lib/store/workspace"

function publishReminderSnapshot(workspace: Workspace) {
  void writeReminderSnapshot(buildReminderSnapshot(workspace)).then(() => {
    navigator.serviceWorker?.controller?.postMessage({ type: "check-reminders" })
  })
}

function applyMigratedNotes(
  currentNotes: Workspace["notes"],
  migrated: Workspace["notes"],
): Workspace["notes"] {
  const byId = new Map(migrated.map((note) => [note.id, note]))
  return currentNotes.map((note) => byId.get(note.id) ?? note)
}

export function useWorkspace() {
  const [workspace, setWorkspace] = useState<Workspace>(() => createEmptyWorkspace())
  const [hydrated, setHydrated] = useState(false)
  const [loadStatus, setLoadStatus] = useState<WorkspaceInspection["status"]>("empty")
  const [quarantineKey, setQuarantineKey] = useState<string | undefined>()
  const [dropped, setDropped] = useState<DroppedCounts>(emptyDropped)
  const workspaceRef = useRef(workspace)
  const quotaWarnedRef = useRef(false)

  useEffect(() => {
    workspaceRef.current = workspace
  }, [workspace])

  const applyLoaded = useCallback((inspected: WorkspaceInspection) => {
    setWorkspace(inspected.workspace)
    setLoadStatus(inspected.status)
    setQuarantineKey(inspected.quarantineKey)
    setDropped(inspected.dropped)
    applyAppearance(inspected.workspace.settings)
    setHydrated(true)
    publishReminderSnapshot(inspected.workspace)
  }, [])

  const reload = useCallback(() => {
    const storage = browserStorage()
    migrateLegacyWorkspace(storage)
    applyLoaded(inspectWorkspace(storage))
  }, [applyLoaded])

  const persist = useCallback((mutator: (current: Workspace) => Workspace) => {
    const storage = browserStorage()
    try {
      const next = mutateWorkspace(storage, mutator)
      setWorkspace(next)
      applyAppearance(next.settings)
      if (shouldWarnQuota(estimateWorkspaceBytes(next)) && !quotaWarnedRef.current) {
        quotaWarnedRef.current = true
        toast.warning("This workspace is getting large. Export a backup. New voice audio is stored outside this file.")
      }
      publishReminderSnapshot(next)
      return next
    } catch (error) {
      if (error instanceof WorkspaceSaveError) {
        toast.error("Could not save on this device. Export a backup if you can.")
        return loadWorkspace(storage)
      }
      throw error
    }
  }, [])

  useEffect(() => {
    reload()
    const onStorage = (event: StorageEvent) => {
      if (event.key !== WORKSPACE_KEY && event.key !== null) {
        return
      }
      const incoming = inspectWorkspace(browserStorage())
      const merged = mergeWorkspaces(workspaceRef.current, incoming.workspace)
      if (!sameWorkspaceEntities(merged, incoming.workspace)) {
        try {
          const saved = saveWorkspace(browserStorage(), merged)
          setWorkspace(saved)
          applyAppearance(saved.settings)
          publishReminderSnapshot(saved)
        } catch {
          setWorkspace(merged)
        }
        toast("Merged another tab's changes.")
        return
      }
      applyLoaded(incoming)
      toast("Another tab updated this workspace. Showing the latest copy.")
    }
    window.addEventListener(WORKSPACE_CHANGED_EVENT, reload)
    window.addEventListener("storage", onStorage)
    return () => {
      window.removeEventListener(WORKSPACE_CHANGED_EVENT, reload)
      window.removeEventListener("storage", onStorage)
    }
  }, [applyLoaded, reload])

  useEffect(() => {
    if (!hydrated) {
      return
    }
    let cancelled = false
    const notesAtHydrate = workspaceRef.current.notes
    const firedAtHydrate = workspaceRef.current.firedReminderKeys
    void migrateVoiceDataUrls(notesAtHydrate, createIndexedDbVoiceStore())
      .then((notes) => {
        if (cancelled) {
          return
        }
        const changed = notes.some(
          (note, index) => note.voiceNote?.audioUrl !== notesAtHydrate[index]?.voiceNote?.audioUrl,
        )
        if (!changed) {
          return
        }
        persist((current) => ({ ...current, notes: applyMigratedNotes(current.notes, notes) }))
      })
      .catch(() => {
        // Voice migration is best-effort. Legacy data URLs still play.
      })

    void readReminderSnapshot().then((snapshot) => {
      if (cancelled || !snapshot) {
        return
      }
      const extra = snapshot.firedReminderKeys.filter((key) => !firedAtHydrate.includes(key))
      if (extra.length === 0) {
        return
      }
      persist((current) => ({
        ...current,
        firedReminderKeys: [...new Set([...current.firedReminderKeys, ...snapshot.firedReminderKeys])],
      }))
    })

    return () => {
      cancelled = true
    }
  }, [hydrated, persist])

  const resetCorrupt = useCallback(() => {
    const next = resetCorruptWorkspace(browserStorage())
    setWorkspace(next)
    setLoadStatus("ok")
    setQuarantineKey(undefined)
    applyAppearance(next.settings)
    return next
  }, [])

  return {
    workspace,
    hydrated,
    persist,
    reload,
    resetCorrupt,
    loadStatus,
    quarantineKey,
    dropped,
  }
}
