import { z } from "zod"
import type { Prisma, PrismaClient } from "@prisma/client"

const taskSchema = z.object({
  title: z.string().trim().min(1),
  completed: z.boolean().optional(),
  priority: z.enum(["high", "medium", "low"]).optional(),
  dueDate: z.string().optional(),
  description: z.string().optional(),
  recurring: z.enum(["none", "daily", "weekly", "monthly"]).optional(),
  reminders: z.boolean().optional(),
  checklist: z.array(z.object({ id: z.number(), text: z.string(), completed: z.boolean() })).optional(),
})

const noteSchema = z.object({
  title: z.string().trim().min(1),
  content: z.string().optional(),
  transcription: z.string().optional(),
  voiceDuration: z.number().optional(),
  voiceNote: z
    .object({
      transcription: z.string().optional(),
      duration: z.number().optional(),
    })
    .optional(),
})

const habitSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  frequency: z.enum(["daily", "weekly", "custom"]).optional(),
  customDays: z.array(z.string()).optional(),
  goal: z.number().int().positive().optional(),
  unit: z.string().optional(),
  reminders: z.boolean().optional(),
  reminderTime: z.string().optional(),
  history: z
    .array(z.object({ date: z.string(), completed: z.boolean(), value: z.number().optional() }))
    .optional(),
})

const goalSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  priority: z.enum(["high", "medium", "low"]).optional(),
  targetDate: z.string().optional(),
  progress: z.number().int().min(0).max(100).optional(),
  status: z.enum(["active", "completed", "paused"]).optional(),
  milestones: z
    .array(z.object({ title: z.string(), completed: z.boolean().optional(), dueDate: z.string().optional() }))
    .optional(),
})

const settingsSchema = z
  .object({
    notifications: z
      .object({
        enabled: z.boolean().optional(),
        taskReminders: z.boolean().optional(),
        habitReminders: z.boolean().optional(),
        focusBreaks: z.boolean().optional(),
      })
      .optional(),
    appearance: z
      .object({
        theme: z.enum(["light", "dark", "system"]).optional(),
        fontSize: z.enum(["small", "medium", "large"]).optional(),
        animations: z.boolean().optional(),
      })
      .optional(),
    privacy: z.object({ clipboardMonitor: z.boolean().optional() }).optional(),
    general: z
      .object({
        weekStartsOn: z.enum(["sunday", "monday"]).optional(),
        dateFormat: z.enum(["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"]).optional(),
      })
      .optional(),
  })
  .optional()

const profileSchema = z
  .object({
    name: z.string().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    bio: z.string().optional(),
    avatar: z.string().optional(),
  })
  .optional()

const backupSchema = z.object({
  appName: z.string().optional(),
  schemaVersion: z.number().optional(),
  tasks: z.array(taskSchema).optional(),
  notes: z.array(noteSchema).optional(),
  habits: z.array(habitSchema).optional(),
  goals: z.array(goalSchema).optional(),
  timeEntries: z.array(z.unknown()).optional(),
  settings: settingsSchema,
  profile: profileSchema,
  user: profileSchema,
})

export function parseManageKarBackup(payload: unknown) {
  const parsed = backupSchema.safeParse(payload)
  if (!parsed.success) {
    const error = new Error("Invalid Manage.kar backup file.")
    ;(error as Error & { statusCode: number }).statusCode = 400
    throw error
  }
  if (parsed.data.schemaVersion !== 1 && parsed.data.appName !== "Manage.kar") {
    const error = new Error("This file is not a Manage.kar backup.")
    ;(error as Error & { statusCode: number }).statusCode = 400
    throw error
  }
  return parsed.data
}

export async function replaceUserWorkspace(prisma: PrismaClient, userId: string, payload: unknown) {
  const backup = parseManageKarBackup(payload)
  const profile = backup.profile ?? backup.user
  const settings = backup.settings

  await prisma.$transaction(async (tx) => {
    await tx.activeFocus.deleteMany({ where: { userId } })
    await tx.focusSession.deleteMany({ where: { userId } })
    await tx.timeEntry.deleteMany({ where: { userId } })
    await tx.goal.deleteMany({ where: { userId } })
    await tx.habit.deleteMany({ where: { userId } })
    await tx.note.deleteMany({ where: { userId } })
    await tx.task.deleteMany({ where: { userId } })

    if (backup.tasks?.length) {
      await tx.task.createMany({
        data: backup.tasks.map((task) => ({
          userId,
          title: task.title,
          completed: task.completed ?? false,
          priority: task.priority ?? "medium",
          dueDate: task.dueDate ?? "",
          description: task.description ?? "",
          recurring: task.recurring ?? "none",
          reminders: task.reminders ?? false,
          checklist: task.checklist ?? [],
        })),
      })
    }

    if (backup.notes?.length) {
      await tx.note.createMany({
        data: backup.notes.map((note) => ({
          userId,
          title: note.title,
          content: note.content ?? "",
          transcription: note.transcription ?? note.voiceNote?.transcription ?? "",
          voiceDuration: note.voiceDuration ?? note.voiceNote?.duration ?? 0,
        })),
      })
    }

    for (const habit of backup.habits ?? []) {
      await tx.habit.create({
        data: {
          userId,
          name: habit.name,
          description: habit.description ?? "",
          category: habit.category ?? "health",
          frequency: habit.frequency ?? "daily",
          customDays: habit.customDays ?? [],
          goal: habit.goal ?? 1,
          unit: habit.unit ?? "times",
          reminders: habit.reminders ?? false,
          reminderTime: habit.reminderTime ?? "09:00",
          history: habit.history?.length
            ? {
                create: habit.history.map((entry) => ({
                  date: entry.date,
                  completed: entry.completed,
                  value: entry.value,
                })),
              }
            : undefined,
        },
      })
    }

    for (const goal of backup.goals ?? []) {
      await tx.goal.create({
        data: {
          userId,
          title: goal.title,
          description: goal.description ?? "",
          category: goal.category ?? "personal",
          priority: goal.priority ?? "medium",
          targetDate: goal.targetDate ?? "",
          progress: goal.progress ?? 0,
          status: goal.status ?? "active",
          milestones: goal.milestones?.length
            ? {
                create: goal.milestones.map((item) => ({
                  title: item.title,
                  completed: item.completed ?? false,
                  dueDate: item.dueDate ?? "",
                })),
              }
            : undefined,
        },
      })
    }

    if (profile) {
      await tx.user.update({
        where: { id: userId },
        data: {
          name: profile.name,
          phone: profile.phone,
          location: profile.location,
          bio: profile.bio,
          avatar: profile.avatar,
        },
      })
    }

    if (settings) {
      const data = {
        notificationsEnabled: settings.notifications?.enabled,
        taskReminders: settings.notifications?.taskReminders,
        habitReminders: settings.notifications?.habitReminders,
        focusBreaks: settings.notifications?.focusBreaks,
        theme: settings.appearance?.theme,
        fontSize: settings.appearance?.fontSize,
        animations: settings.appearance?.animations,
        clipboardMonitor: settings.privacy?.clipboardMonitor,
        weekStartsOn: settings.general?.weekStartsOn,
        dateFormat: settings.general?.dateFormat,
      }
      const cleaned = stripUndefined(data)
      await tx.settings.upsert({
        where: { userId },
        create: { userId, ...cleaned } as Prisma.SettingsUncheckedCreateInput,
        update: cleaned,
      })
    }
  })
}

export async function clearUserWorkspace(prisma: PrismaClient, userId: string) {
  await prisma.$transaction([
    prisma.activeFocus.deleteMany({ where: { userId } }),
    prisma.focusSession.deleteMany({ where: { userId } }),
    prisma.timeEntry.deleteMany({ where: { userId } }),
    prisma.goal.deleteMany({ where: { userId } }),
    prisma.habit.deleteMany({ where: { userId } }),
    prisma.note.deleteMany({ where: { userId } }),
    prisma.task.deleteMany({ where: { userId } }),
  ])
}

function stripUndefined(value: Record<string, unknown>): Prisma.SettingsUncheckedUpdateInput {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as Prisma.SettingsUncheckedUpdateInput
}
