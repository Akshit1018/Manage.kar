"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { CheckCircle2, Circle, Calendar, ArrowLeft, Download } from "lucide-react"
import { SHARE_EXPIRED_ERROR, decodeSharePayload, type SharePayload } from "@/lib/share/codec"
import { decodeEncryptedSharePayload, isEncryptedShareToken } from "@/lib/share/secret"
import { importSharedTasks } from "@/lib/share/import-tasks"
import { recordBrowserEvent } from "@/lib/analytics/local-events"
import { ConfirmSheet } from "@/components/confirm-sheet"
import { browserStorage, loadWorkspace, notifyWorkspaceChanged, replaceWorkspace } from "@/lib/store/workspace"

export default function SharedTasksPage() {
  const params = useParams()
  const router = useRouter()
  const [sharedData, setSharedData] = useState<SharePayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [needsPassword, setNeedsPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [unlocking, setUnlocking] = useState(false)
  const [confirmImport, setConfirmImport] = useState(false)
  const encodedData = decodeURIComponent(String(params.data ?? ""))

  useEffect(() => {
    if (isEncryptedShareToken(encodedData)) {
      setNeedsPassword(true)
      setLoading(false)
      return
    }
    const decoded = decodeSharePayload(encodedData)
    if (!decoded.ok) {
      setError(decoded.error)
    } else {
      setSharedData(decoded.payload)
    }
    setLoading(false)
  }, [encodedData])

  const handleUnlock = async () => {
    setUnlocking(true)
    const decoded = await decodeEncryptedSharePayload(encodedData, password)
    setUnlocking(false)
    if (!decoded.ok) {
      setError(decoded.error)
      return
    }
    setError(null)
    setNeedsPassword(false)
    setSharedData(decoded.payload)
  }

  const handleImportTasks = () => {
    if (!sharedData) {
      return
    }
    setConfirmImport(true)
  }

  const confirmImportTasks = () => {
    if (!sharedData) {
      return
    }
    const storage = browserStorage()
    const result = importSharedTasks(loadWorkspace(storage), sharedData)
    replaceWorkspace(storage, result.workspace)
    notifyWorkspaceChanged()
    recordBrowserEvent("import", { imported: result.imported, skipped: result.skipped })
    if (result.imported === 0) {
      toast("These tasks were already imported.")
    } else {
      toast(`Imported ${result.imported} task${result.imported === 1 ? "" : "s"}.`)
    }
    setConfirmImport(false)
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <p className="text-muted-foreground">Loading shared tasks...</p>
      </div>
    )
  }

  if (needsPassword && !sharedData) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <Card className="mk-editorial-card w-full max-w-md p-8">
          <h1 className="text-xl font-semibold font-sans mb-2">Password required</h1>
          <p className="text-muted-foreground font-serif mb-4 text-sm">
            This share link is encrypted. Enter the password the sender gave you separately.
          </p>
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Share password"
            className="mb-3"
            onKeyDown={(event) => {
              if (event.key === "Enter" && password.trim() && !unlocking) {
                event.preventDefault()
                void handleUnlock()
              }
            }}
          />
          {error ? <p className="text-sm text-destructive mb-3">{error}</p> : null}
          <div className="mk-sheet-footer-actions">
            <Button variant="outline" onClick={() => router.push("/")} className="mk-touch rounded-xl">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <Button onClick={handleUnlock} disabled={unlocking || !password.trim()} className="mk-touch rounded-xl">
              Unlock
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (error || !sharedData) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <Card className="mk-editorial-card max-w-md p-8 text-center">
          <h1 className="text-xl font-semibold font-sans mb-2">
            {error === SHARE_EXPIRED_ERROR ? "This share link has expired" : "Invalid share link"}
          </h1>
          <p className="text-muted-foreground font-serif mb-6">
            {error || "This share link is invalid. It may be corrupted, truncated, or past its client-side expiry."}
          </p>
          <Button onClick={() => router.push("/")} className="mk-touch rounded-xl">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go to dashboard
          </Button>
        </Card>
      </div>
    )
  }

  const pendingTasks = sharedData.tasks.filter((task) => !task.completed)
  const completedTasks = sharedData.tasks.filter((task) => task.completed)

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="mk-share-header">
        <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="mk-touch rounded-full" aria-label="Back to dashboard">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="mk-share-header-copy">
          <h1 className="text-2xl font-bold font-sans text-foreground">{sharedData.userName}&apos;s tasks</h1>
          <p className="text-muted-foreground font-serif">
            Shared {new Date(sharedData.sharedAt).toLocaleDateString()} • {sharedData.tasks.length} tasks
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {isEncryptedShareToken(encodedData)
              ? `This list was unlocked with a password. Importing copies the tasks onto this device.${
                  sharedData.expiresAt
                    ? ` This page stops decoding after ${new Date(sharedData.expiresAt).toLocaleString()}.`
                    : " This older link has no expiry."
                }`
              : "Anyone with this URL can read these tasks. Importing copies them onto this device."}
          </p>
        </div>
        <div className="mk-share-header-actions">
          <Button onClick={handleImportTasks} className="mk-touch rounded-xl">
            <Download className="h-4 w-4 mr-2" />
            Import tasks
          </Button>
        </div>
      </div>

      {sharedData.customMessage && (
        <Card className="mk-editorial-card mb-6 p-4">
          <p className="text-sm font-medium mb-1">Message from {sharedData.userName}</p>
          <p className="text-sm text-muted-foreground">{sharedData.customMessage}</p>
        </Card>
      )}

      {pendingTasks.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Pending ({pendingTasks.length})</h2>
          <div className="space-y-3">
            {pendingTasks.map((task) => (
              <Card key={task.id} className="mk-editorial-card p-4">
                <div className="flex items-center gap-3">
                  <Circle className="h-5 w-5 shrink-0 text-orange-500" />
                  <div className="mk-entity-copy">
                    <p className="mk-entity-title">{task.title}</p>
                    <div className="mk-meta-row mt-2">
                      <Badge variant="secondary">{task.priority}</Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {task.dueDate}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {completedTasks.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Completed ({completedTasks.length})</h2>
          <div className="space-y-3">
            {completedTasks.map((task) => (
              <Card key={task.id} className="mk-editorial-card p-4 opacity-60">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                  <p className="mk-entity-copy mk-entity-title line-through text-muted-foreground">{task.title}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
      <ConfirmSheet
        request={
          confirmImport
            ? {
                title: "Import these tasks?",
                message: `Import ${sharedData.tasks.length} task(s) from ${sharedData.userName} into this device's workspace?`,
                confirmLabel: "Import",
                tone: "neutral",
              }
            : null
        }
        onCancel={() => setConfirmImport(false)}
        onConfirm={confirmImportTasks}
      />
    </div>
  )
}
