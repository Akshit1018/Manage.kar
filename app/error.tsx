"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { recordBrowserEvent } from "@/lib/analytics/local-events"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    recordBrowserEvent("error", { message: error.message.slice(0, 80) })
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-xl font-semibold">Something broke on this page</h1>
      <p className="max-w-md text-center text-sm text-muted-foreground">
        Your workspace data is still in this browser. Reload and export a backup if the screen stays empty.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}
