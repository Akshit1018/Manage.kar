"use client"

import { BellRing, CheckCircle2, Circle } from "lucide-react"
import { Button } from "@/components/ui/button"
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
        <h3 className="mk-section-title">Follow-ups</h3>
      </div>
      <p className="mk-section-support mb-4">
        Local nudges while this app is open — not push notifications.
      </p>
      <div className="space-y-3">
        {tasks.map((task) => (
          <div key={task.id} className="mk-editorial-card p-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onToggleTask(task.id)}
                aria-label={`Complete ${task.title}`}
              >
                {task.completed ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5" />}
              </Button>
              <div className="mk-entity-copy">
                <p>{task.title}</p>
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
          </div>
        ))}
      </div>
    </div>
  )
}
