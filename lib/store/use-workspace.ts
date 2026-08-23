"use client"

import { useCallback, useEffect, useState } from "react"
import type { Workspace } from "@/lib/domain/types"
import { toast } from "sonner"
import { applyAppearance } from "@/lib/theme/apply-theme"
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
  type DroppedCounts,
  type WorkspaceInspection,
} from "@/lib/store/workspace"

export function useWorkspace() {
  const [workspace, setWorkspace] = useState<Workspace>(() => createEmptyWorkspace())
  const [hydrated, setHydrated] = useState(false)
  const [loadStatus, setLoadStatus] = useState<WorkspaceInspection["status"]>("empty")
  const [quarantineKey, setQuarantineKey] = useState<string | undefined>()
  const [dropped, setDropped] = useState<DroppedCounts>(emptyDropped)

  const reload = useCallback(() => {
    const storage = browserStorage()
    migrateLegacyWorkspace(storage)
    const inspected = inspectWorkspace(storage)
    setWorkspace(inspected.workspace)
    setLoadStatus(inspected.status)
    setQuarantineKey(inspected.quarantineKey)
    setDropped(inspected.dropped)
    applyAppearance(inspected.workspace.settings)
    setHydrated(true)
  }, [])

  useEffect(() => {
    reload()
    const onStorage = (event: StorageEvent) => {
      if (event.key === WORKSPACE_KEY || event.key === null) {
        toast("Another tab updated this workspace. Showing the latest copy.")
        reload()
      }
    }
    window.addEventListener(WORKSPACE_CHANGED_EVENT, reload)
    window.addEventListener("storage", onStorage)
    return () => {
      window.removeEventListener(WORKSPACE_CHANGED_EVENT, reload)
      window.removeEventListener("storage", onStorage)
    }
  }, [reload])

  const persist = useCallback((mutator: (current: Workspace) => Workspace) => {
    const storage = browserStorage()
    try {
      const next = mutateWorkspace(storage, mutator)
      setWorkspace(next)
      applyAppearance(next.settings)
      return next
    } catch (error) {
      if (error instanceof WorkspaceSaveError) {
        toast.error("Could not save on this device. Export a backup if you can.")
        return loadWorkspace(storage)
      }
      throw error
    }
  }, [])

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
