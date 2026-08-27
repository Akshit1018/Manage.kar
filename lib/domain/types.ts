export type TaskPriority = "high" | "medium" | "low"
export type RecurringRule = "none" | "daily" | "weekly" | "monthly"
export type HabitCategory = "health" | "productivity" | "learning" | "lifestyle" | "fitness" | "mindfulness"
export type HabitFrequency = "daily" | "weekly" | "custom"
export type ThemePreference = "light" | "dark" | "system"
export type GoalCategory = "personal" | "work" | "health" | "learning" | "financial"
export type GoalStatus = "active" | "completed" | "paused"
export type FocusType = "pomodoro" | "deep-work" | "break" | "custom"
export type DateFormat = "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD"
export type LabelKind = "place" | "tag" | "person"

export interface WorkspaceLabel {
  id: number
  name: string
  kind: LabelKind
}

export interface TaskChecklistItem {
  id: number
  text: string
  completed: boolean
}

export interface Task {
  id: number
  title: string
  completed: boolean
  priority: TaskPriority
  dueDate: string
  description?: string
  recurring?: RecurringRule
  reminders?: boolean
  checklist?: TaskChecklistItem[]
  labelIds?: number[]
  updatedAt?: string
}

export interface Note {
  id: number
  title: string
  content: string
  createdAt: string
  updatedAt?: string
  voiceNote?: {
    audioUrl: string
    transcription: string
    duration: number
  }
  labelIds?: number[]
}

export interface Habit {
  id: number
  name: string
  description?: string
  category: HabitCategory
  frequency: HabitFrequency
  customDays?: string[]
  goal?: number
  unit?: string
  streak: number
  completed: boolean
  completedToday: boolean
  reminders: boolean
  reminderTime?: string
  createdAt: string
  updatedAt?: string
  history: { date: string; completed: boolean; value?: number }[]
}

export interface GoalMilestone {
  id: number
  title: string
  completed: boolean
  dueDate: string
}

export interface Goal {
  id: number
  title: string
  description: string
  category: GoalCategory
  priority: TaskPriority
  targetDate: string
  progress: number
  milestones: GoalMilestone[]
  status: GoalStatus
  createdAt: string
  updatedAt?: string
}

export interface TimeEntry {
  id: number
  taskName: string
  project: string
  startTime: string
  endTime?: string
  duration: number
  isRunning: boolean
  updatedAt?: string
}

export interface FocusSession {
  id: number
  type: FocusType
  durationSeconds: number
  completed: boolean
  startTime: string
  endTime?: string
  updatedAt?: string
}

export interface ActiveFocus {
  sessionId: number
  type: FocusType
  durationSeconds: number
  remainingSeconds: number
  isRunning: boolean
  startedAt: string
  accumulatedElapsed: number
}

export interface UserProfile {
  name: string
  email: string
  phone: string
  location: string
  bio: string
  avatar: string
  joinDate: string
}

export interface AppSettings {
  notifications: {
    enabled: boolean
    taskReminders: boolean
    habitReminders: boolean
    focusBreaks: boolean
  }
  appearance: {
    theme: ThemePreference
    fontSize: "small" | "medium" | "large"
    animations: boolean
  }
  privacy: {
    clipboardMonitor: boolean
  }
  general: {
    weekStartsOn: "sunday" | "monday"
    dateFormat: DateFormat
  }
}

export interface DeletedIds {
  tasks: number[]
  notes: number[]
  habits: number[]
  goals: number[]
  timeEntries: number[]
  focusSessions: number[]
}

export interface Workspace {
  schemaVersion: 1
  updatedAt: string
  nextEntityId: number
  labels: WorkspaceLabel[]
  tasks: Task[]
  notes: Note[]
  habits: Habit[]
  goals: Goal[]
  timeEntries: TimeEntry[]
  focusSessions: FocusSession[]
  activeFocus: ActiveFocus | null
  importedShareHashes: string[]
  firedReminderKeys: string[]
  deletedIds: DeletedIds
  settings: AppSettings
  profile: UserProfile
}
