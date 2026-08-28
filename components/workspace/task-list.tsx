"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/empty-state"
import type { Task, TaskStatus, WorkspaceLabel } from "@/lib/domain/types"
import { labelsForIds } from "@/lib/labels/book"
import { LabelChips } from "@/components/label-chips"
import type { DateFormat } from "@/lib/dates/due-date"
import { formatDueDate } from "@/lib/dates/due-date"
import type { TaskListFilter } from "@/lib/tasks/filter"
import { DEFAULT_TASK_OWNER, TASK_STATUSES, groupTasksByStatus, statusLabel, taskStatus } from "@/lib/tasks/board"
import { followUpCopy } from "@/lib/tasks/follow-up"
import {
  Bot,
  Calendar,
  CheckCircle2,
  CheckSquare,
  Circle,
  Edit,
  Kanban,
  List,
  Plus,
  Repeat,
  User,
} from "lucide-react"

const FILTERS: Array<{ id: TaskListFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "today", label: "Today" },
  { id: "overdue", label: "Overdue" },
  { id: "done", label: "Done" },
]

type TaskViewMode = "list" | "board"

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
  onSetTaskStatus: (taskId: number, status: TaskStatus) => void
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
  onSetTaskStatus,
}: TaskListProps) {
  const [viewMode, setViewMode] = useState<TaskViewMode>("list")

  const emptyState = (
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
  )

  return (
    <div className="space-y-4">
      <div className="mk-section-toolbar">
        <div className="mk-section-toolbar-actions">
          <Button
            variant="outline"
            className="bg-transparent"
            onClick={onToggleSelectionMode}
            aria-label={isSelectionMode ? "Done selecting tasks" : "Select tasks"}
          >
            <CheckSquare className="h-4 w-4 min-[375px]:mr-2" />
            <span className="hidden min-[375px]:inline">{isSelectionMode ? "Done" : "Select"}</span>
          </Button>
          <Button onClick={onAddTask} aria-label="Add task">
            <Plus className="h-4 w-4 min-[375px]:mr-2" />
            <span className="hidden min-[375px]:inline">Add task</span>
          </Button>
        </div>
      </div>
      <div className="mk-task-controls">
        <div className="mk-filter-rail" role="group" aria-label="Task filters">
          {FILTERS.map((item) => (
            <Button
              key={item.id}
              type="button"
              size="sm"
              variant={filter === item.id ? "default" : "outline"}
              className={filter === item.id ? "rounded-full" : "rounded-full bg-transparent"}
              onClick={() => onFilterChange(item.id)}
              aria-pressed={filter === item.id}
            >
              {item.label}
            </Button>
          ))}
        </div>
        <div className="mk-view-toggle" role="group" aria-label="Task view">
          <Button
            type="button"
            size="sm"
            variant={viewMode === "list" ? "default" : "ghost"}
            className="rounded-full"
            onClick={() => setViewMode("list")}
            aria-pressed={viewMode === "list"}
          >
            <List className="h-4 w-4 mr-1" />
            List
          </Button>
          <Button
            type="button"
            size="sm"
            variant={viewMode === "board" ? "default" : "ghost"}
            className="rounded-full"
            onClick={() => setViewMode("board")}
            aria-pressed={viewMode === "board"}
          >
            <Kanban className="h-4 w-4 mr-1" />
            Board
          </Button>
        </div>
      </div>
      {isSelectionMode && selectedTasks.length > 0 && (
        <Button onClick={onShareSelected}>Share selected ({selectedTasks.length})</Button>
      )}
      {tasks.length === 0 ? (
        emptyState
      ) : viewMode === "list" ? (
        tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            labels={labels}
            dateFormat={dateFormat}
            isSelectionMode={isSelectionMode}
            selected={selectedTasks.includes(task.id)}
            onToggleSelected={onToggleSelected}
            onToggleTask={onToggleTask}
            onEditTask={onEditTask}
          />
        ))
      ) : (
        <div className="mk-board-snap" role="region" aria-label="Task board">
          {TASK_STATUSES.map((status) => {
            const column = groupTasksByStatus(tasks)[status]
            return (
              <div key={status} className="mk-board-column">
                <div className="mk-board-column-head">
                  <h2 className="mk-section-title">{statusLabel(status)}</h2>
                  <span className="mk-board-count">{column.length}</span>
                </div>
                {column.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-border/70 p-4 text-center text-xs text-muted-foreground">
                    Nothing here.
                  </p>
                ) : (
                  column.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      labels={labels}
                      dateFormat={dateFormat}
                      isSelectionMode={isSelectionMode}
                      selected={selectedTasks.includes(task.id)}
                      onToggleSelected={onToggleSelected}
                      onToggleTask={onToggleTask}
                      onEditTask={onEditTask}
                      onSetTaskStatus={onSetTaskStatus}
                    />
                  ))
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function boardActions(task: Task): Array<{ label: string; status: TaskStatus }> {
  const status = taskStatus(task)
  switch (status) {
    case "todo":
      return [{ label: "Start", status: "doing" }]
    case "doing":
      return [
        { label: "Pause", status: "todo" },
        { label: "Done", status: "done" },
      ]
    case "done":
      return [{ label: "Reopen", status: "todo" }]
    default: {
      const exhaustive: never = status
      return exhaustive
    }
  }
}

function TaskCard({
  task,
  labels,
  dateFormat,
  isSelectionMode,
  selected,
  onToggleSelected,
  onToggleTask,
  onEditTask,
  onSetTaskStatus,
}: {
  task: Task
  labels: WorkspaceLabel[]
  dateFormat: DateFormat
  isSelectionMode: boolean
  selected: boolean
  onToggleSelected: (taskId: number) => void
  onToggleTask: (taskId: number) => void
  onEditTask: (task: Task) => void
  onSetTaskStatus?: (taskId: number, status: TaskStatus) => void
}) {
  return (
    <div className="mk-editorial-card p-4">
      <div className="flex items-start gap-3">
        {isSelectionMode && (
          <label className="mk-chip-action">
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onToggleSelected(task.id)}
              aria-label={`Select ${task.title}`}
            />
          </label>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onToggleTask(task.id)}
          aria-label={task.completed ? `Mark ${task.title} incomplete` : `Complete ${task.title}`}
        >
          {task.completed ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5" />}
        </Button>
        <div className="mk-entity-copy">
          <p className={task.completed ? "mk-entity-title line-through text-muted-foreground" : "mk-entity-title"}>
            {task.title}
          </p>
          <div className="mk-meta-row mt-1 text-xs text-muted-foreground">
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
            {task.owner || task.worker ? (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {task.owner || DEFAULT_TASK_OWNER}
                {task.worker ? (
                  <>
                    <Bot className="ml-1 h-3 w-3" />
                    {task.worker}
                  </>
                ) : null}
              </span>
            ) : null}
            {task.followUp ? (
              <span className="flex items-center gap-1">
                <Repeat className="h-3 w-3" />
                {followUpCopy(task.followUp.cadence)}
              </span>
            ) : null}
          </div>
          <div className="mt-2">
            <LabelChips labels={labelsForIds(labels, task.labelIds)} />
          </div>
          {onSetTaskStatus ? (
            <div className="mk-meta-row mt-2">
              {boardActions(task).map((action) => (
                <Button
                  key={action.status}
                  type="button"
                  size="sm"
                  variant="outline"
                  className="bg-transparent"
                  onClick={() => onSetTaskStatus(task.id, action.status)}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          ) : null}
        </div>
        <Button variant="ghost" size="icon" onClick={() => onEditTask(task)} aria-label={`Edit ${task.title}`}>
          <Edit className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
