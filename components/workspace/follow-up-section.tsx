"use client"

import { BellRing, CheckCircle2, Circle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { Task } from "@/lib/domain/types"
import { followUpCopy } from "@/lib/tasks/follow-up"

interface FollowUpSectionProps {
  tasks: Task[]
  onToggleTask: (taskId: number) => void
  onNudge: (taskId: number) => void
}

export function FollowUpSection({ tasks, onToggleTask, onNudge }: FollowUpSectionProps) {
  if (tasks.length === 0) {
    return null
  }
  return (
    <div>
      <div className="mb-1 flex items-center gap-2">
        <BellRing className="h-4 w-4 text-primary" />
        <h3 className="text-xl font-bold">Follow-ups</h3>
      </div>
      <p className="mb-4 text-xs text-muted-readable">
        Local nudges while this app is open — not push notifications.
      </p>
      <div className="space-y-3">
        {tasks.map((task) => (
          <Card key={task.id} className="modern-card p-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onToggleTask(task.id)}
                aria-label={`Complete ${task.title}`}
              >
                {task.completed ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5" />}
              </Button>
              <div className="min-w-0 flex-1">
                <p className="truncate">{task.title}</p>
                {task.followUp ? (
                  <p className="text-xs text-muted-readable">{followUpCopy(task.followUp.cadence)}</p>
                ) : null}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="bg-transparent"
                onClick={() => onNudge(task.id)}
                aria-label={`Snooze follow-up for ${task.title}`}
              >
                Checked in
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
