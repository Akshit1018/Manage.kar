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

interface Task {
  id: number
  title: string
  completed: boolean
  priority: "high" | "medium" | "low"
  dueDate: string
  description?: string
  recurring?: "none" | "daily" | "weekly" | "monthly"
  reminders?: boolean
  checklist?: { id: number; text: string; completed: boolean }[]
}

interface Note {
  id: number
  title: string
  content: string
  createdAt: string
  voiceNote?: {
    audioUrl: string
    transcription: string
    duration: number
  }
}

interface Habit {
  id: number
  name: string
  description?: string
  category: "health" | "productivity" | "learning" | "lifestyle" | "fitness" | "mindfulness"
  frequency: "daily" | "weekly" | "custom"
  customDays?: string[]
  goal?: number
  unit?: string
  streak: number
  completed: boolean
  completedToday: boolean
  reminders: boolean
  reminderTime?: string
  createdAt: string
  history: { date: string; completed: boolean; value?: number }[]
}

type ViewMode = "overview" | "tasks" | "notes" | "monitor"

export default function Dashboard() {
  const [currentView, setCurrentView] = useState<ViewMode>("overview")
  const [searchQuery, setSearchQuery] = useState("")
  const [userName, setUserName] = useState("User")
  const [isDarkMode, setIsDarkMode] = useState(false)

  const [selectedTasks, setSelectedTasks] = useState<number[]>([])
  const [isSelectionMode, setIsSelectionMode] = useState(false)

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 1,
      title: "Complete project proposal",
      completed: false,
      priority: "high",
      dueDate: "Today",
      description: "Finalize the Q1 project proposal with budget estimates",
      recurring: "none",
      reminders: true,
      checklist: [
        { id: 1, text: "Research market trends", completed: true },
        { id: 2, text: "Create budget breakdown", completed: false },
        { id: 3, text: "Review with team", completed: false },
      ],
    },
    {
      id: 2,
      title: "Review team feedback",
      completed: true,
      priority: "medium",
      dueDate: "Yesterday",
      description: "Go through all feedback from the design review meeting",
    },
    {
      id: 3,
      title: "Plan weekend trip",
      completed: false,
      priority: "low",
      dueDate: "This week",
      recurring: "none",
      reminders: false,
    },
    {
      id: 4,
      title: "Update portfolio website",
      completed: false,
      priority: "medium",
      dueDate: "Tomorrow",
      recurring: "weekly",
      reminders: true,
    },
    {
      id: 5,
      title: "Call dentist for appointment",
      completed: true,
      priority: "high",
      dueDate: "Today",
    },
  ])

  const [notes, setNotes] = useState<Note[]>([
    {
      id: 1,
      title: "Meeting Notes",
      content:
        "Discussed project timeline and deliverables. Need to follow up with design team about mockups. Key decisions: - Use React for frontend - Deploy on Vercel - Weekly sprint reviews",
      createdAt: "2 hours ago",
    },
    {
      id: 2,
      title: "Recipe Ideas",
      content:
        "Try making pasta carbonara this weekend. Also want to experiment with homemade bread. Ingredients to buy: eggs, pancetta, parmesan, flour, yeast.",
      createdAt: "1 day ago",
    },
    {
      id: 3,
      title: "Book Recommendations",
      content:
        "Atomic Habits, The Power of Now, Deep Work - all highly recommended by colleagues. Should start with Atomic Habits as it's most relevant to productivity goals.",
      createdAt: "3 days ago",
    },
  ])

  const [habits, setHabits] = useState<Habit[]>([
    {
      id: 1,
      name: "Morning Exercise",
      description: "30 minutes of cardio or strength training",
      category: "fitness",
      frequency: "daily",
      goal: 30,
      unit: "minutes",
      streak: 7,
      completed: true,
      completedToday: true,
      reminders: true,
      reminderTime: "07:00",
      createdAt: "2024-01-01",
      history: [],
    },
    {
      id: 2,
      name: "Read 30 minutes",
      description: "Read books for personal development",
      category: "learning",
      frequency: "daily",
      goal: 30,
      unit: "minutes",
      streak: 12,
      completed: false,
      completedToday: false,
      reminders: true,
      reminderTime: "20:00",
      createdAt: "2024-01-01",
      history: [],
    },
    {
      id: 3,
      name: "Meditation",
      description: "Mindfulness and breathing exercises",
      category: "mindfulness",
      frequency: "daily",
      goal: 10,
      unit: "minutes",
      streak: 3,
      completed: true,
      completedToday: true,
      reminders: false,
      createdAt: "2024-01-01",
      history: [],
    },
    {
      id: 4,
      name: "Drink Water",
      description: "Stay hydrated throughout the day",
      category: "health",
      frequency: "daily",
      goal: 8,
      unit: "glasses",
      streak: 5,
      completed: false,
      completedToday: false,
      reminders: true,
      reminderTime: "09:00",
      createdAt: "2024-01-01",
      history: [],
    },
  ])

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
    const savedTheme = localStorage.getItem("manageKarTheme")
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

    const shouldUseDark = savedTheme === "dark" || (!savedTheme && systemPrefersDark)
    setIsDarkMode(shouldUseDark)

    if (shouldUseDark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }

    const savedProfile = localStorage.getItem("manageKarUserProfile")
    if (savedProfile) {
      const profile = JSON.parse(savedProfile)
      setUserName(profile.name || "User")
    }

    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get("imported") === "true") {
      const importedTasks = localStorage.getItem("importedTasks")
      if (importedTasks) {
        const parsedTasks = JSON.parse(importedTasks)
        const newTasks = parsedTasks.map((task: any) => ({
          ...task,
          id: Math.max(...tasks.map((t) => t.id), 0) + Math.random() * 1000,
        }))
        setTasks([...tasks, ...newTasks])
        localStorage.removeItem("importedTasks")
        window.history.replaceState({}, "", window.location.pathname)
      }
    }

    const checkPermissions = async () => {
      const hasPermissions = localStorage.getItem("manage-kar-permissions")
      if (!hasPermissions) {
        setShowPermissionsModal(true)
      }
    }
    checkPermissions()
  }, [])

  const handleTaskToggle = (taskId: number) => {
    setTasks(tasks.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task)))
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
    const tasksToShare = tasks.filter((task) => selectedTasks.includes(task.id))
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
      setTasks(tasks.map((task) => (task.id === taskData.id ? taskData : task)))
    } else {
      const newTask: Task = {
        ...taskData,
        id: Math.max(...tasks.map((t) => t.id), 0) + 1,
      }
      setTasks([...tasks, newTask])
    }
  }

  const handleDeleteTask = (taskId: number) => {
    setTasks(tasks.filter((task) => task.id !== taskId))
  }

  const handleAddNote = () => {
    setNoteModal({ isOpen: true, mode: "create" })
  }

  const handleEditNote = (note: Note) => {
    setNoteModal({ isOpen: true, mode: "edit", note })
  }

  const handleSaveNote = (noteData: Omit<Note, "id" | "createdAt"> | Note) => {
    if ("id" in noteData) {
      setNotes(notes.map((note) => (note.id === noteData.id ? noteData : note)))
    } else {
      const newNote: Note = {
        ...noteData,
        id: Math.max(...notes.map((n) => n.id), 0) + 1,
        createdAt: "Just now",
      }
      setNotes([...notes, newNote])
    }
  }

  const handleDeleteNote = (noteId: number) => {
    setNotes(notes.filter((note) => note.id !== noteId))
  }

  const handleOpenShare = () => {
    setShareModal(true)
  }

  const handleOpenCollaboration = () => {
    setCollaborationModal(true)
  }

  const handleHabitToggle = (habitId: number) => {
    setHabits(
      habits.map((habit) => {
        if (habit.id === habitId) {
          const newCompletedToday = !habit.completedToday
          return {
            ...habit,
            completedToday: newCompletedToday,
            completed: newCompletedToday,
            streak: newCompletedToday ? habit.streak + 1 : Math.max(0, habit.streak - 1),
          }
        }
        return habit
      }),
    )
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
      setHabits(habits.map((habit) => (habit.id === habitData.id ? habitData : habit)))
    } else {
      const newHabit: Habit = {
        ...habitData,
        id: Math.max(...habits.map((h) => h.id), 0) + 1,
        streak: 0,
        completed: false,
        completedToday: false,
        createdAt: new Date().toISOString(),
        history: [],
      }
      setHabits([...habits, newHabit])
    }
  }

  const handleDeleteHabit = (habitId: number) => {
    setHabits(habits.filter((habit) => habit.id !== habitId))
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
    const newTask: Task = {
      id: Math.max(...tasks.map((t) => t.id), 0) + 1,
      title: content.length > 50 ? content.substring(0, 50) + "..." : content,
      completed: false,
      priority: "medium",
      dueDate: "Today",
      description: content.length > 50 ? content : undefined,
      recurring: "none",
      reminders: false,
    }
    setTasks([...tasks, newTask])
  }

  const handleClipboardNote = (content: string) => {
    const newNote: Note = {
      id: Math.max(...notes.map((n) => n.id), 0) + 1,
      title: content.length > 30 ? content.substring(0, 30) + "..." : content,
      content: content,
      createdAt: "Just now",
    }
    setNotes([...notes, newNote])
  }

  const handleVoiceNote = (audioBlob: Blob, transcription: string) => {
    const audioUrl = URL.createObjectURL(audioBlob)
    const newNote: Note = {
      id: Math.max(...notes.map((n) => n.id), 0) + 1,
      title: transcription.length > 30 ? transcription.substring(0, 30) + "..." : transcription,
      content: transcription,
      createdAt: "Just now",
      voiceNote: {
        audioUrl,
        transcription,
        duration: 0,
      },
    }
    setNotes([...notes, newNote])
  }

  const handleSpeechToText = (text: string) => {
    const newNote: Note = {
      id: Math.max(...notes.map((n) => n.id), 0) + 1,
      title: text.length > 30 ? text.substring(0, 30) + "..." : text,
      content: text,
      createdAt: "Just now",
      voiceNote: {
        audioUrl: "",
        transcription: text,
        duration: 0,
      },
    }
    setNotes([...notes, newNote])
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
        <Card className="modern-card hover:scale-105 transition-all duration-300 cursor-pointer group responsive-card">
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

        <Card className="modern-card hover:scale-105 transition-all duration-300 cursor-pointer group responsive-card">
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

        <Card className="modern-card hover:scale-105 transition-all duration-300 cursor-pointer group responsive-card">
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

        <Card className="modern-card hover:scale-105 transition-all duration-300 cursor-pointer group responsive-card">
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
                  className="rounded-2xl h-10 w-10 opacity-0 group-hover:opacity-100 hover:scale-110 transition-all duration-200"
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
                  className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
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
      <div className="flex items-center justify-between">
        <h3 className="text-xl sm:text-2xl font-bold font-sans text-foreground">Team Monitoring</h3>
        <Button onClick={handleOpenCollaboration} variant="outline" className="rounded-2xl bg-transparent">
          <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
          Full Dashboard
        </Button>
      </div>

      <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-card/95 backdrop-blur-xl border border-border/50 p-6 rounded-3xl">
          <div className="space-y-3">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold font-sans">Team Alpha</p>
                <p className="text-sm sm:text-base text-muted-foreground">5 members</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm sm:text-base">
                <span>Tasks Completed</span>
                <span className="font-medium">12/15</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: "80%" }} />
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-card/95 backdrop-blur-xl border border-border/50 p-6 rounded-3xl">
          <div className="space-y-3">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
              </div>
              <div>
                <p className="font-semibold font-sans">Team Beta</p>
                <p className="text-sm sm:text-base text-muted-foreground">3 members</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm sm:text-base">
                <span>Tasks Completed</span>
                <span className="font-medium">8/10</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: "80%" }} />
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-card/95 backdrop-blur-xl border border-border/50 p-6 rounded-3xl">
          <div className="space-y-3">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-8 h-8 bg-orange-500/10 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
              </div>
              <div>
                <p className="font-semibold font-sans">Team Gamma</p>
                <p className="text-sm sm:text-base text-muted-foreground">4 members</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm sm:text-base">
                <span>Tasks Completed</span>
                <span className="font-medium">6/12</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: "50%" }} />
              </div>
            </div>
          </div>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 pb-32">
      <ClipboardMonitor onCreateTask={handleClipboardTask} onCreateNote={handleClipboardNote} enabled={true} />

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
              <p className="text-muted-readable font-serif text-xs sm:text-sm">Welcome back to Manage.kar</p>
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
            <span className="responsive-text-xs font-medium">Teams</span>
          </Button>
          <Button
            variant="ghost"
            className="modern-card rounded-xl sm:rounded-2xl h-12 sm:h-14 lg:h-16 w-full flex flex-col items-center justify-center gap-1 hover:scale-105 transition-all duration-200 btn-theme mobile-touch-target responsive-button"
            onClick={() => setCurrentView("monitor")}
          >
            <Monitor className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="responsive-text-xs font-medium">Monitor</span>
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
          systemOverlay={true}
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

      <ProfileModal isOpen={profileModal} onClose={() => setProfileModal(false)} />

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
                <h3 className="text-xl font-semibold text-foreground mb-2">Permissions Required</h3>
                <p className="text-muted-foreground">Enable features for better experience</p>
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
