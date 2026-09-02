"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Settings,
  User,
  Plus,
  FileText,
  CheckSquare,
  Search,
  StickyNote,
  Activity,
  Home,
  Download,
  LayoutGrid,
  MessageCircle,
} from "lucide-react"
import { ChatComposer } from "@/components/chat-composer"
import { PairingSheet } from "@/components/pairing-sheet"
import { MobileSheet } from "@/components/mobile-sheet"
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
import { HomeFeed } from "@/components/workspace/home-feed"
import { TaskList } from "@/components/workspace/task-list"
import { NoteList } from "@/components/workspace/note-list"
import { HabitList } from "@/components/workspace/habit-list"
import { ChatsView } from "@/components/workspace/chats-view"
import { HermesWordmark } from "@/components/hermes-wordmark"
import type { Habit, LabelKind, Note, Task, TaskStatus, WorkspaceLabel } from "@/lib/domain/types"
import { taskStatus, withTaskStatus } from "@/lib/tasks/board"
import { attachUnknownTokensAsTags, parseAtTokens, uniqueLabelIds, upsertLabel } from "@/lib/labels/book"
import { labelColor, nextLabelColor } from "@/lib/labels/palette"
import { togglePinned } from "@/lib/notes/organize"
import { matchesLabelSearch } from "@/lib/labels/query"
import { useWorkspace } from "@/lib/store/use-workspace"
import { allocateEntityId, browserStorage } from "@/lib/store/workspace"
import { PAIRING_CHANGED_EVENT, loadPairing } from "@/lib/pairing/pairing"
import { dueFollowUps, nudgeFollowUp } from "@/lib/tasks/follow-up"
import { FollowUpSection } from "@/components/workspace/follow-up-section"
import { recordBrowserEvent } from "@/lib/analytics/local-events"
import { isTaskDueTodayOrOverdue, localDateKey, normalizeDueDate } from "@/lib/dates/due-date"
import { isHabitScheduledOn } from "@/lib/habits/schedule"
import { hydrateHabit, toggleHabitOnDate } from "@/lib/habits/streak"
import { completeRecurringTask } from "@/lib/reminders/due"
import { useLocalReminders } from "@/lib/reminders/use-local-reminders"
import { createIndexedDbVoiceStore, deleteVoice, putVoice, voiceRef } from "@/lib/media/voice-store"
import {
  parseWorkspaceSearch,
  serializeWorkspaceSearch,
  workspaceViewTitle,
  type WorkspaceView,
} from "@/lib/navigation/workspace-url"
import {
  COMPOSER_OPEN_EVENT,
  DIALER_CHANGED_EVENT,
  chatListItems,
  createEmptyDialer,
  loadDialer,
  visibleSessions,
} from "@/lib/dialer/dialer"
import type { ComposerOpenDetail, DialerState } from "@/lib/dialer/types"
import { getCompanionRuntime, subscribeCompanionRuntime } from "@/lib/hermes/runtime"
import { filterTasks, type TaskListFilter } from "@/lib/tasks/filter"
import {
  homeGreeting,
  showComposerDock,
  showDesktopSidebar,
  showGlobalCreateRow,
  showMobileTabBar,
  showViewSupport,
  showWorkspaceExport,
  showWorkspaceSearch,
  workspaceNavItems,
  workspaceSearchPlaceholder,
} from "@/lib/ui/home-chrome"
import { agentDayBriefing, homeAgents, homeRuntimeSignals, pickHomeSpotlight } from "@/lib/ui/home-feed"
import { shouldStageHomeBall } from "@/lib/ui/orb-gesture"

function clipTitle(content: string, limit: number) {
  return content.length > limit ? `${content.slice(0, limit).trim()}…` : content.trim()
}

const WORKSPACE_TAB_ICONS = {
  overview: Home,
  tasks: CheckSquare,
  notes: FileText,
  chats: MessageCircle,
  habits: Activity,
} as const

function workspaceViewSupport(view: WorkspaceView, greeting: string): string {
  switch (view) {
    case "overview":
      return `${greeting}. Local workspace on this device. Export if you want a backup.`
    case "tasks":
      return "Board, list, and follow-ups stay on this device."
    case "notes":
      return "Pinned notes, labels, and Ask stay on this device."
    case "chats":
      return "Pair a machine, then message an agent from here."
    case "habits":
      return "Streaks and schedules stay on this device."
    default: {
      const _exhaustive: never = view
      throw new Error(`Unhandled workspace view: ${_exhaustive}`)
    }
  }
}

interface DashboardProps {
  initialSearch: ReturnType<typeof parseWorkspaceSearch>
}

export function Dashboard({ initialSearch }: DashboardProps) {
  const { workspace, persist, hydrated, loadStatus, quarantineKey, dropped, resetCorrupt } = useWorkspace()
  const tasks = workspace.tasks
  const notes = workspace.notes
  const habits = workspace.habits
  const userName = workspace.profile.name
  const greeting = homeGreeting(userName)
  const dateFormat = workspace.settings.general.dateFormat

  useLocalReminders(workspace, persist, hydrated)

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
  const [moreToolsOpen, setMoreToolsOpen] = useState(false)
  const [pairingOpen, setPairingOpen] = useState(false)
  const [viewportWidth, setViewportWidth] = useState(320)
  const [dialer, setDialer] = useState<DialerState>(createEmptyDialer)
  const [runtime, setRuntime] = useState(getCompanionRuntime)

  const weekStartsOn = workspace.settings.general.weekStartsOn
  const todayKey = localDateKey()
  const [pairedMachineCount, setPairedMachineCount] = useState(0)

  useEffect(() => {
    const reload = () => {
      const storage = browserStorage()
      setPairedMachineCount(loadPairing(storage).machines.length)
      setDialer(loadDialer(storage))
    }
    reload()
    window.addEventListener(PAIRING_CHANGED_EVENT, reload)
    window.addEventListener(DIALER_CHANGED_EVENT, reload)
    window.addEventListener("storage", reload)
    return () => {
      window.removeEventListener(PAIRING_CHANGED_EVENT, reload)
      window.removeEventListener(DIALER_CHANGED_EVENT, reload)
      window.removeEventListener("storage", reload)
    }
  }, [])

  useEffect(() => subscribeCompanionRuntime(setRuntime), [])

  useEffect(() => {
    const updateWidth = () => setViewportWidth(window.innerWidth)
    updateWidth()
    window.addEventListener("resize", updateWidth)
    return () => window.removeEventListener("resize", updateWidth)
  }, [])

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

  const handleSetTaskStatus = (taskId: number, status: TaskStatus) => {
    persist((current) => {
      const existing = current.tasks.find((task) => task.id === taskId)
      if (!existing) {
        return current
      }
      if (status === "done" && !existing.completed) {
        const allocated = allocateEntityId(current)
        const { completed, next } = completeRecurringTask(withTaskStatus(existing, "done"), allocated.id)
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
        tasks: current.tasks.map((task) => (task.id === taskId ? withTaskStatus(task, status) : task)),
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

  const handleTogglePin = (noteId: number) => {
    persist((current) => ({
      ...current,
      notes: current.notes.map((note) => (note.id === noteId ? togglePinned(note) : note)),
    }))
  }

  const handleCycleLabelColor = (labelId: number) => {
    persist((current) => ({
      ...current,
      labels: (current.labels ?? []).map((label) =>
        label.id === labelId ? { ...label, color: nextLabelColor(labelColor(label)) } : label,
      ),
    }))
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

  const handleNudgeFollowUp = (taskId: number) => {
    persist((current) => ({
      ...current,
      tasks: current.tasks.map((task) => (task.id === taskId ? nudgeFollowUp(task) : task)),
    }))
  }

  const completedTasksCount = tasks.filter((task) => task.completed).length
  const doingTasksCount = tasks.filter((task) => taskStatus(task) === "doing").length
  const followUpsDue = dueFollowUps(tasks)
  const todayTasks = tasks.filter((task) => isTaskDueTodayOrOverdue(task.dueDate, task.completed))
  const homeChats = chatListItems(dialer)
  const homeAgentList = homeAgents(visibleSessions(dialer))
  const runtimeSignals = homeRuntimeSignals(runtime, homeChats)
  const briefAgent = homeAgentList[0]
  const dayBriefing = agentDayBriefing({
    thinkingTitle: runtimeSignals.thinkingTitle,
    approvalTitle: runtimeSignals.approvalTitle,
    doingCount: doingTasksCount,
    todayCount: todayTasks.length,
    paired: pairedMachineCount > 0,
    agentTitle: briefAgent?.title,
    agentIsDemo: briefAgent?.source === "demo",
  })
  const homeSpotlight = pickHomeSpotlight({
    chats: homeChats,
    tasks,
    todayTasks,
    busyChatId: runtimeSignals.busyChatId,
    busyDetail: runtimeSignals.busyDetail,
    approvalChatId: runtimeSignals.approvalChatId,
  })
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

  const selectView = (view: WorkspaceView) => {
    setCurrentView(view)
    if (view === "chats") {
      setChatSession("")
    }
  }

  const openChat = (sessionId: string) => {
    setCurrentView("chats")
    setChatSession(sessionId)
  }

  return (
    <div className="mk-workspace">
      <nav
        className="mk-desktop-nav"
        aria-label="Workspace sections"
        aria-hidden={!showDesktopSidebar(viewportWidth)}
      >
        <HermesWordmark className="mb-4 mt-1" />
        {workspaceNavItems().map(([view, label]) => {
          const Icon = WORKSPACE_TAB_ICONS[view]
          return (
            <button
              key={view}
              type="button"
              aria-label={label}
              aria-current={currentView === view ? "page" : undefined}
              onClick={() => selectView(view)}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          )
        })}
      </nav>
      <div className="mk-bottom-chrome-probe" data-mk-bottom-chrome="" aria-hidden />
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

      <header className="mk-workspace-header pt-1 sm:pt-3">
        <div className="flex items-start justify-between gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="modern-card rounded-2xl"
            onClick={() => setProfileModal(true)}
            aria-label="Open profile"
          >
            <User className="h-5 w-5" />
          </Button>
          <HermesWordmark />
          <div className="flex shrink-0 items-center gap-2">
            {showWorkspaceExport(currentView) ? (
              <Button
                variant="outline"
                size="icon"
                className="rounded-2xl bg-transparent sm:w-auto sm:px-4"
                onClick={() => setShareModal(true)}
                aria-label="Export workspace"
              >
                <Download className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            ) : null}
            {currentView === "overview" ? (
              <Button
                variant="ghost"
                size="icon"
                className="modern-card rounded-2xl"
                onClick={() => setMoreToolsOpen(true)}
                aria-label="More"
              >
                <LayoutGrid className="h-5 w-5" />
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="icon"
              className="modern-card rounded-2xl"
              onClick={() => setSettingsModal(true)}
              aria-label="Open settings"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="min-w-0">
          {currentView === "overview" ? (
            <>
              <h1 className="mk-home-kicker">Today</h1>
              <div className="mk-home-briefing" aria-label="Today from your agent">
                {dayBriefing.split("\n\n").map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                <div className="mk-home-briefing-actions">
                  <Button
                    type="button"
                    className="mk-touch rounded-2xl"
                    onClick={() => setTaskModal({ isOpen: true, mode: "create" })}
                  >
                    Add a task
                  </Button>
                  {pairedMachineCount === 0 ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="mk-touch rounded-2xl bg-transparent"
                      onClick={() => setPairingOpen(true)}
                    >
                      Pair a machine
                    </Button>
                  ) : null}
                  {briefAgent ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="mk-touch rounded-2xl bg-transparent"
                      onClick={() => openChat(briefAgent.id)}
                    >
                      Ask {briefAgent.title}
                    </Button>
                  ) : null}
                </div>
              </div>
            </>
          ) : (
            <>
              <h1 className="sr-only">{workspaceViewTitle(currentView)}</h1>
              {showViewSupport(currentView) ? (
                <p className="mk-section-support">{workspaceViewSupport(currentView, greeting)}</p>
              ) : null}
            </>
          )}
        </div>

        {showGlobalCreateRow(currentView) ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button onClick={() => setTaskModal({ isOpen: true, mode: "create" })} className="w-full rounded-2xl sm:w-auto">
            <Plus className="h-4 w-4" />
            Add task
          </Button>
          <div className="grid flex-1 grid-cols-2 gap-2">
            <Button variant="outline" className="rounded-xl bg-transparent" onClick={() => setNoteModal({ isOpen: true, mode: "create" })}>
              <StickyNote className="h-4 w-4" />
              Note
            </Button>
            <Button variant="outline" className="rounded-xl bg-transparent" onClick={() => setHabitModal({ isOpen: true, mode: "create" })}>
              <Activity className="h-4 w-4" />
              Habit
            </Button>
          </div>
        </div>
        ) : null}

        {showWorkspaceSearch(currentView) ? (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="workspace-search"
            placeholder={workspaceSearchPlaceholder(currentView)}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="rounded-xl bg-card/95 pl-10 sm:rounded-2xl"
            aria-label={workspaceSearchPlaceholder(currentView)}
          />
        </div>
        ) : null}
      </header>

      <main className="mb-10">
        {currentView === "overview" && (
          <div className="space-y-6">
            <HomeFeed
              agents={homeAgentList}
              chats={homeChats}
              tasks={tasks}
              notes={notes}
              habits={habits}
              spotlight={homeSpotlight}
              onOpenAgent={openChat}
              onOpenChat={openChat}
              onOpenTask={(task) => setTaskModal({ isOpen: true, mode: "edit", task })}
              onOpenNote={(note) => setNoteModal({ isOpen: true, mode: "edit", note })}
              onOpenHabit={(habit) => setHabitModal({ isOpen: true, mode: "edit", habit })}
              onOpenView={selectView}
            />

            <FollowUpSection tasks={followUpsDue} onToggleTask={handleTaskToggle} onNudge={handleNudgeFollowUp} />
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
            onSetTaskStatus={handleSetTaskStatus}
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
            onTogglePin={handleTogglePin}
            onCycleLabelColor={handleCycleLabelColor}
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
      </main>

      <nav
        className="mk-bottom-chrome"
        aria-label="Workspace sections"
        aria-hidden={!showMobileTabBar(viewportWidth)}
      >
        <div className="mk-pill-nav">
          {workspaceNavItems().map(([view, label]) => {
            const Icon = WORKSPACE_TAB_ICONS[view]
            return (
              <button
                key={view}
                type="button"
                aria-label={label}
                aria-current={currentView === view ? "page" : undefined}
                onClick={() => selectView(view)}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      <FloatingToggle
        onAddTask={() => setTaskModal({ isOpen: true, mode: "create" })}
        onAddNote={() => setNoteModal({ isOpen: true, mode: "create" })}
        onVoiceNote={handleVoiceNote}
        onCreateTaskFromVoice={handleVoiceTask}
        suppressed={composerExpanded || currentView === "chats"}
        stage={shouldStageHomeBall(currentView, viewportWidth) ? "home" : "edge"}
      />

      {showComposerDock(currentView) ? (
        <ChatComposer
          onVoice={() => setVoiceRecorderOpen(true)}
          onExpandedChange={setComposerExpanded}
          preferredTarget={chatSession || undefined}
        />
      ) : null}
      <PairingSheet open={pairingOpen} onClose={() => setPairingOpen(false)} />

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
      <MobileSheet open={moreToolsOpen} onClose={() => setMoreToolsOpen(false)} title="More">
        <div className="grid gap-2">
          <Button variant="outline" className="mk-touch justify-start bg-transparent" onClick={() => { setMoreToolsOpen(false); setHabitDashboard(true) }}>
            Habits dashboard
          </Button>
          <Button variant="outline" className="mk-touch justify-start bg-transparent" onClick={() => { setMoreToolsOpen(false); setGoalManagerModal(true) }}>
            Goals
          </Button>
          <Button variant="outline" className="mk-touch justify-start bg-transparent" onClick={() => { setMoreToolsOpen(false); setTimeTrackerModal(true) }}>
            Time
          </Button>
          <Button variant="outline" className="mk-touch justify-start bg-transparent" onClick={() => { setMoreToolsOpen(false); setFocusModal(true) }}>
            Focus
          </Button>
          <Button variant="outline" className="mk-touch justify-start bg-transparent" onClick={() => { setMoreToolsOpen(false); setShareModal(true) }}>
            Share
          </Button>
          <Button variant="outline" className="mk-touch justify-start bg-transparent" onClick={() => { setMoreToolsOpen(false); setAnalyticsModal(true) }}>
            Counts
          </Button>
        </div>
      </MobileSheet>
      <SettingsModal isOpen={settingsModal} onClose={() => setSettingsModal(false)} />
      <AnalyticsDashboard isOpen={analyticsModal} onClose={() => setAnalyticsModal(false)} tasks={tasks} habits={habits} />
      <TimeTracker isOpen={timeTrackerModal} onClose={() => setTimeTrackerModal(false)} workspace={workspace} persist={persist} />
      <GoalManager isOpen={goalManagerModal} onClose={() => setGoalManagerModal(false)} workspace={workspace} persist={persist} />
    </div>
  )
}
