"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { EmptyState } from "@/components/empty-state"
import type { Task, WorkspaceLabel } from "@/lib/domain/types"
import { labelsForIds } from "@/lib/labels/book"
import { LabelChips } from "@/components/label-chips"
import type { DateFormat } from "@/lib/dates/due-date"
import { formatDueDate } from "@/lib/dates/due-date"
import type { TaskListFilter } from "@/lib/tasks/filter"
import { Calendar, CheckCircle2, CheckSquare, Circle, Edit, Plus } from "lucide-react"

const FILTERS: Array<{ id: TaskListFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "today", label: "Today" },
  { id: "overdue", label: "Overdue" },
  { id: "done", label: "Done" },
]

interface TaskListProps {
  tasks: Task[]
  filter: TaskListFilter
  searchQuery: string
  labels: WorkspaceLabel[]
  dateFormat: DateFormat
  isSelectionMode: boolean
  selectedTasks: number[]
  onFilterChange: (filter: TaskListFilter) => void
  onToggleSelectionMode: () => void
  onToggleSelected: (taskId: number) => void
  onShareSelected: () => void
  onAddTask: () => void
  onToggleTask: (taskId: number) => void
  onEditTask: (task: Task) => void
}

export function TaskList({
  tasks,
  filter,
  searchQuery,
  labels,
  dateFormat,
  isSelectionMode,
  selectedTasks,
  onFilterChange,
  onToggleSelectionMode,
  onToggleSelected,
  onShareSelected,
  onAddTask,
  onToggleTask,
  onEditTask,
}: TaskListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Tasks</h3>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-transparent" onClick={onToggleSelectionMode}>
            <CheckSquare className="h-4 w-4 mr-2" />
            {isSelectionMode ? "Done" : "Select"}
          </Button>
          <Button onClick={onAddTask}>
            <Plus className="h-4 w-4 mr-2" />
            Add task
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Task filters">
        {FILTERS.map((item) => (
          <Button
            key={item.id}
            type="button"
            size="sm"
            variant={filter === item.id ? "default" : "outline"}
            className={filter === item.id ? "" : "bg-transparent"}
            onClick={() => onFilterChange(item.id)}
            aria-pressed={filter === item.id}
          >
            {item.label}
          </Button>
        ))}
      </div>
      {isSelectionMode && selectedTasks.length > 0 && (
        <Button onClick={onShareSelected}>Share selected ({selectedTasks.length})</Button>
      )}
      {tasks.length === 0 ? (
        <EmptyState
          title={searchQuery || filter !== "all" ? "No matching tasks" : "No tasks yet"}
          description={
            searchQuery
              ? "Try a different search."
              : filter !== "all"
                ? "Nothing in this filter."
                : "Create a task. It will still be here after refresh."
          }
          actionLabel={searchQuery || filter !== "all" ? undefined : "Add task"}
          onAction={searchQuery || filter !== "all" ? undefined : onAddTask}
        />
      ) : (
        tasks.map((task) => (
          <Card key={task.id} className="p-4">
            <div className="flex items-center gap-3">
              {isSelectionMode && (
                <input
                  type="checkbox"
                  checked={selectedTasks.includes(task.id)}
                  onChange={() => onToggleSelected(task.id)}
                  aria-label={`Select ${task.title}`}
                />
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onToggleTask(task.id)}
                aria-label={task.completed ? `Mark ${task.title} incomplete` : `Complete ${task.title}`}
              >
                {task.completed ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5" />}
              </Button>
              <div className="flex-1">
                <p className={task.completed ? "line-through text-muted-foreground" : ""}>{task.title}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant={task.priority === "high" ? "destructive" : "secondary"}>{task.priority}</Badge>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDueDate(task.dueDate, dateFormat)}
                  </span>
                  {task.checklist && task.checklist.length > 0 ? (
                    <span>
                      {task.checklist.filter((item) => item.completed).length}/{task.checklist.length}
                    </span>
                  ) : null}
                </div>
                <div className="mt-2">
                  <LabelChips labels={labelsForIds(labels, task.labelIds)} />
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => onEditTask(task)} aria-label={`Edit ${task.title}`}>
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))
      )}
    </div>
  )
}
