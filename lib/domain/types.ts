export type TaskPriority = "high" | "medium" | "low"
export type RecurringRule = "none" | "daily" | "weekly" | "monthly"
export type HabitCategory = "health" | "productivity" | "learning" | "lifestyle" | "fitness" | "mindfulness"
export type HabitFrequency = "daily" | "weekly" | "custom"
export type ThemePreference = "light" | "dark" | "system"

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
  assignedTo?: string[]
  mentions?: string[]
}

export interface Note {
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
  history: { date: string; completed: boolean; value?: number }[]
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
    dailySummary: boolean
    soundEnabled: boolean
    volume: number
  }
  appearance: {
    theme: ThemePreference
    accentColor: string
    fontSize: "small" | "medium" | "large"
    animations: boolean
  }
  privacy: {
    dataCollection: boolean
    crashReports: boolean
    analytics: boolean
    locationAccess: boolean
    clipboardMonitor: boolean
  }
  data: {
    autoBackup: boolean
    backupFrequency: "daily" | "weekly" | "monthly"
  }
  general: {
    language: string
    timezone: string
    weekStartsOn: "sunday" | "monday"
    dateFormat: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD"
  }
}

export interface Workspace {
  schemaVersion: 1
  updatedAt: string
  tasks: Task[]
  notes: Note[]
  habits: Habit[]
  settings: AppSettings
  profile: UserProfile
}

export const WORKSPACE_CHANGED_EVENT = "managekar:workspace-changed"

export function notifyWorkspaceChanged(): void {
  if (typeof window === "undefined") {
    return
  }
  window.dispatchEvent(new Event(WORKSPACE_CHANGED_EVENT))
}
