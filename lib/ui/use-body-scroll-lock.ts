"use client"

import { useEffect } from "react"
import { lockBodyScroll, unlockBodyScroll, type ScrollLockDocument } from "@/lib/ui/body-scroll-lock"

export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active || typeof document === "undefined") {
      return
    }
    const handle = lockBodyScroll(document as unknown as ScrollLockDocument, window.scrollY)
    return () => {
      const scrollY = unlockBodyScroll(document as unknown as ScrollLockDocument, handle)
      window.scrollTo(0, scrollY)
    }
  }, [active])
}
