"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Target,
  Settings,
  User,
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
  Home,
  Download,
  MessageCircle,
} from "lucide-react"
import { ChatComposer } from "@/components/chat-composer"
import { FloatingToggle } from "@/components/floating-toggle"
import { TaskModal } from "@/components/task-modal"
import { NoteModal, type NoteSaveExtras } from "@/components/note-modal"
import { VoiceRecorder } from "@/components/voice-recorder"
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
import { TodaySection } from "@/components/workspace/today-section"
import { TaskList } from "@/components/workspace/task-list"
import { NoteList } from "@/components/workspace/note-list"
import { HabitList } from "@/components/workspace/habit-list"
import { ChatsView } from "@/components/workspace/chats-view"
import type { Habit, LabelKind, Note, Task, WorkspaceLabel } from "@/lib/domain/types"
import { attachUnknownTokensAsTags, parseAtTokens, uniqueLabelIds, upsertLabel } from "@/lib/labels/book"
import { matchesLabelSearch } from "@/lib/labels/query"
import { useWorkspace } from "@/lib/store/use-workspace"
import { allocateEntityId } from "@/lib/store/workspace"
import { recordBrowserEvent } from "@/lib/analytics/local-events"
import { isTaskDueTodayOrOverdue, localDateKey, normalizeDueDate } from "@/lib/dates/due-date"
import { isHabitScheduledOn } from "@/lib/habits/schedule"
import { hydrateHabit, toggleHabitOnDate } from "@/lib/habits/streak"
import { completeRecurringTask } from "@/lib/reminders/due"
import { useLocalReminders } from "@/lib/reminders/use-local-reminders"
import { createIndexedDbVoiceStore, deleteVoice, putVoice, voiceRef } from "@/lib/media/voice-store"
import { parseWorkspaceSearch, serializeWorkspaceSearch, type WorkspaceView } from "@/lib/navigation/workspace-url"
import { COMPOSER_OPEN_EVENT } from "@/lib/dialer/dialer"
import type { ComposerOpenDetail } from "@/lib/dialer/types"
import { filterTasks, type TaskListFilter } from "@/lib/tasks/filter"

function clipTitle(content: string, limit: number) {
  return content.length > limit ? `${content.slice(0, limit).trim()}…` : content.trim()
}

export default function Dashboard() {
  const { workspace, persist, hydrated, loadStatus, quarantineKey, dropped, resetCorrupt } = useWorkspace()
  const tasks = workspace.tasks
  const notes = workspace.notes
  const habits = workspace.habits
  const userName = workspace.profile.name
  const greeting = userName.trim() && userName.trim() !== "User" ? `Hello, ${userName}` : "Your workspace"
  const dateFormat = workspace.settings.general.dateFormat

  useLocalReminders(workspace, persist, hydrated)

  const initialSearch =
    typeof window === "undefined"
      ? { view: "overview" as const, q: "", filter: "all" as const, session: "" }
      : parseWorkspaceSearch(window.location.search)
  const [currentView, setCurrentView] = useState<WorkspaceView>(initialSearch.view)
  const [searchQuery, setSearchQuery] = useState(initialSearch.q)
  const [taskFilter, setTaskFilter] = useState<TaskListFilter>(initialSearch.filter)
  const [chatSession, setChatSession] = useState(initialSearch.session)
  const [composerExpanded, setComposerExpanded] = useState(false)
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
  const [voiceRecorderOpen, setVoiceRecorderOpen] = useState(false)

  const weekStartsOn = workspace.settings.general.weekStartsOn
  const todayKey = localDateKey()

  useEffect(() => {
    const next = serializeWorkspaceSearch(currentView, searchQuery, taskFilter, chatSession)
    window.history.replaceState(null, "", `${window.location.pathname}${next}`)
  }, [currentView, searchQuery, taskFilter, chatSession])

  useEffect(() => {
    const onComposer = (event: Event) => {
      const detail = (event as CustomEvent<ComposerOpenDetail>).detail
      if (detail?.openTab) {
        setCurrentView("chats")
        if (detail.target) {
          setChatSession(detail.target)
        }
      }
    }
    window.addEventListener(COMPOSER_OPEN_EVENT, onComposer)
    return () => window.removeEventListener(COMPOSER_OPEN_EVENT, onComposer)
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typing = target?.closest("input, textarea, select, [contenteditable=true]")
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        document.getElementById("workspace-search")?.focus()
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "n" && !typing) {
        event.preventDefault()
        setTaskModal({ isOpen: true, mode: "create" })
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const handleTaskToggle = (taskId: number) => {
    persist((current) => {
      const existing = current.tasks.find((task) => task.id === taskId)
      if (!existing) {
        return current
      }
      if (!existing.completed) {
        const allocated = allocateEntityId(current)
        const { completed, next } = completeRecurringTask(existing, allocated.id)
        return {
          ...allocated.workspace,
          tasks: [
            ...allocated.workspace.tasks.map((task) => (task.id === taskId ? completed : task)),
            ...(next ? [next] : []),
          ],
        }
      }
      return {
        ...current,
        tasks: current.tasks.map((task) => (task.id === taskId ? { ...task, completed: false } : task)),
      }
    })
  }

  const upsertWorkspaceLabel = (name: string, kind: LabelKind): WorkspaceLabel => {
    let created: WorkspaceLabel | undefined
    persist((current) => {
      let nextId = current.nextEntityId
      const result = upsertLabel(current.labels ?? [], name, kind, () => nextId++)
      created = result.label
      return { ...current, labels: result.labels, nextEntityId: Math.max(nextId, current.nextEntityId) }
    })
    return created as WorkspaceLabel
  }

  const handleSaveTask = (taskData: Omit<Task, "id"> | Task) => {
    persist((current) => {
      const title = taskData.title.trim()
      const dueDate = normalizeDueDate(taskData.dueDate, new Date(), weekStartsOn)
      const allocated = "id" in taskData ? { workspace: current, id: taskData.id } : allocateEntityId(current)
      let nextId = allocated.workspace.nextEntityId
      const tagged = attachUnknownTokensAsTags(
        allocated.workspace.labels ?? [],
        parseAtTokens(`${title} ${taskData.description ?? ""}`),
        () => nextId++,
      )
      const labelIds = uniqueLabelIds(taskData.labelIds, tagged.ids)
      const nextTask = { ...taskData, title, dueDate, labelIds }
      if ("id" in taskData) {
        return {
          ...allocated.workspace,
          labels: tagged.labels,
          nextEntityId: Math.max(nextId, allocated.workspace.nextEntityId),
          tasks: allocated.workspace.tasks.map((task) => (task.id === taskData.id ? { ...task, ...nextTask } : task)),
        }
      }
      recordBrowserEvent("task_created")
      return {
        ...allocated.workspace,
        labels: tagged.labels,
        nextEntityId: Math.max(nextId, allocated.workspace.nextEntityId),
        tasks: [
          ...allocated.workspace.tasks,
          {
            ...nextTask,
            id: allocated.id,
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
      recordBrowserEvent("task_deleted")
      toast("Task deleted", {
        duration: 8000,
        action: {
          label: "Undo",
          onClick: () => persist((current) => ({ ...current, tasks: [...current.tasks, snapshot] })),
        },
      })
    }
  }

  const handleSaveNote = (noteData: Omit<Note, "id" | "createdAt"> | Note, extras?: NoteSaveExtras) => {
    let noteId = "id" in noteData ? noteData.id : 0
    persist((current) => {
      const title = noteData.title.trim()
      const allocated = "id" in noteData ? { workspace: current, id: noteData.id } : allocateEntityId(current)
      let nextId = allocated.workspace.nextEntityId
      const tagged = attachUnknownTokensAsTags(
        allocated.workspace.labels ?? [],
        parseAtTokens(`${title} ${noteData.content}`),
        () => nextId++,
      )
      const labelIds = uniqueLabelIds(noteData.labelIds, tagged.ids)
      if ("id" in noteData) {
        const voiceNote = extras?.voiceBlob
          ? {
              audioUrl: voiceRef(noteData.id),
              transcription: extras.voiceTranscription ?? noteData.voiceNote?.transcription ?? "",
              duration: extras.voiceDuration ?? noteData.voiceNote?.duration ?? 0,
            }
          : noteData.voiceNote
        noteId = noteData.id
        return {
          ...allocated.workspace,
          labels: tagged.labels,
          nextEntityId: Math.max(nextId, allocated.workspace.nextEntityId),
          notes: allocated.workspace.notes.map((note) =>
            note.id === noteData.id ? { ...noteData, title, voiceNote, labelIds } : note,
          ),
        }
      }
      noteId = allocated.id
      const voiceNote = extras?.voiceBlob
        ? {
            audioUrl: voiceRef(allocated.id),
            transcription: extras.voiceTranscription ?? "",
            duration: extras.voiceDuration ?? 0,
          }
        : noteData.voiceNote
      return {
        ...allocated.workspace,
        labels: tagged.labels,
        nextEntityId: Math.max(nextId, allocated.workspace.nextEntityId),
        notes: [
          ...allocated.workspace.notes,
          {
            ...noteData,
            id: allocated.id,
            title,
            createdAt: new Date().toISOString(),
            voiceNote,
            labelIds,
          },
        ],
      }
    })
    if (extras?.voiceBlob && noteId) {
      void putVoice(createIndexedDbVoiceStore(), noteId, extras.voiceBlob).catch(() => {
        toast.error("Could not keep the recording on this device. The words were saved without audio.")
      })
    }
  }

  const handleDeleteNote = (noteId: number) => {
    let removed: Note | undefined
    persist((current) => {
      removed = current.notes.find((note) => note.id === noteId)
      return { ...current, notes: current.notes.filter((note) => note.id !== noteId) }
    })
    if (removed) {
      const snapshot = removed
      if (snapshot.voiceNote?.audioUrl) {
        void deleteVoice(createIndexedDbVoiceStore(), snapshot.voiceNote.audioUrl)
      }
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
    const current = workspace.habits.find((habit) => habit.id === habitId)
    if (current && !isHabitScheduledOn(current, today, weekStartsOn)) {
      toast("This habit is not scheduled today.")
      return
    }
    persist((store) => ({
      ...store,
      habits: store.habits.map((habit) =>
        habit.id === habitId ? hydrateHabit(toggleHabitOnDate(habit, today, weekStartsOn), today, weekStartsOn) : habit,
      ),
    }))
  }

  const handleSaveHabit = (
    habitData: Omit<Habit, "id" | "streak" | "completed" | "completedToday" | "createdAt" | "history"> | Habit,
  ) => {
    persist((current) => {
      const customDays =
        habitData.frequency === "weekly" && (!habitData.customDays || habitData.customDays.length === 0)
          ? [weekStartsOn === "sunday" ? "Sunday" : "Monday"]
          : habitData.customDays
      const scheduled = { ...habitData, customDays }
      if ("id" in scheduled) {
        return {
          ...current,
          habits: current.habits.map((habit) =>
            habit.id === scheduled.id
              ? hydrateHabit({ ...habit, ...scheduled, name: scheduled.name.trim() }, localDateKey(), weekStartsOn)
              : habit,
          ),
        }
      }
      const allocated = allocateEntityId(current)
      return {
        ...allocated.workspace,
        habits: [
          ...allocated.workspace.habits,
          hydrateHabit(
            {
              ...scheduled,
              id: allocated.id,
              name: scheduled.name.trim(),
              streak: 0,
              completed: false,
              completedToday: false,
              createdAt: new Date().toISOString(),
              history: [],
            },
            localDateKey(),
            weekStartsOn,
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

  const handleClipboardTask = (content: string) => {
    persist((current) => {
      const allocated = allocateEntityId(current)
      return {
        ...allocated.workspace,
        tasks: [
          ...allocated.workspace.tasks,
          {
            id: allocated.id,
            title: clipTitle(content, 50),
            completed: false,
            priority: "medium",
            dueDate: localDateKey(),
            description: content.length > 50 ? content : undefined,
            recurring: "none",
            reminders: false,
          },
        ],
      }
    })
  }

  const handleClipboardNote = (content: string) => {
    persist((current) => {
      const allocated = allocateEntityId(current)
      return {
        ...allocated.workspace,
        notes: [
          ...allocated.workspace.notes,
          {
            id: allocated.id,
            title: clipTitle(content, 30),
            content,
            createdAt: new Date().toISOString(),
          },
        ],
      }
    })
  }

  const handleVoiceNote = (audioBlob: Blob, transcription: string, duration = 0) => {
    let noteId = 0
    persist((current) => {
      const allocated = allocateEntityId(current)
      noteId = allocated.id
      return {
        ...allocated.workspace,
        notes: [
          ...allocated.workspace.notes,
          {
            id: allocated.id,
            title: clipTitle(transcription || "Voice note", 30),
            content: transcription,
            createdAt: new Date().toISOString(),
            voiceNote: {
              audioUrl: voiceRef(allocated.id),
              transcription,
              duration,
            },
          },
        ],
      }
    })
    void putVoice(createIndexedDbVoiceStore(), noteId, audioBlob).catch(() => {
      toast.error("Could not keep the recording on this device. The words were saved without audio.")
    })
  }

  const handleVoiceTask = (text: string) => {
    persist((current) => {
      const allocated = allocateEntityId(current)
      recordBrowserEvent("task_created")
      return {
        ...allocated.workspace,
        tasks: [
          ...allocated.workspace.tasks,
          {
            id: allocated.id,
            title: clipTitle(text, 50),
            completed: false,
            priority: "medium",
            dueDate: localDateKey(),
            description: text,
            recurring: "none",
            reminders: false,
          },
        ],
      }
    })
  }

  const completedTasksCount = tasks.filter((task) => task.completed).length
  const pendingTasksCount = tasks.filter((task) => !task.completed).length
  const todayTasks = tasks.filter((task) => isTaskDueTodayOrOverdue(task.dueDate, task.completed))
  const todayHabits = habits.filter((habit) => isHabitScheduledOn(habit, todayKey, weekStartsOn))
  const query = searchQuery.toLowerCase()
  const searchedTasks = tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(query) ||
      task.description?.toLowerCase().includes(query) ||
      matchesLabelSearch(searchQuery, workspace.labels, task.labelIds),
  )
  const filteredTasks = filterTasks(searchedTasks, taskFilter)
  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query) ||
      matchesLabelSearch(searchQuery, workspace.labels, note.labelIds),
  )
  const filteredHabits = habits.filter(
    (habit) => habit.name.toLowerCase().includes(query) || habit.description?.toLowerCase().includes(query),
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 pb-[calc(7rem+env(safe-area-inset-bottom,0px))]">
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
        <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
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
              <h1 className="text-xl sm:text-2xl font-bold font-sans">{greeting}</h1>
              <p className="text-muted-readable font-serif text-xs sm:text-sm">
                Local workspace on this device. Export if you want a backup.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              className="rounded-2xl h-10 sm:h-12 bg-transparent"
              onClick={() => setShareModal(true)}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
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

        <div className="mb-4 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          <Button
            variant="ghost"
            className="modern-card rounded-xl h-14 flex-col gap-1"
            onClick={() => {
              setCurrentView("chats")
              setChatSession("")
            }}
          >
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs">Chats</span>
          </Button>
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
            id="workspace-search"
            placeholder="Search tasks, notes, habits, and chats..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="pl-10 rounded-xl sm:rounded-2xl bg-card/95"
            aria-label="Search workspace"
          />
        </div>
      </div>

      <div className="mb-10">
        {currentView === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <button type="button" className="text-left" onClick={() => setCurrentView("tasks")} aria-label={`${pendingTasksCount} pending tasks`}>
                <Card className="modern-card p-4">
                  <p className="text-2xl font-bold">{pendingTasksCount}</p>
                  <p className="text-xs text-muted-readable">Pending</p>
                </Card>
              </button>
              <button type="button" className="text-left" onClick={() => setCurrentView("tasks")} aria-label={`${completedTasksCount} completed tasks`}>
                <Card className="modern-card p-4">
                  <p className="text-2xl font-bold">{completedTasksCount}</p>
                  <p className="text-xs text-muted-readable">Done</p>
                </Card>
              </button>
              <button type="button" className="text-left" onClick={() => setCurrentView("habits")} aria-label={`${habits.filter((habit) => habit.completedToday).length} of ${habits.length} habits done today`}>
                <Card className="modern-card p-4">
                  <p className="text-2xl font-bold">{habits.filter((habit) => habit.completedToday).length}/{habits.length}</p>
                  <p className="text-xs text-muted-readable">Habits today</p>
                </Card>
              </button>
              <button type="button" className="text-left" onClick={() => setCurrentView("notes")} aria-label={`${notes.length} notes`}>
                <Card className="modern-card p-4">
                  <p className="text-2xl font-bold">{notes.length}</p>
                  <p className="text-xs text-muted-readable">Notes</p>
                </Card>
              </button>
            </div>

            <TodaySection
              tasks={tasks}
              todayTasks={todayTasks}
              todayHabits={todayHabits}
              labels={workspace.labels}
              dateFormat={dateFormat}
              onToggleTask={handleTaskToggle}
              onEditTask={(task) => setTaskModal({ isOpen: true, mode: "edit", task })}
              onToggleHabit={handleHabitToggle}
              onAddTask={() => setTaskModal({ isOpen: true, mode: "create" })}
            />
          </div>
        )}

        {currentView === "tasks" && (
          <TaskList
            tasks={filteredTasks}
            filter={taskFilter}
            searchQuery={searchQuery}
            labels={workspace.labels}
            dateFormat={dateFormat}
            isSelectionMode={isSelectionMode}
            selectedTasks={selectedTasks}
            onFilterChange={setTaskFilter}
            onToggleSelectionMode={() => setIsSelectionMode((value) => !value)}
            onToggleSelected={(taskId) =>
              setSelectedTasks((current) =>
                current.includes(taskId) ? current.filter((id) => id !== taskId) : [...current, taskId],
              )
            }
            onShareSelected={() => setShareModal(true)}
            onAddTask={() => setTaskModal({ isOpen: true, mode: "create" })}
            onToggleTask={handleTaskToggle}
            onEditTask={(task) => setTaskModal({ isOpen: true, mode: "edit", task })}
          />
        )}

        {currentView === "notes" && (
          <NoteList
            notes={filteredNotes}
            searchQuery={searchQuery}
            labels={workspace.labels}
            dateFormat={dateFormat}
            onAddNote={() => setNoteModal({ isOpen: true, mode: "create" })}
            onEditNote={(note) => setNoteModal({ isOpen: true, mode: "edit", note })}
            onRecordVoice={() => setVoiceRecorderOpen(true)}
          />
        )}

        {currentView === "habits" && (
          <HabitList
            habits={filteredHabits}
            searchQuery={searchQuery}
            todayKey={todayKey}
            weekStartsOn={weekStartsOn}
            onAddHabit={() => setHabitModal({ isOpen: true, mode: "create" })}
            onToggleHabit={handleHabitToggle}
            onEditHabit={(habit) => setHabitModal({ isOpen: true, mode: "edit", habit })}
          />
        )}

        {currentView === "chats" && (
          <ChatsView
            sessionId={chatSession}
            searchQuery={searchQuery}
            onOpenSession={setChatSession}
            onBack={() => setChatSession("")}
          />
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom,0px)] sm:hidden">
        <div className="grid grid-cols-5">
          {(
            [
              ["overview", "Home", Home],
              ["tasks", "Tasks", CheckSquare],
              ["notes", "Notes", FileText],
              ["chats", "Chats", MessageCircle],
              ["habits", "Habits", Activity],
            ] as const
          ).map(([view, label, Icon]) => (
            <button
              key={view}
              type="button"
              className={`flex min-h-11 flex-col items-center gap-1 py-3 text-xs ${currentView === view ? "text-primary" : "text-muted-foreground"}`}
              onClick={() => {
                setCurrentView(view)
                if (view === "chats") {
                  setChatSession("")
                }
              }}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </nav>

      <FloatingToggle
        onAddTask={() => setTaskModal({ isOpen: true, mode: "create" })}
        onAddNote={() => setNoteModal({ isOpen: true, mode: "create" })}
        onVoiceNote={handleVoiceNote}
        onCreateTaskFromVoice={handleVoiceTask}
        suppressed={composerExpanded}
      />

      <ChatComposer
        onVoice={() => setVoiceRecorderOpen(true)}
        onExpandedChange={setComposerExpanded}
        preferredTarget={chatSession || undefined}
      />

      <TaskModal
        isOpen={taskModal.isOpen}
        onClose={() => setTaskModal({ isOpen: false, mode: "create" })}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        task={taskModal.task}
        mode={taskModal.mode}
        labels={workspace.labels}
        onUpsertLabel={upsertWorkspaceLabel}
      />
      <NoteModal
        isOpen={noteModal.isOpen}
        onClose={() => setNoteModal({ isOpen: false, mode: "create" })}
        onSave={handleSaveNote}
        onDelete={handleDeleteNote}
        note={noteModal.note}
        mode={noteModal.mode}
        labels={workspace.labels}
        onUpsertLabel={upsertWorkspaceLabel}
      />
      <VoiceRecorder
        open={voiceRecorderOpen}
        onClose={() => setVoiceRecorderOpen(false)}
        onSave={(result) => {
          handleVoiceNote(result.blob, result.transcription, result.duration)
          setVoiceRecorderOpen(false)
        }}
        onSaveAsTask={(text) => {
          handleVoiceTask(text)
          setVoiceRecorderOpen(false)
        }}
      />
      <HabitModal
        isOpen={habitModal.isOpen}
        onClose={() => setHabitModal({ isOpen: false, mode: "create" })}
        onSave={handleSaveHabit}
        onDelete={handleDeleteHabit}
        habit={habitModal.habit}
        mode={habitModal.mode}
        weekStartsOn={workspace.settings.general.weekStartsOn}
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
