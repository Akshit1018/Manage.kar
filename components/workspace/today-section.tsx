"use client"

import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/empty-state"
import type { Habit, Task, WorkspaceLabel } from "@/lib/domain/types"
import { labelsForIds } from "@/lib/labels/book"
import { LabelChips } from "@/components/label-chips"
import type { DateFormat } from "@/lib/dates/due-date"
import { formatDueDate } from "@/lib/dates/due-date"
import { CheckCircle2, Circle, Edit } from "lucide-react"

interface TodaySectionProps {
  tasks: Task[]
  todayTasks: Task[]
  todayHabits: Habit[]
  labels: WorkspaceLabel[]
  dateFormat: DateFormat
  onToggleTask: (taskId: number) => void
  onEditTask: (task: Task) => void
  onToggleHabit: (habitId: number) => void
  onAddTask: () => void
}

export function TodaySection({
  tasks,
  todayTasks,
  todayHabits,
  labels,
  dateFormat,
  onToggleTask,
  onEditTask,
  onToggleHabit,
  onAddTask,
}: TodaySectionProps) {
  return (
    <div>
      <h3 className="mk-section-title mb-4">Today</h3>
      {todayTasks.length === 0 && todayHabits.length === 0 ? (
        <EmptyState
          title={tasks.length === 0 ? "Nothing on your plate yet" : "Nothing due today"}
          description={
            tasks.length === 0
              ? "Add one task. It stays on this device after refresh. There is no cloud backup until you export."
              : "Overdue and today’s work will land here."
          }
          actionLabel="Add task"
          onAction={onAddTask}
        />
      ) : (
        <div className="space-y-3">
          {todayTasks.map((task) => (
            <div key={`task-${task.id}`} className="mk-editorial-card p-4">
              <div className="flex items-start gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onToggleTask(task.id)}
                  aria-label={task.completed ? `Mark ${task.title} incomplete` : `Complete ${task.title}`}
                >
                  {task.completed ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5" />}
                </Button>
                <div className="mk-entity-copy">
                  <p>{task.title}</p>
                  <p className="text-xs text-muted-readable">{formatDueDate(task.dueDate, dateFormat)}</p>
                  {task.checklist && task.checklist.length > 0 ? (
                    <p className="text-xs text-muted-readable">
                      {task.checklist.filter((item) => item.completed).length}/{task.checklist.length} checklist
                    </p>
                  ) : null}
                  <div className="mt-2">
                    <LabelChips labels={labelsForIds(labels, task.labelIds)} />
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => onEditTask(task)} aria-label={`Edit ${task.title}`}>
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {todayHabits.map((habit) => (
            <div key={`habit-${habit.id}`} className="mk-editorial-card p-4">
              <div className="flex items-start gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onToggleHabit(habit.id)}
                  aria-label={habit.completedToday ? `Unmark ${habit.name} for today` : `Complete ${habit.name} today`}
                >
                  {habit.completedToday ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </Button>
                <div className="mk-entity-copy">
                  <p>{habit.name}</p>
                  <p className="text-xs text-muted-readable">Habit · streak {habit.streak}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
