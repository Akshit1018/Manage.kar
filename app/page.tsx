"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  CheckCircle2,
  Circle,
  Calendar,
  Users,
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
  Monitor,
} from "lucide-react"
import { FloatingToggle } from "@/components/floating-toggle"
import { TaskModal } from "@/components/task-modal"
import { NoteModal } from "@/components/note-modal"
import { ShareModal } from "@/components/share-modal"
import { CollaborationDashboard } from "@/components/collaboration-dashboard"
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

type ViewMode = "overview" | "tasks" | "notes" | "monitor"

export default function Dashboard() {
  const { workspace, persist, hydrated } = useWorkspace()
  const tasks = workspace.tasks
  const notes = workspace.notes
  const habits = workspace.habits
  const userName = workspace.profile.name

  const [currentView, setCurrentView] = useState<ViewMode>("overview")
  const [searchQuery, setSearchQuery] = useState("")

  const [selectedTasks, setSelectedTasks] = useState<number[]>([])
  const [isSelectionMode, setIsSelectionMode] = useState(false)

  // Modal states
  const [taskModal, setTaskModal] = useState<{
    isOpen: boolean
    mode: "create" | "edit"
    task?: Task
  }>({
    isOpen: false,
    mode: "create",
  })

  const [noteModal, setNoteModal] = useState<{
    isOpen: boolean
    mode: "create" | "edit"
    note?: Note
  }>({
    isOpen: false,
    mode: "create",
  })

  const [habitModal, setHabitModal] = useState<{
    isOpen: boolean
    mode: "create" | "edit"
    habit?: Habit
  }>({
    isOpen: false,
    mode: "create",
  })

  const [shareModal, setShareModal] = useState(false)
  const [collaborationModal, setCollaborationModal] = useState(false)
  const [habitDashboard, setHabitDashboard] = useState(false)
  const [focusModal, setFocusModal] = useState(false)
  const [profileModal, setProfileModal] = useState(false)
  const [settingsModal, setSettingsModal] = useState(false)
  const [analyticsModal, setAnalyticsModal] = useState(false)
  const [timeTrackerModal, setTimeTrackerModal] = useState(false)
  const [goalManagerModal, setGoalManagerModal] = useState(false)

  // Permissions state and handling
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)

  useEffect(() => {
    const hasPermissions = localStorage.getItem("manage-kar-permissions")
    if (!hasPermissions) {
      setShowPermissionsModal(true)
    }
  }, [])

  const handleTaskToggle = (taskId: number) => {
    persist({
      tasks: tasks.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task)),
    })
  }

  const handleTaskSelect = (taskId: number) => {
    if (selectedTasks.includes(taskId)) {
      setSelectedTasks(selectedTasks.filter((id) => id !== taskId))
    } else {
      setSelectedTasks([...selectedTasks, taskId])
    }
  }

  const handleSelectAll = () => {
    if (selectedTasks.length === filteredTasks.length) {
      setSelectedTasks([])
    } else {
      setSelectedTasks(filteredTasks.map((task) => task.id))
    }
  }

  const handleClearSelection = () => {
    setSelectedTasks([])
    setIsSelectionMode(false)
  }

  const handleBulkShare = () => {
    setShareModal(true)
  }

  const handleAddTask = () => {
    setTaskModal({ isOpen: true, mode: "create" })
  }

  const handleEditTask = (task: Task) => {
    setTaskModal({ isOpen: true, mode: "edit", task })
  }

  const handleSaveTask = (taskData: Omit<Task, "id"> | Task) => {
    if ("id" in taskData) {
      persist({ tasks: tasks.map((task) => (task.id === taskData.id ? taskData : task)) })
    } else {
      persist({
        tasks: [
          ...tasks,
          {
            ...taskData,
            id: nextNumericId(tasks),
          },
        ],
      })
    }
  }

  const handleDeleteTask = (taskId: number) => {
    persist({ tasks: tasks.filter((task) => task.id !== taskId) })
  }

  const handleAddNote = () => {
    setNoteModal({ isOpen: true, mode: "create" })
  }

  const handleEditNote = (note: Note) => {
    setNoteModal({ isOpen: true, mode: "edit", note })
  }

  const handleSaveNote = (noteData: Omit<Note, "id" | "createdAt"> | Note) => {
    if ("id" in noteData) {
      persist({ notes: notes.map((note) => (note.id === noteData.id ? noteData : note)) })
    } else {
      persist({
        notes: [
          ...notes,
          {
            ...noteData,
            id: nextNumericId(notes),
            createdAt: new Date().toISOString(),
          },
        ],
      })
    }
  }

  const handleDeleteNote = (noteId: number) => {
    persist({ notes: notes.filter((note) => note.id !== noteId) })
  }

  const handleOpenShare = () => {
    setShareModal(true)
  }

  const handleOpenCollaboration = () => {
    setCollaborationModal(true)
  }

  const handleHabitToggle = (habitId: number) => {
    const today = new Date().toISOString().slice(0, 10)
    persist({
      habits: habits.map((habit) => {
        if (habit.id !== habitId) {
          return habit
        }
        const newCompletedToday = !habit.completedToday
        const history = habit.history.filter((entry) => entry.date !== today)
        history.push({ date: today, completed: newCompletedToday })
        return {
          ...habit,
          completedToday: newCompletedToday,
          completed: newCompletedToday,
          streak: newCompletedToday ? habit.streak + 1 : Math.max(0, habit.streak - 1),
          history,
        }
      }),
    })
  }

  const handleAddHabit = () => {
    setHabitModal({ isOpen: true, mode: "create" })
  }

  const handleEditHabit = (habit: Habit) => {
    setHabitModal({ isOpen: true, mode: "edit", habit })
  }

  const handleSaveHabit = (
    habitData: Omit<Habit, "id" | "streak" | "completed" | "completedToday" | "createdAt" | "history"> | Habit,
  ) => {
    if ("id" in habitData) {
      persist({ habits: habits.map((habit) => (habit.id === habitData.id ? habitData : habit)) })
    } else {
      persist({
        habits: [
          ...habits,
          {
            ...habitData,
            id: nextNumericId(habits),
            streak: 0,
            completed: false,
            completedToday: false,
            createdAt: new Date().toISOString(),
            history: [],
          },
        ],
      })
    }
  }

  const handleDeleteHabit = (habitId: number) => {
    persist({ habits: habits.filter((habit) => habit.id !== habitId) })
  }

  const handleOpenHabitDashboard = () => {
    setHabitDashboard(true)
  }

  const handleOpenFocus = () => {
    setFocusModal(true)
  }

  const handleOpenProfile = () => {
    setProfileModal(true)
  }

  const handleOpenSettings = () => {
    setSettingsModal(true)
  }

  const handleOpenAnalytics = () => {
    setAnalyticsModal(true)
  }

  const handleOpenTimeTracker = () => {
    setTimeTrackerModal(true)
  }

  const handleOpenGoalManager = () => {
    setGoalManagerModal(true)
  }

  const handleClipboardTask = (content: string) => {
    persist({
      tasks: [
        ...tasks,
        {
          id: nextNumericId(tasks),
          title: content.length > 50 ? content.substring(0, 50) + "..." : content,
          completed: false,
          priority: "medium",
          dueDate: "Today",
          description: content.length > 50 ? content : undefined,
          recurring: "none",
          reminders: false,
        },
      ],
    })
  }

  const handleClipboardNote = (content: string) => {
    persist({
      notes: [
        ...notes,
        {
          id: nextNumericId(notes),
          title: content.length > 30 ? content.substring(0, 30) + "..." : content,
          content,
          createdAt: new Date().toISOString(),
        },
      ],
    })
  }

  const handleVoiceNote = (audioBlob: Blob, transcription: string) => {
    const audioUrl = URL.createObjectURL(audioBlob)
    persist({
      notes: [
        ...notes,
        {
          id: nextNumericId(notes),
          title: transcription.length > 30 ? transcription.substring(0, 30) + "..." : transcription,
          content: transcription,
          createdAt: new Date().toISOString(),
          voiceNote: {
            audioUrl,
            transcription,
            duration: 0,
          },
        },
      ],
    })
  }

  const handleSpeechToText = (text: string) => {
    persist({
      notes: [
        ...notes,
        {
          id: nextNumericId(notes),
          title: text.length > 30 ? text.substring(0, 30) + "..." : text,
          content: text,
          createdAt: new Date().toISOString(),
          voiceNote: {
            audioUrl: "",
            transcription: text,
            duration: 0,
          },
        },
      ],
    })
  }

  const handleVoiceTask = (text: string) => {
    persist({
      tasks: [
        ...tasks,
        {
          id: nextNumericId(tasks),
          title: text.length > 50 ? text.substring(0, 50) + "..." : text,
          completed: false,
          priority: "medium",
          dueDate: "Today",
          description: text,
          recurring: "none",
          reminders: false,
        },
      ],
    })
  }

  const completedTasksCount = tasks.filter((task) => task.completed).length
  const pendingTasksCount = tasks.filter((task) => !task.completed).length

  const filteredTasks = tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const renderOverviewContent = () => (
    <div className="space-y-6 sm:space-y-8">
      <div className="adaptive-grid">
        <Card
          className="modern-card hover:scale-105 transition-all duration-300 cursor-pointer group responsive-card"
          onClick={() => setCurrentView("tasks")}
        >
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
            <div className="p-2 sm:p-3 bg-primary/10 rounded-xl sm:rounded-2xl group-hover:bg-primary/20 transition-colors">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-primary" />
            </div>
            <div>
              <p className="responsive-text-xl font-bold font-sans gradient-text">{completedTasksCount}</p>
              <p className="responsive-text-xs text-muted-readable font-serif">Completed</p>
            </div>
          </div>
        </Card>

        <Card
          className="modern-card hover:scale-105 transition-all duration-300 cursor-pointer group responsive-card"
          onClick={() => setCurrentView("tasks")}
        >
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
            <div className="p-2 sm:p-3 bg-orange-500/10 rounded-xl sm:rounded-2xl group-hover:bg-orange-500/20 transition-colors">
              <Circle className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-orange-500" />
            </div>
            <div>
              <p className="responsive-text-xl font-bold font-sans gradient-text">{pendingTasksCount}</p>
              <p className="responsive-text-xs text-muted-readable font-serif">Pending</p>
            </div>
          </div>
        </Card>

        <Card
          className="modern-card hover:scale-105 transition-all duration-300 cursor-pointer group responsive-card"
          onClick={handleOpenHabitDashboard}
        >
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
            <div className="p-2 sm:p-3 bg-blue-500/10 rounded-xl sm:rounded-2xl group-hover:bg-blue-500/20 transition-colors">
              <Target className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-500" />
            </div>
            <div>
              <p className="responsive-text-xl font-bold font-sans gradient-text">{habits.length}</p>
              <p className="responsive-text-xs text-muted-readable font-serif">Habits</p>
            </div>
          </div>
        </Card>

        <Card
          className="modern-card hover:scale-105 transition-all duration-300 cursor-pointer group responsive-card"
          onClick={() => setCurrentView("notes")}
        >
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
            <div className="p-2 sm:p-3 bg-green-500/10 rounded-xl sm:rounded-2xl group-hover:bg-green-500/20 transition-colors">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-green-500" />
            </div>
            <div>
              <p className="responsive-text-xl font-bold font-sans gradient-text">{notes.length}</p>
              <p className="responsive-text-xs text-muted-readable font-serif">Notes</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Enhanced Recent Tasks */}
      <div>
        <h3 className="responsive-text-2xl font-bold font-sans text-readable mb-4 sm:mb-6">Recent Tasks</h3>
        {tasks.length === 0 ? (
          <EmptyState
            title="Nothing on your plate yet"
            description="Add a task to start a workspace that stays on this device after refresh."
            actionLabel="Add task"
            onAction={handleAddTask}
          />
        ) : (
        <div className="space-y-3">
          {tasks.slice(0, 3).map((task) => (
            <Card key={task.id} className="modern-card hover:shadow-lg transition-all duration-300 group">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl h-8 w-8 hover:scale-110 transition-all duration-200 btn-theme"
                  onClick={() => handleTaskToggle(task.id)}
                >
                  {task.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  )}
                </Button>
                <div className="flex-1">
                  <p className={`font-serif ${task.completed ? "line-through text-muted-readable" : "text-readable"}`}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant={
                        task.priority === "high" ? "destructive" : task.priority === "medium" ? "default" : "secondary"
                      }
                      className="text-xs sm:text-sm"
                    >
                      {task.priority}
                    </Badge>
                    <span className="text-xs sm:text-sm text-muted-readable">{task.dueDate}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
        )}
      </div>
    </div>
  )

  const renderTasksContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl sm:text-2xl font-bold font-sans text-foreground">All Tasks</h3>
        <div className="flex items-center gap-2">
          {isSelectionMode && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="rounded-xl responsive-button bg-transparent"
              >
                {selectedTasks.length === filteredTasks.length ? "Deselect All" : "Select All"}
              </Button>
              {selectedTasks.length > 0 && (
                <Button variant="default" size="sm" onClick={handleBulkShare} className="rounded-xl responsive-button">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share ({selectedTasks.length})
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleClearSelection} className="rounded-xl responsive-button">
                Cancel
              </Button>
            </>
          )}
          {!isSelectionMode && (
            <>
              <Button
                variant="outline"
                onClick={() => setIsSelectionMode(true)}
                className="rounded-xl responsive-button"
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                Select
              </Button>
              <Button onClick={handleAddTask} className="rounded-2xl responsive-button">
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </>
          )}
        </div>
      </div>

      {isSelectionMode && (
        <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-xl">
          <span className="responsive-text-sm text-primary font-medium">
            {selectedTasks.length} of {filteredTasks.length} tasks selected
          </span>
          {selectedTasks.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBulkShare}
                className="text-primary hover:bg-primary/20 responsive-button"
              >
                <Share2 className="h-4 w-4 mr-1" />
                Share Selected
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <EmptyState
            title={searchQuery ? "No matching tasks" : "No tasks yet"}
            description={
              searchQuery
                ? "Try a different search, or clear the box to see everything."
                : "Create a task. It will still be here after you refresh."
            }
            actionLabel={searchQuery ? undefined : "Add task"}
            onAction={searchQuery ? undefined : handleAddTask}
          />
        ) : null}
        {filteredTasks.map((task) => (
          <Card
            key={task.id}
            className={`bg-card/95 backdrop-blur-xl border border-border/50 p-6 rounded-3xl hover:shadow-lg transition-all duration-300 group ${
              selectedTasks.includes(task.id) ? "ring-2 ring-primary bg-primary/5" : ""
            }`}
          >
            <div className="flex items-center gap-4">
              {isSelectionMode && (
                <input
                  type="checkbox"
                  checked={selectedTasks.includes(task.id)}
                  onChange={() => handleTaskSelect(task.id)}
                  className="w-5 h-5 rounded border-border accent-primary mobile-touch-target"
                />
              )}

              <Button
                variant="ghost"
                size="icon"
                className="rounded-2xl h-10 w-10 hover:scale-110 transition-all duration-200"
                onClick={() => handleTaskToggle(task.id)}
              >
                {task.completed ? (
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                ) : (
                  <Circle className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                )}
              </Button>

              <div className="flex-1 space-y-2">
                <p
                  className={`font-serif text-lg sm:text-xl ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}
                >
                  {task.title}
                </p>
                {task.description && <p className="text-sm sm:text-base text-muted-foreground">{task.description}</p>}
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge
                    variant={
                      task.priority === "high" ? "destructive" : task.priority === "medium" ? "default" : "secondary"
                    }
                    className="text-xs sm:text-sm px-3 py-1 rounded-full"
                  >
                    {task.priority}
                  </Badge>
                  <span className="text-sm sm:text-base text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                    {task.dueDate}
                  </span>
                  {task.checklist && task.checklist.length > 0 && (
                    <span className="text-sm sm:text-base text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
                      {task.checklist.filter((item) => item.completed).length}/{task.checklist.length} items
                    </span>
                  )}
                </div>
              </div>

              {!isSelectionMode && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-2xl h-10 w-10 sm:opacity-0 sm:group-hover:opacity-100 hover:scale-110 transition-all duration-200"
                  onClick={() => handleEditTask(task)}
                >
                  <Edit className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )

  const renderNotesContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl sm:text-2xl font-bold font-sans text-foreground">All Notes</h3>
        <Button onClick={handleAddNote} className="rounded-2xl">
          <Plus className="h-4 w-4 mr-2" />
          Add Note
        </Button>
      </div>

      <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filteredNotes.length === 0 ? (
          <div className="md:col-span-2 lg:col-span-3">
            <EmptyState
              title={searchQuery ? "No matching notes" : "No notes yet"}
              description={
                searchQuery
                  ? "Nothing in your notes matches that search."
                  : "Capture a thought. Notes are saved locally with the rest of your workspace."
              }
              actionLabel={searchQuery ? undefined : "Add note"}
              onAction={searchQuery ? undefined : handleAddNote}
            />
          </div>
        ) : null}
        {filteredNotes.map((note) => (
          <Card
            key={note.id}
            className="bg-card/95 backdrop-blur-xl border border-border/50 p-6 rounded-3xl hover:shadow-lg transition-all duration-300 group cursor-pointer"
            onClick={() => handleEditNote(note)}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <h4 className="font-semibold font-sans text-foreground truncate flex-1">{note.title}</h4>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEditNote(note)
                  }}
                >
                  <Edit className="h-3 w-3 text-muted-foreground" />
                </Button>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground font-serif line-clamp-3">{note.content}</p>
              <p className="text-xs sm:text-sm">{note.createdAt}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )

  const renderMonitorContent = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl sm:text-2xl font-bold font-sans text-foreground">Workspace</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          This is a personal, on-device workspace. There is no live team feed yet.
        </p>
      </div>
      <div className="grid gap-4 sm:gap-5 md:grid-cols-3">
        <Card className="bg-card/95 backdrop-blur-xl border border-border/50 p-6 rounded-3xl">
          <p className="text-sm text-muted-foreground">Open tasks</p>
          <p className="mt-2 text-2xl font-semibold">{pendingTasksCount}</p>
        </Card>
        <Card className="bg-card/95 backdrop-blur-xl border border-border/50 p-6 rounded-3xl">
          <p className="text-sm text-muted-foreground">Completed</p>
          <p className="mt-2 text-2xl font-semibold">{completedTasksCount}</p>
        </Card>
        <Card className="bg-card/95 backdrop-blur-xl border border-border/50 p-6 rounded-3xl">
          <p className="text-sm text-muted-foreground">Habits today</p>
          <p className="mt-2 text-2xl font-semibold">
            {habits.filter((habit) => habit.completedToday).length}/{habits.length}
          </p>
        </Card>
      </div>
    </div>
  )

  const handleGrantPermissions = async () => {
    console.log("[v0] Grant permissions clicked")
    try {
      let permissionsGranted = true

      // Request microphone permission
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true })
          console.log("[v0] Microphone permission granted")
        } catch (micError) {
          console.log("[v0] Microphone permission denied:", micError)
          permissionsGranted = false
        }
      }

      // Request notification permission
      if ("Notification" in window) {
        try {
          const permission = await Notification.requestPermission()
          console.log("[v0] Notification permission:", permission)
        } catch (notifError) {
          console.log("[v0] Notification permission error:", notifError)
        }
      }

      localStorage.setItem("manage-kar-permissions", permissionsGranted ? "granted" : "partial")
      setShowPermissionsModal(false)
      console.log("[v0] Permissions modal closed")
    } catch (error) {
      console.error("[v0] Permission request failed:", error)
      localStorage.setItem("manage-kar-permissions", "partial")
      setShowPermissionsModal(false)
    }
  }

  const handleSkipPermissions = () => {
    console.log("[v0] Skip permissions clicked")
    localStorage.setItem("manage-kar-permissions", "skipped")
    setShowPermissionsModal(false)
    console.log("[v0] Permissions modal closed via skip")
  }

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading your workspace…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 pb-32">
      <ClipboardMonitor
        onCreateTask={handleClipboardTask}
        onCreateNote={handleClipboardNote}
        enabled={workspace.settings.privacy.clipboardMonitor}
      />

      {/* Enhanced Header */}
      <div className="mb-6 pt-2 sm:mb-8 sm:pt-4">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="modern-card rounded-2xl h-10 w-10 sm:h-12 sm:w-12 hover:scale-105 transition-all duration-200 btn-theme iphone-touch-target"
              onClick={handleOpenProfile}
            >
              <User className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-sans gradient-text">Hello, {userName}!</h1>
              <p className="text-muted-readable font-serif text-xs sm:text-sm">Your workspace stays on this device</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="modern-card rounded-2xl h-10 w-10 sm:h-12 sm:w-12 hover:scale-105 transition-all duration-200 btn-theme iphone-touch-target"
            onClick={handleOpenSettings}
          >
            <Settings className="h-5 w-5 sm:h-6 sm:w-6" />
          </Button>
        </div>

        {/* Enhanced Feature Grid with Responsive Layout */}
        <div className="feature-grid mb-4 sm:mb-6">
          <Button
            variant="ghost"
            className="modern-card rounded-xl sm:rounded-2xl h-12 sm:h-14 lg:h-16 w-full flex flex-col items-center justify-center gap-1 hover:scale-105 transition-all duration-200 btn-theme mobile-touch-target responsive-button"
            onClick={handleOpenAnalytics}
          >
            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="responsive-text-xs font-medium">Analytics</span>
          </Button>
          <Button
            variant="ghost"
            className="modern-card rounded-xl sm:rounded-2xl h-12 sm:h-14 lg:h-16 w-full flex flex-col items-center justify-center gap-1 hover:scale-105 transition-all duration-200 btn-theme mobile-touch-target responsive-button"
            onClick={handleOpenTimeTracker}
          >
            <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="responsive-text-xs font-medium">Time</span>
          </Button>
          <Button
            variant="ghost"
            className="modern-card rounded-xl sm:rounded-2xl h-12 sm:h-14 lg:h-16 w-full flex flex-col items-center justify-center gap-1 hover:scale-105 transition-all duration-200 btn-theme mobile-touch-target responsive-button"
            onClick={handleOpenGoalManager}
          >
            <Target className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="responsive-text-xs font-medium">Goals</span>
          </Button>
          <Button
            variant="ghost"
            className="modern-card rounded-xl sm:rounded-2xl h-12 sm:h-14 lg:h-16 w-full flex flex-col items-center justify-center gap-1 hover:scale-105 transition-all duration-200 btn-theme mobile-touch-target responsive-button"
            onClick={handleOpenHabitDashboard}
          >
            <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="responsive-text-xs font-medium">Habits</span>
          </Button>
          <Button
            variant="ghost"
            className="modern-card rounded-xl sm:rounded-2xl h-12 sm:h-14 lg:h-16 w-full flex flex-col items-center justify-center gap-1 hover:scale-105 transition-all duration-200 btn-theme mobile-touch-target responsive-button"
            onClick={handleOpenFocus}
          >
            <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="responsive-text-xs font-medium">Focus</span>
          </Button>
          <Button
            variant="ghost"
            className="modern-card rounded-xl sm:rounded-2xl h-12 sm:h-14 lg:h-16 w-full flex flex-col items-center justify-center gap-1 hover:scale-105 transition-all duration-200 btn-theme mobile-touch-target responsive-button"
            onClick={handleOpenShare}
          >
            <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="responsive-text-xs font-medium">Share</span>
          </Button>
          <Button
            variant="ghost"
            className="modern-card rounded-xl sm:rounded-2xl h-12 sm:h-14 lg:h-16 w-full flex flex-col items-center justify-center gap-1 hover:scale-105 transition-all duration-200 btn-theme mobile-touch-target responsive-button"
            onClick={handleOpenCollaboration}
          >
            <Users className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="responsive-text-xs font-medium">Preview</span>
          </Button>
          <Button
            variant="ghost"
            className="modern-card rounded-xl sm:rounded-2xl h-12 sm:h-14 lg:h-16 w-full flex flex-col items-center justify-center gap-1 hover:scale-105 transition-all duration-200 btn-theme mobile-touch-target responsive-button"
            onClick={() => setCurrentView("monitor")}
          >
            <Monitor className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="responsive-text-xs font-medium">Workspace</span>
          </Button>
        </div>

        {/* Enhanced Main Navigation with Responsive Buttons */}
        <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6">
          <Button
            variant={currentView === "overview" ? "default" : "outline"}
            className="rounded-xl sm:rounded-2xl flex-1 modern-card bg-transparent border-border/50 btn-theme responsive-button mobile-touch-target"
            onClick={() => setCurrentView("overview")}
          >
            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="responsive-text-sm">Overview</span>
          </Button>
          <Button
            variant={currentView === "tasks" ? "default" : "outline"}
            className="rounded-xl sm:rounded-2xl flex-1 modern-card bg-transparent border-border/50 btn-theme responsive-button mobile-touch-target"
            onClick={() => setCurrentView("tasks")}
          >
            <CheckSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="responsive-text-sm">Tasks</span>
          </Button>
          <Button
            variant={currentView === "notes" ? "default" : "outline"}
            className="rounded-xl sm:rounded-2xl flex-1 modern-card bg-transparent border-border/50 btn-theme responsive-button mobile-touch-target"
            onClick={() => setCurrentView("notes")}
          >
            <StickyNote className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="responsive-text-sm">Notes</span>
          </Button>
        </div>

        {/* Enhanced Search Bar with Responsive Styling */}
        <div className="relative mb-4 sm:mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks and notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl sm:rounded-2xl bg-card/95 backdrop-blur-xl border-border/50 responsive-container mobile-touch-target"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="mb-10">
        {currentView === "overview" && renderOverviewContent()}
        {currentView === "tasks" && renderTasksContent()}
        {currentView === "notes" && renderNotesContent()}
        {currentView === "monitor" && renderMonitorContent()}
      </div>

      <div className="fixed bottom-6 right-4 sm:bottom-8 sm:right-8 z-50">
        <FloatingToggle
          tasks={tasks}
          notes={notes}
          onTaskToggle={handleTaskToggle}
          onAddTask={handleAddTask}
          onAddNote={handleAddNote}
          onEditTask={handleEditTask}
          onEditNote={handleEditNote}
          onVoiceNote={handleVoiceNote}
          onSpeechToText={handleSpeechToText}
          onCreateTaskFromVoice={handleVoiceTask}
        />
      </div>

      {/* Modals */}
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
        tasks={
          isSelectionMode && selectedTasks.length > 0 ? tasks.filter((task) => selectedTasks.includes(task.id)) : tasks
        }
        userName={userName}
      />

      <CollaborationDashboard isOpen={collaborationModal} onClose={() => setCollaborationModal(false)} />

      <HabitDashboard
        isOpen={habitDashboard}
        onClose={() => setHabitDashboard(false)}
        habits={habits}
        onHabitToggle={handleHabitToggle}
        onAddHabit={handleAddHabit}
        onEditHabit={handleEditHabit}
      />

      <FocusModal isOpen={focusModal} onClose={() => setFocusModal(false)} />

      <ProfileModal
        isOpen={profileModal}
        onClose={() => setProfileModal(false)}
        stats={{
          tasksCompleted: completedTasksCount,
          habitsTracked: habits.length,
        }}
        onProfileChange={(profile) => persist({ profile })}
      />

      <SettingsModal isOpen={settingsModal} onClose={() => setSettingsModal(false)} />

      <AnalyticsDashboard
        isOpen={analyticsModal}
        onClose={() => setAnalyticsModal(false)}
        tasks={tasks}
        habits={habits}
      />

      <TimeTracker isOpen={timeTrackerModal} onClose={() => setTimeTrackerModal(false)} />

      <GoalManager isOpen={goalManagerModal} onClose={() => setGoalManagerModal(false)} />

      {/* Permissions Modal */}
      {showPermissionsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card/95 backdrop-blur-xl border border-border/50 shadow-xl rounded-3xl max-w-md w-full p-6">
            <div className="text-center space-y-6">
              <div className="p-3 bg-primary/20 rounded-full w-fit mx-auto">
                <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Optional permissions</h3>
                <p className="text-muted-foreground">Skip if you only want tasks, notes, and habits. Voice needs the microphone.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-foreground">Microphone Access</p>
                    <p className="text-sm text-muted-foreground">For voice notes and speech-to-text</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 01-7.5-7.5H7.5a7.5 7.5 0 017.5 7.5v5z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-foreground">Notifications</p>
                    <p className="text-sm text-muted-foreground">For task reminders and confirmations</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleSkipPermissions}
                  className="flex-1 rounded-xl bg-transparent hover:bg-muted/20 transition-colors duration-200 min-h-[44px]"
                >
                  Skip
                </Button>
                <Button
                  onClick={handleGrantPermissions}
                  className="flex-1 rounded-xl hover:scale-105 transition-all duration-200 min-h-[44px]"
                >
                  Grant Permissions
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
