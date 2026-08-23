"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { EmptyState } from "@/components/empty-state"
import type { Habit, Task } from "@/lib/domain/types"
import type { DateFormat } from "@/lib/dates/due-date"
import { formatDueDate } from "@/lib/dates/due-date"
import { CheckCircle2, Circle, Edit } from "lucide-react"

interface TodaySectionProps {
  tasks: Task[]
  todayTasks: Task[]
  todayHabits: Habit[]
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
  dateFormat,
  onToggleTask,
  onEditTask,
  onToggleHabit,
  onAddTask,
}: TodaySectionProps) {
  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Today</h3>
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
            <Card key={`task-${task.id}`} className="modern-card p-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onToggleTask(task.id)}
                  aria-label={task.completed ? `Mark ${task.title} incomplete` : `Complete ${task.title}`}
                >
                  {task.completed ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5" />}
                </Button>
                <div className="flex-1">
                  <p>{task.title}</p>
                  <p className="text-xs text-muted-readable">{formatDueDate(task.dueDate, dateFormat)}</p>
                  {task.checklist && task.checklist.length > 0 ? (
                    <p className="text-xs text-muted-readable">
                      {task.checklist.filter((item) => item.completed).length}/{task.checklist.length} checklist
                    </p>
                  ) : null}
                </div>
                <Button variant="ghost" size="icon" onClick={() => onEditTask(task)} aria-label={`Edit ${task.title}`}>
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
          {todayHabits.map((habit) => (
            <Card key={`habit-${habit.id}`} className="modern-card p-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onToggleHabit(habit.id)}
                  aria-label={habit.completedToday ? `Unmark ${habit.name} for today` : `Complete ${habit.name} today`}
                >
                  {habit.completedToday ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </Button>
                <div className="flex-1">
                  <p>{habit.name}</p>
                  <p className="text-xs text-muted-readable">Habit · streak {habit.streak}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
