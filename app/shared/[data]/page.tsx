"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Circle, Calendar, ArrowLeft, Download, Users } from "lucide-react"

interface Task {
  id: number
  title: string
  completed: boolean
  priority: "high" | "medium" | "low"
  dueDate: string
  description?: string
  checklist?: { id: number; text: string; completed: boolean }[]
}

interface SharedData {
  userName: string
  tasks: Task[]
  sharedAt: string
  customMessage?: string
}

export default function SharedTasksPage() {
  const params = useParams()
  const router = useRouter()
  const [sharedData, setSharedData] = useState<SharedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const encodedData = params.data as string
      const decodedData = JSON.parse(atob(encodedData))
      setSharedData(decodedData)
    } catch (err) {
      setError("Invalid or corrupted share link")
    } finally {
      setLoading(false)
    }
  }, [params.data])

  const handleImportTasks = () => {
    if (sharedData) {
      // In a real app, this would save to user's account
      localStorage.setItem("importedTasks", JSON.stringify(sharedData.tasks))
      router.push("/?imported=true")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading shared tasks...</p>
        </div>
      </div>
    )
  }

  if (error || !sharedData) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <Card className="glass-card p-8 rounded-2xl text-center max-w-md">
          <div className="text-destructive text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold font-sans mb-2">Invalid Share Link</h1>
          <p className="text-muted-foreground font-serif mb-6">
            {error || "This share link is invalid or has expired."}
          </p>
          <Button onClick={() => router.push("/")} className="rounded-xl">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go to Dashboard
          </Button>
        </Card>
      </div>
    )
  }

  const pendingTasks = sharedData.tasks.filter((task) => !task.completed)
  const completedTasks = sharedData.tasks.filter((task) => task.completed)

  return (
    <div className="min-h-screen p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold font-sans text-foreground">{sharedData.userName}'s Tasks</h1>
          <p className="text-muted-foreground font-serif">
            Shared {new Date(sharedData.sharedAt).toLocaleDateString()} • {sharedData.tasks.length} tasks
          </p>
        </div>
        <Button onClick={handleImportTasks} className="rounded-xl">
          <Download className="h-4 w-4 mr-2" />
          Import Tasks
        </Button>
      </div>

      {/* Custom Message */}
      {sharedData.customMessage && (
        <Card className="glass-card p-4 rounded-2xl mb-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-500/20 rounded-xl">
              <Users className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium font-sans text-foreground mb-1">Message from {sharedData.userName}</p>
              <p className="text-sm text-muted-foreground font-serif">{sharedData.customMessage}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <Card className="glass-card p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-xl">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold font-sans">{completedTasks.length}</p>
              <p className="text-sm text-muted-foreground font-serif">Completed</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-xl">
              <Circle className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold font-sans">{pendingTasks.length}</p>
              <p className="text-sm text-muted-foreground font-serif">Pending</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-xl">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold font-sans">{sharedData.tasks.length}</p>
              <p className="text-sm text-muted-foreground font-serif">Total</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Pending Tasks */}
      {pendingTasks.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold font-sans mb-4">Pending Tasks ({pendingTasks.length})</h2>
          <div className="space-y-3">
            {pendingTasks.map((task) => (
              <Card key={task.id} className="glass-card p-4 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Circle className="h-5 w-5 text-orange-500" />
                  <div className="flex-1">
                    <p className="font-serif text-foreground">{task.title}</p>
                    {task.description && (
                      <p className="text-sm text-muted-foreground font-serif mt-1">{task.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge
                        variant={
                          task.priority === "high"
                            ? "destructive"
                            : task.priority === "medium"
                              ? "default"
                              : "secondary"
                        }
                        className="text-xs"
                      >
                        {task.priority}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {task.dueDate}
                      </span>
                      {task.checklist && task.checklist.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {task.checklist.filter((item) => item.completed).length}/{task.checklist.length} items
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold font-sans mb-4">Completed Tasks ({completedTasks.length})</h2>
          <div className="space-y-3">
            {completedTasks.map((task) => (
              <Card key={task.id} className="glass-card p-4 rounded-2xl opacity-60">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <p className="font-serif text-muted-foreground line-through">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {task.priority}
                      </Badge>
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
    </div>
  )
}
