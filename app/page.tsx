"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  CheckCircle2,
  Circle,
  Calendar,
  Target,
  Settings,
  User,
  Edit,
  Share2,
  Zap,
  Plus,
  BarChart3,
  Clock,
  FileText,
  CheckSquare,
  Search,
  StickyNote,
  Activity,
} from "lucide-react"
import { FloatingToggle } from "@/components/floating-toggle"
import { TaskModal } from "@/components/task-modal"
import { NoteModal } from "@/components/note-modal"
import { ShareModal } from "@/components/share-modal"
import { HabitModal } from "@/components/habit-modal"
import { HabitDashboard } from "@/components/habit-dashboard"
import { FocusModal } from "@/components/focus-modal"
import { ProfileModal } from "@/components/profile-modal"
import { SettingsModal } from "@/components/settings-modal"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { TimeTracker } from "@/components/time-tracker"
import { GoalManager } from "@/components/goal-manager"
import { ClipboardMonitor } from "@/components/clipboard-monitor"
import { EmptyState } from "@/components/empty-state"
import type { Habit, Note, Task } from "@/lib/domain/types"
import { useWorkspace } from "@/lib/store/use-workspace"
import { nextNumericId } from "@/lib/store/workspace"
import { formatDueDate, formatTimestamp, localDateKey, normalizeDueDate } from "@/lib/dates/due-date"
import { hydrateHabit, toggleHabitOnDate } from "@/lib/habits/streak"
import { completeRecurringTask } from "@/lib/reminders/due"
import { useLocalReminders } from "@/lib/reminders/use-local-reminders"

type ViewMode = "overview" | "tasks" | "notes" | "habits"

export default function Dashboard() {
  const { workspace, persist, hydrated, loadStatus, quarantineKey, dropped, resetCorrupt } = useWorkspace()
  const tasks = workspace.tasks
  const notes = workspace.notes
  const habits = workspace.habits
  const userName = workspace.profile.name
  const dateFormat = workspace.settings.general.dateFormat

  useLocalReminders(workspace, persist, hydrated)

  const [currentView, setCurrentView] = useState<ViewMode>("overview")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTasks, setSelectedTasks] = useState<number[]>([])
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [taskModal, setTaskModal] = useState<{ isOpen: boolean; mode: "create" | "edit"; task?: Task }>({
    isOpen: false,
    mode: "create",
  })
  const [noteModal, setNoteModal] = useState<{ isOpen: boolean; mode: "create" | "edit"; note?: Note }>({
    isOpen: false,
    mode: "create",
  })
  const [habitModal, setHabitModal] = useState<{ isOpen: boolean; mode: "create" | "edit"; habit?: Habit }>({
    isOpen: false,
    mode: "create",
  })
  const [shareModal, setShareModal] = useState(false)
  const [habitDashboard, setHabitDashboard] = useState(false)
  const [focusModal, setFocusModal] = useState(false)
  const [profileModal, setProfileModal] = useState(false)
  const [settingsModal, setSettingsModal] = useState(false)
  const [analyticsModal, setAnalyticsModal] = useState(false)
  const [timeTrackerModal, setTimeTrackerModal] = useState(false)
  const [goalManagerModal, setGoalManagerModal] = useState(false)

  const handleTaskToggle = (taskId: number) => {
    persist((current) => {
      const existing = current.tasks.find((task) => task.id === taskId)
      if (!existing) {
        return current
      }
      if (!existing.completed) {
        const { completed, next } = completeRecurringTask(existing, nextNumericId(current.tasks))
        return {
          ...current,
          tasks: [...current.tasks.map((task) => (task.id === taskId ? completed : task)), ...(next ? [next] : [])],
        }
      }
      return {
        ...current,
        tasks: current.tasks.map((task) => (task.id === taskId ? { ...task, completed: false } : task)),
      }
    })
  }

  const handleSaveTask = (taskData: Omit<Task, "id"> | Task) => {
    persist((current) => {
      const title = taskData.title.trim()
      const dueDate = normalizeDueDate(taskData.dueDate)
      if ("id" in taskData) {
        return {
          ...current,
          tasks: current.tasks.map((task) => (task.id === taskData.id ? { ...taskData, title, dueDate } : task)),
        }
      }
      return {
        ...current,
        tasks: [
          ...current.tasks,
          {
            ...taskData,
            id: nextNumericId(current.tasks),
            title,
            dueDate,
          },
        ],
      }
    })
  }

  const handleDeleteTask = (taskId: number) => {
    let removed: Task | undefined
    persist((current) => {
      removed = current.tasks.find((task) => task.id === taskId)
      return { ...current, tasks: current.tasks.filter((task) => task.id !== taskId) }
    })
    if (removed) {
      const snapshot = removed
      toast("Task deleted", {
        duration: 8000,
        action: {
          label: "Undo",
          onClick: () => persist((current) => ({ ...current, tasks: [...current.tasks, snapshot] })),
        },
      })
    }
  }

  const handleSaveNote = (noteData: Omit<Note, "id" | "createdAt"> | Note) => {
    persist((current) => {
      const title = noteData.title.trim()
      if ("id" in noteData) {
        return {
          ...current,
          notes: current.notes.map((note) => (note.id === noteData.id ? { ...noteData, title } : note)),
        }
      }
      return {
        ...current,
        notes: [
          ...current.notes,
          {
            ...noteData,
            id: nextNumericId(current.notes),
            title,
            createdAt: new Date().toISOString(),
          },
        ],
      }
    })
  }

  const handleDeleteNote = (noteId: number) => {
    let removed: Note | undefined
    persist((current) => {
      removed = current.notes.find((note) => note.id === noteId)
      return { ...current, notes: current.notes.filter((note) => note.id !== noteId) }
    })
    if (removed) {
      const snapshot = removed
      toast("Note deleted", {
        duration: 8000,
        action: {
          label: "Undo",
          onClick: () => persist((current) => ({ ...current, notes: [...current.notes, snapshot] })),
        },
      })
    }
  }

  const handleHabitToggle = (habitId: number) => {
    const today = localDateKey()
    persist((current) => ({
      ...current,
      habits: current.habits.map((habit) =>
        habit.id === habitId ? hydrateHabit(toggleHabitOnDate(habit, today), today) : habit,
      ),
    }))
  }

  const handleSaveHabit = (
    habitData: Omit<Habit, "id" | "streak" | "completed" | "completedToday" | "createdAt" | "history"> | Habit,
  ) => {
    persist((current) => {
      if ("id" in habitData) {
        return {
          ...current,
          habits: current.habits.map((habit) =>
            habit.id === habitData.id ? hydrateHabit({ ...habit, ...habitData, name: habitData.name.trim() }, localDateKey()) : habit,
          ),
        }
      }
      return {
        ...current,
        habits: [
          ...current.habits,
          hydrateHabit(
            {
              ...habitData,
              id: nextNumericId(current.habits),
              name: habitData.name.trim(),
              streak: 0,
              completed: false,
              completedToday: false,
              createdAt: new Date().toISOString(),
              history: [],
            },
            localDateKey(),
          ),
        ],
      }
    })
  }

  const handleDeleteHabit = (habitId: number) => {
    let removed: Habit | undefined
    persist((current) => {
      removed = current.habits.find((habit) => habit.id === habitId)
      return { ...current, habits: current.habits.filter((habit) => habit.id !== habitId) }
    })
    if (removed) {
      const snapshot = removed
      toast("Habit deleted", {
        duration: 8000,
        action: {
          label: "Undo",
          onClick: () => persist((current) => ({ ...current, habits: [...current.habits, snapshot] })),
        },
      })
    }
  }

  const clipTitle = (content: string, limit: number) =>
    content.length > limit ? `${content.slice(0, limit).trim()}…` : content.trim()

  const handleClipboardTask = (content: string) => {
    persist((current) => ({
      ...current,
      tasks: [
        ...current.tasks,
        {
          id: nextNumericId(current.tasks),
          title: clipTitle(content, 50),
          completed: false,
          priority: "medium",
          dueDate: localDateKey(),
          description: content.length > 50 ? content : undefined,
          recurring: "none",
          reminders: false,
        },
      ],
    }))
  }

  const handleClipboardNote = (content: string) => {
    persist((current) => ({
      ...current,
      notes: [
        ...current.notes,
        {
          id: nextNumericId(current.notes),
          title: clipTitle(content, 30),
          content,
          createdAt: new Date().toISOString(),
        },
      ],
    }))
  }

  const handleVoiceNote = (audioBlob: Blob, transcription: string, duration = 0) => {
    const audioUrl = URL.createObjectURL(audioBlob)
    persist((current) => ({
      ...current,
      notes: [
        ...current.notes,
        {
          id: nextNumericId(current.notes),
          title: clipTitle(transcription || "Voice note", 30),
          content: transcription,
          createdAt: new Date().toISOString(),
          voiceNote: {
            audioUrl,
            transcription,
            duration,
          },
        },
      ],
    }))
  }

  const handleSpeechToText = (text: string) => {
    persist((current) => ({
      ...current,
      notes: [
        ...current.notes,
        {
          id: nextNumericId(current.notes),
          title: clipTitle(text, 30),
          content: text,
          createdAt: new Date().toISOString(),
        },
      ],
    }))
  }

  const handleVoiceTask = (text: string) => {
    persist((current) => ({
      ...current,
      tasks: [
        ...current.tasks,
        {
          id: nextNumericId(current.tasks),
          title: clipTitle(text, 50),
          completed: false,
          priority: "medium",
          dueDate: localDateKey(),
          description: text,
          recurring: "none",
          reminders: false,
        },
      ],
    }))
  }

  const completedTasksCount = tasks.filter((task) => task.completed).length
  const pendingTasksCount = tasks.filter((task) => !task.completed).length
  const query = searchQuery.toLowerCase()
  const filteredTasks = tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(query) || task.description?.toLowerCase().includes(query),
  )
  const filteredNotes = notes.filter(
    (note) => note.title.toLowerCase().includes(query) || note.content.toLowerCase().includes(query),
  )
  const filteredHabits = habits.filter(
    (habit) => habit.name.toLowerCase().includes(query) || habit.description?.toLowerCase().includes(query),
  )

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading your workspace…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 pb-28">
      <ClipboardMonitor
        onCreateTask={handleClipboardTask}
        onCreateNote={handleClipboardNote}
        enabled={workspace.settings.privacy.clipboardMonitor}
      />

      {loadStatus === "corrupt" && (
        <Card className="mb-4 border-destructive/40 bg-destructive/10 p-4">
          <p className="font-medium text-destructive">This workspace looks damaged.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            The original bytes were copied to {quarantineKey ?? "a quarantine key"}. Reset to start writing again.
            Existing data was not overwritten.
          </p>
          <Button className="mt-3" variant="destructive" onClick={() => resetCorrupt()}>
            Reset workspace
          </Button>
        </Card>
      )}

      {dropped.tasks + dropped.notes + dropped.habits > 0 && (
        <Card className="mb-4 border-orange-500/30 bg-orange-500/10 p-4">
          <p className="text-sm">
            Skipped {dropped.tasks} invalid task{dropped.tasks === 1 ? "" : "s"}
            {dropped.notes ? `, ${dropped.notes} notes` : ""}
            {dropped.habits ? `, ${dropped.habits} habits` : ""}. Valid rows were kept.
          </p>
        </Card>
      )}

      <div className="mb-6 pt-2 sm:mb-8 sm:pt-4">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="modern-card rounded-2xl h-10 w-10 sm:h-12 sm:w-12"
              onClick={() => setProfileModal(true)}
              aria-label="Open profile"
            >
              <User className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-sans">Hello, {userName}</h1>
              <p className="text-muted-readable font-serif text-xs sm:text-sm">
                Local workspace on this device. Export if you want a backup.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="modern-card rounded-2xl h-10 w-10 sm:h-12 sm:w-12"
            onClick={() => setSettingsModal(true)}
            aria-label="Open settings"
          >
            <Settings className="h-5 w-5 sm:h-6 sm:w-6" />
          </Button>
        </div>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button onClick={() => setTaskModal({ isOpen: true, mode: "create" })} className="rounded-2xl h-12 sm:h-11">
            <Plus className="h-4 w-4 mr-2" />
            Add task
          </Button>
          <div className="grid grid-cols-2 sm:flex gap-2 flex-1">
            <Button variant="outline" className="rounded-xl bg-transparent" onClick={() => setNoteModal({ isOpen: true, mode: "create" })}>
              <StickyNote className="h-4 w-4 mr-2" />
              Note
            </Button>
            <Button variant="outline" className="rounded-xl bg-transparent" onClick={() => setHabitModal({ isOpen: true, mode: "create" })}>
              <Activity className="h-4 w-4 mr-2" />
              Habit
            </Button>
          </div>
        </div>

        <div className="mb-4 hidden sm:grid grid-cols-4 lg:grid-cols-6 gap-2">
          <Button variant="ghost" className="modern-card rounded-xl h-14 flex-col gap-1" onClick={() => setHabitDashboard(true)}>
            <Activity className="h-4 w-4" />
            <span className="text-xs">Habits</span>
          </Button>
          <Button variant="ghost" className="modern-card rounded-xl h-14 flex-col gap-1" onClick={() => setGoalManagerModal(true)}>
            <Target className="h-4 w-4" />
            <span className="text-xs">Goals</span>
          </Button>
          <Button variant="ghost" className="modern-card rounded-xl h-14 flex-col gap-1" onClick={() => setTimeTrackerModal(true)}>
            <Clock className="h-4 w-4" />
            <span className="text-xs">Time</span>
          </Button>
          <Button variant="ghost" className="modern-card rounded-xl h-14 flex-col gap-1" onClick={() => setFocusModal(true)}>
            <Zap className="h-4 w-4" />
            <span className="text-xs">Focus</span>
          </Button>
          <Button variant="ghost" className="modern-card rounded-xl h-14 flex-col gap-1" onClick={() => setShareModal(true)}>
            <Share2 className="h-4 w-4" />
            <span className="text-xs">Share</span>
          </Button>
          <Button variant="ghost" className="modern-card rounded-xl h-14 flex-col gap-1" onClick={() => setAnalyticsModal(true)}>
            <BarChart3 className="h-4 w-4" />
            <span className="text-xs">Counts</span>
          </Button>
        </div>

        <div className="relative mb-4 sm:mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks, notes, and habits..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="pl-10 rounded-xl sm:rounded-2xl bg-card/95"
          />
        </div>
      </div>

      <div className="mb-10">
        {currentView === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <button type="button" className="text-left" onClick={() => setCurrentView("tasks")}>
                <Card className="modern-card p-4">
                  <p className="text-2xl font-bold">{pendingTasksCount}</p>
                  <p className="text-xs text-muted-readable">Pending</p>
                </Card>
              </button>
              <button type="button" className="text-left" onClick={() => setCurrentView("tasks")}>
                <Card className="modern-card p-4">
                  <p className="text-2xl font-bold">{completedTasksCount}</p>
                  <p className="text-xs text-muted-readable">Done</p>
                </Card>
              </button>
              <button type="button" className="text-left" onClick={() => setCurrentView("habits")}>
                <Card className="modern-card p-4">
                  <p className="text-2xl font-bold">{habits.filter((habit) => habit.completedToday).length}/{habits.length}</p>
                  <p className="text-xs text-muted-readable">Habits today</p>
                </Card>
              </button>
              <button type="button" className="text-left" onClick={() => setCurrentView("notes")}>
                <Card className="modern-card p-4">
                  <p className="text-2xl font-bold">{notes.length}</p>
                  <p className="text-xs text-muted-readable">Notes</p>
                </Card>
              </button>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4">Recent tasks</h3>
              {tasks.length === 0 ? (
                <EmptyState
                  title="Nothing on your plate yet"
                  description="Add one task. It stays on this device after refresh. There is no cloud backup until you export."
                  actionLabel="Add task"
                  onAction={() => setTaskModal({ isOpen: true, mode: "create" })}
                />
              ) : (
                <div className="space-y-3">
                  {tasks.slice(0, 5).map((task) => (
                    <Card key={task.id} className="modern-card p-4">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleTaskToggle(task.id)}
                          aria-label={task.completed ? `Mark ${task.title} incomplete` : `Complete ${task.title}`}
                        >
                          {task.completed ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5" />}
                        </Button>
                        <div className="flex-1">
                          <p className={task.completed ? "line-through text-muted-readable" : ""}>{task.title}</p>
                          <p className="text-xs text-muted-readable">{formatDueDate(task.dueDate, dateFormat)}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setTaskModal({ isOpen: true, mode: "edit", task })}
                          aria-label={`Edit ${task.title}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === "tasks" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">Tasks</h3>
              <div className="flex gap-2">
                <Button variant="outline" className="bg-transparent" onClick={() => setIsSelectionMode((value) => !value)}>
                  <CheckSquare className="h-4 w-4 mr-2" />
                  {isSelectionMode ? "Done" : "Select"}
                </Button>
                <Button onClick={() => setTaskModal({ isOpen: true, mode: "create" })}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add task
                </Button>
              </div>
            </div>
            {isSelectionMode && selectedTasks.length > 0 && (
              <Button onClick={() => setShareModal(true)}>Share selected ({selectedTasks.length})</Button>
            )}
            {filteredTasks.length === 0 ? (
              <EmptyState
                title={searchQuery ? "No matching tasks" : "No tasks yet"}
                description={searchQuery ? "Try a different search." : "Create a task. It will still be here after refresh."}
                actionLabel={searchQuery ? undefined : "Add task"}
                onAction={searchQuery ? undefined : () => setTaskModal({ isOpen: true, mode: "create" })}
              />
            ) : (
              filteredTasks.map((task) => (
                <Card key={task.id} className="p-4">
                  <div className="flex items-center gap-3">
                    {isSelectionMode && (
                      <input
                        type="checkbox"
                        checked={selectedTasks.includes(task.id)}
                        onChange={() =>
                          setSelectedTasks((current) =>
                            current.includes(task.id) ? current.filter((id) => id !== task.id) : [...current, task.id],
                          )
                        }
                        aria-label={`Select ${task.title}`}
                      />
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleTaskToggle(task.id)}
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
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setTaskModal({ isOpen: true, mode: "edit", task })}
                      aria-label={`Edit ${task.title}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {currentView === "notes" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">Notes</h3>
              <Button onClick={() => setNoteModal({ isOpen: true, mode: "create" })}>
                <Plus className="h-4 w-4 mr-2" />
                Add note
              </Button>
            </div>
            {filteredNotes.length === 0 ? (
              <EmptyState
                title={searchQuery ? "No matching notes" : "No notes yet"}
                description={searchQuery ? "Nothing matches that search." : "Capture a thought. It is saved locally."}
                actionLabel={searchQuery ? undefined : "Add note"}
                onAction={searchQuery ? undefined : () => setNoteModal({ isOpen: true, mode: "create" })}
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredNotes.map((note) => (
                  <Card key={note.id} className="p-4 cursor-pointer" onClick={() => setNoteModal({ isOpen: true, mode: "edit", note })}>
                    <h4 className="font-semibold truncate">{note.title}</h4>
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{note.content}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{formatTimestamp(note.createdAt, dateFormat)}</p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {currentView === "habits" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">Habits</h3>
              <Button onClick={() => setHabitModal({ isOpen: true, mode: "create" })}>
                <Plus className="h-4 w-4 mr-2" />
                Add habit
              </Button>
            </div>
            {filteredHabits.length === 0 ? (
              <EmptyState
                title={searchQuery ? "No matching habits" : "No habits yet"}
                description={searchQuery ? "Nothing matches that search." : "Track one daily action. Completions reset at local midnight."}
                actionLabel={searchQuery ? undefined : "Add habit"}
                onAction={searchQuery ? undefined : () => setHabitModal({ isOpen: true, mode: "create" })}
              />
            ) : (
              filteredHabits.map((habit) => (
                <Card key={habit.id} className="p-4">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleHabitToggle(habit.id)}
                      aria-label={habit.completedToday ? `Unmark ${habit.name} for today` : `Complete ${habit.name} today`}
                    >
                      {habit.completedToday ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5" />}
                    </Button>
                    <div className="flex-1">
                      <p>{habit.name}</p>
                      <p className="text-xs text-muted-foreground">Streak {habit.streak}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setHabitModal({ isOpen: true, mode: "edit", habit })}
                      aria-label={`Edit ${habit.name}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur sm:hidden">
        <div className="grid grid-cols-4">
          {(
            [
              ["overview", "Home", BarChart3],
              ["tasks", "Tasks", CheckSquare],
              ["notes", "Notes", FileText],
              ["habits", "Habits", Activity],
            ] as const
          ).map(([view, label, Icon]) => (
            <button
              key={view}
              type="button"
              className={`flex flex-col items-center gap-1 py-3 text-xs ${currentView === view ? "text-primary" : "text-muted-foreground"}`}
              onClick={() => setCurrentView(view)}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </nav>

      <div className="hidden sm:block fixed bottom-6 right-4 sm:bottom-8 sm:right-8 z-50">
        <FloatingToggle
          tasks={tasks}
          notes={notes}
          onTaskToggle={handleTaskToggle}
          onAddTask={() => setTaskModal({ isOpen: true, mode: "create" })}
          onAddNote={() => setNoteModal({ isOpen: true, mode: "create" })}
          onEditTask={(task) => setTaskModal({ isOpen: true, mode: "edit", task })}
          onEditNote={(note) => setNoteModal({ isOpen: true, mode: "edit", note })}
          onVoiceNote={handleVoiceNote}
          onSpeechToText={handleSpeechToText}
          onCreateTaskFromVoice={handleVoiceTask}
        />
      </div>

      <TaskModal
        isOpen={taskModal.isOpen}
        onClose={() => setTaskModal({ isOpen: false, mode: "create" })}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        task={taskModal.task}
        mode={taskModal.mode}
      />
      <NoteModal
        isOpen={noteModal.isOpen}
        onClose={() => setNoteModal({ isOpen: false, mode: "create" })}
        onSave={handleSaveNote}
        onDelete={handleDeleteNote}
        note={noteModal.note}
        mode={noteModal.mode}
      />
      <HabitModal
        isOpen={habitModal.isOpen}
        onClose={() => setHabitModal({ isOpen: false, mode: "create" })}
        onSave={handleSaveHabit}
        onDelete={handleDeleteHabit}
        habit={habitModal.habit}
        mode={habitModal.mode}
      />
      <ShareModal
        isOpen={shareModal}
        onClose={() => setShareModal(false)}
        tasks={isSelectionMode && selectedTasks.length > 0 ? tasks.filter((task) => selectedTasks.includes(task.id)) : tasks}
        userName={userName}
      />
      <HabitDashboard
        isOpen={habitDashboard}
        onClose={() => setHabitDashboard(false)}
        habits={habits}
        onHabitToggle={handleHabitToggle}
        onAddHabit={() => setHabitModal({ isOpen: true, mode: "create" })}
        onEditHabit={(habit) => setHabitModal({ isOpen: true, mode: "edit", habit })}
      />
      <FocusModal
        isOpen={focusModal}
        onClose={() => setFocusModal(false)}
        workspace={workspace}
        persist={persist}
      />
      <ProfileModal
        isOpen={profileModal}
        onClose={() => setProfileModal(false)}
        stats={{ tasksCompleted: completedTasksCount, habitsTracked: habits.length }}
        onProfileChange={(profile) => persist((current) => ({ ...current, profile }))}
      />
      <SettingsModal isOpen={settingsModal} onClose={() => setSettingsModal(false)} />
      <AnalyticsDashboard isOpen={analyticsModal} onClose={() => setAnalyticsModal(false)} tasks={tasks} habits={habits} />
      <TimeTracker isOpen={timeTrackerModal} onClose={() => setTimeTrackerModal(false)} workspace={workspace} persist={persist} />
      <GoalManager isOpen={goalManagerModal} onClose={() => setGoalManagerModal(false)} workspace={workspace} persist={persist} />
    </div>
  )
}
