"use client"

import { useEffect } from "react"

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return
    }

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js")
        const periodicSync = (
          registration as ServiceWorkerRegistration & {
            periodicSync?: { register: (tag: string, options: { minInterval: number }) => Promise<void> }
          }
        ).periodicSync
        try {
          await periodicSync?.register("managekar-reminders", { minInterval: 15 * 60 * 1000 })
        } catch {
          // Periodic background sync is optional. The open-tab clock still runs.
        }
        registration.active?.postMessage({ type: "check-reminders" })
      } catch {
        // Offline cache is optional. The app still works without it.
      }
    }

    void register()

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        navigator.serviceWorker.controller?.postMessage({ type: "check-reminders" })
      }
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => document.removeEventListener("visibilitychange", onVisible)
  }, [])

  return null
}
