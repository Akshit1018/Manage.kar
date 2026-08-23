"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { CheckCircle2, Circle, Calendar, ArrowLeft, Download } from "lucide-react"
import { decodeSharePayload, type SharePayload } from "@/lib/share/codec"
import { decodeEncryptedSharePayload, isEncryptedShareToken } from "@/lib/share/secret"
import { importSharedTasks } from "@/lib/share/import-tasks"
import { recordBrowserEvent } from "@/lib/analytics/local-events"
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
    if (
      !window.confirm(
        `Import ${sharedData.tasks.length} task(s) from ${sharedData.userName} into this device's workspace?`,
      )
    ) {
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
        <Card className="glass-card p-8 rounded-2xl max-w-md w-full">
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
          />
          {error ? <p className="text-sm text-destructive mb-3">{error}</p> : null}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/")} className="rounded-xl">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <Button onClick={handleUnlock} disabled={unlocking || !password.trim()} className="rounded-xl">
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
        <Card className="glass-card p-8 rounded-2xl text-center max-w-md">
          <h1 className="text-xl font-semibold font-sans mb-2">Invalid share link</h1>
          <p className="text-muted-foreground font-serif mb-6">
            {error || "This share link is invalid. Share links do not expire, but they can be corrupted or truncated."}
          </p>
          <Button onClick={() => router.push("/")} className="rounded-xl">
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
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="rounded-full" aria-label="Back to dashboard">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold font-sans text-foreground">{sharedData.userName}&apos;s tasks</h1>
          <p className="text-muted-foreground font-serif">
            Shared {new Date(sharedData.sharedAt).toLocaleDateString()} • {sharedData.tasks.length} tasks
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {isEncryptedShareToken(encodedData)
              ? "This list was unlocked with a password. Importing copies the tasks onto this device. The link does not expire."
              : "Anyone with this URL can read these tasks. Importing copies them onto this device."}
          </p>
        </div>
        <Button onClick={handleImportTasks} className="rounded-xl">
          <Download className="h-4 w-4 mr-2" />
          Import tasks
        </Button>
      </div>

      {sharedData.customMessage && (
        <Card className="glass-card p-4 rounded-2xl mb-6">
          <p className="text-sm font-medium mb-1">Message from {sharedData.userName}</p>
          <p className="text-sm text-muted-foreground">{sharedData.customMessage}</p>
        </Card>
      )}

      {pendingTasks.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Pending ({pendingTasks.length})</h2>
          <div className="space-y-3">
            {pendingTasks.map((task) => (
              <Card key={task.id} className="glass-card p-4 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Circle className="h-5 w-5 text-orange-500" />
                  <div className="flex-1">
                    <p>{task.title}</p>
                    <div className="flex items-center gap-2 mt-2">
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
              <Card key={task.id} className="glass-card p-4 rounded-2xl opacity-60">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <p className="line-through text-muted-foreground">{task.title}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
