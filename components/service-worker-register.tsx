"use client"

import { useEffect } from "react"

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return
    }
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Offline cache is optional. The app still works without it.
    })
  }, [])

  return null
}
