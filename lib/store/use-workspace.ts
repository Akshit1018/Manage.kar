"use client"

import { useCallback, useEffect, useState } from "react"
import type { Workspace } from "@/lib/domain/types"
import { applyThemePreference } from "@/lib/theme/apply-theme"
import {
  WORKSPACE_CHANGED_EVENT,
  browserStorage,
  createEmptyWorkspace,
  loadWorkspace,
  migrateLegacyWorkspace,
  saveWorkspace,
} from "@/lib/store/workspace"

export function useWorkspace() {
  const [workspace, setWorkspace] = useState<Workspace>(() => createEmptyWorkspace())
  const [hydrated, setHydrated] = useState(false)

  const reload = useCallback(() => {
    const storage = browserStorage()
    migrateLegacyWorkspace(storage)
    const loaded = loadWorkspace(storage)
    setWorkspace(loaded)
    applyThemePreference(loaded.settings.appearance.theme)
    setHydrated(true)
  }, [])

  useEffect(() => {
    reload()
    window.addEventListener(WORKSPACE_CHANGED_EVENT, reload)
    return () => {
      window.removeEventListener(WORKSPACE_CHANGED_EVENT, reload)
    }
  }, [reload])

  const persist = useCallback((partial: Partial<Workspace>) => {
    const storage = browserStorage()
    const current = loadWorkspace(storage)
    const next = saveWorkspace(storage, { ...current, ...partial })
    setWorkspace(next)
    return next
  }, [])

  return { workspace, hydrated, persist, reload }
}
