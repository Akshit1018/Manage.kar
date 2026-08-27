import { existsSync } from "node:fs"
import { resolve } from "node:path"
import Fastify, { type FastifyInstance, type FastifyRequest } from "fastify"
import cors from "@fastify/cors"
import fastifyStatic from "@fastify/static"
import jwt from "@fastify/jwt"
import multipart from "@fastify/multipart"
import bcrypt from "bcryptjs"
import { Prisma, type PrismaClient } from "@prisma/client"
import { z } from "zod"
import { computeStreak, isHabitScheduledOn, type HabitFrequency } from "./domain/habits.js"
import { localDateKey } from "./domain/dates.js"
import { clearUserWorkspace, replaceUserWorkspace } from "./import-backup.js"
import { defaultVoiceDir, readVoiceFile, saveVoiceFile, voiceMime } from "./voice.js"

export type BuildAppOptions = {
  voiceDir?: string
  webDir?: string
}

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().trim().min(1).max(80).optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const taskSchema = z.object({
  title: z.string().trim().min(1),
  completed: z.boolean().optional(),
  priority: z.enum(["high", "medium", "low"]).optional(),
  dueDate: z.string().min(1),
  description: z.string().optional(),
  recurring: z.enum(["none", "daily", "weekly", "monthly"]).optional(),
  reminders: z.boolean().optional(),
  checklist: z.array(z.object({ id: z.number(), text: z.string(), completed: z.boolean() })).optional(),
})

const noteSchema = z.object({
  title: z.string().trim().min(1),
  content: z.string().optional(),
})

const habitSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().optional(),
  category: z.enum(["health", "productivity", "learning", "lifestyle", "fitness", "mindfulness"]).optional(),
  frequency: z.enum(["daily", "weekly", "custom"]).optional(),
  customDays: z.array(z.string()).optional(),
  goal: z.number().int().positive().optional(),
  unit: z.string().optional(),
  reminders: z.boolean().optional(),
  reminderTime: z.string().optional(),
})

const goalSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().optional(),
  category: z.enum(["personal", "work", "health", "learning", "financial"]).optional(),
  priority: z.enum(["high", "medium", "low"]).optional(),
  targetDate: z.string().optional(),
  progress: z.number().int().min(0).max(100).optional(),
  status: z.enum(["active", "completed", "paused"]).optional(),
})

type Authed = FastifyRequest & { user: { sub: string } }

function parse<T>(schema: z.ZodType<T>, payload: unknown) {
  const parsed = schema.safeParse(payload)
  if (!parsed.success) {
    const error = new Error(parsed.error.issues[0]?.message ?? "Invalid payload")
    ;(error as Error & { statusCode: number }).statusCode = 400
    throw error
  }
  return parsed.data
}

function hydrateHabit(
  habit: {
    id: string
    name: string
    description: string
    category: string
    frequency: string
    customDays: Prisma.JsonValue
    goal: number
    unit: string
    reminders: boolean
    reminderTime: string
    createdAt: Date
    updatedAt: Date
    history: Array<{ date: string; completed: boolean; value: number | null }>
  },
  weekStartsOn: "sunday" | "monday",
  today = localDateKey(),
) {
  const customDays = Array.isArray(habit.customDays) ? (habit.customDays as string[]) : []
  const frequency = habit.frequency as HabitFrequency
  const completedToday = habit.history.some((entry) => entry.date === today && entry.completed)
  return {
    id: habit.id,
    name: habit.name,
    description: habit.description,
    category: habit.category,
    frequency,
    customDays,
    goal: habit.goal,
    unit: habit.unit,
    reminders: habit.reminders,
    reminderTime: habit.reminderTime,
    createdAt: habit.createdAt.toISOString(),
    updatedAt: habit.updatedAt.toISOString(),
    history: habit.history,
    completedToday,
    completed: completedToday,
    streak: computeStreak(habit.history, today, (date) =>
      isHabitScheduledOn(frequency, customDays, date, weekStartsOn),
    ),
  }
}

export async function buildApp(prisma: PrismaClient, options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger: false })
  const secret = process.env.JWT_SECRET ?? "dev-secret-change-on-vps"
  const voiceDir = options.voiceDir ?? defaultVoiceDir()

  await app.register(cors, { origin: true })
  await app.register(jwt, { secret })
  await app.register(multipart, { limits: { fileSize: 25 * 1024 * 1024 } })

  app.decorate("authenticate", async (request: FastifyRequest) => {
    try {
      await request.jwtVerify()
    } catch {
      const error = new Error("Sign in required.")
      ;(error as Error & { statusCode: number }).statusCode = 401
      throw error
    }
  })

  const userId = (request: FastifyRequest) => (request as Authed).user.sub

  const weekStart = async (id: string) => {
    const settings = await prisma.settings.findUnique({ where: { userId: id } })
    return (settings?.weekStartsOn === "sunday" ? "sunday" : "monday") as "sunday" | "monday"
  }

  app.get("/health", async () => ({ ok: true, service: "managekar-api" }))

  app.post("/api/auth/register", async (request, reply) => {
    const body = parse(registerSchema, request.body)
    const existing = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } })
    if (existing) {
      return reply.code(409).send({ error: "That email is already registered." })
    }
    const user = await prisma.user.create({
      data: {
        email: body.email.toLowerCase(),
        passwordHash: await bcrypt.hash(body.password, 10),
        name: body.name ?? "User",
        settings: { create: {} },
      },
    })
    const token = app.jwt.sign({ sub: user.id }, { expiresIn: "30d" })
    return reply.code(201).send({ token, user: serializeUser(user) })
  })

  app.post("/api/auth/login", async (request, reply) => {
    const body = parse(loginSchema, request.body)
    const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } })
    if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
      return reply.code(401).send({ error: "Email or password is wrong." })
    }
    const token = app.jwt.sign({ sub: user.id }, { expiresIn: "30d" })
    return { token, user: serializeUser(user) }
  })

  app.post("/api/auth/logout", async () => ({ ok: true }))

  app.get("/api/me", { preHandler: app.authenticate }, async (request) => {
    const id = userId(request)
    const user = await prisma.user.findUniqueOrThrow({ where: { id }, include: { settings: true } })
    return { user: serializeUser(user), settings: serializeSettings(user.settings) }
  })

  app.patch("/api/me", { preHandler: app.authenticate }, async (request) => {
    const id = userId(request)
    const body = z
      .object({
        name: z.string().optional(),
        phone: z.string().optional(),
        location: z.string().optional(),
        bio: z.string().optional(),
        avatar: z.string().optional(),
        settings: z
          .object({
            notificationsEnabled: z.boolean().optional(),
            taskReminders: z.boolean().optional(),
            habitReminders: z.boolean().optional(),
            focusBreaks: z.boolean().optional(),
            theme: z.enum(["light", "dark", "system"]).optional(),
            fontSize: z.enum(["small", "medium", "large"]).optional(),
            animations: z.boolean().optional(),
            clipboardMonitor: z.boolean().optional(),
            weekStartsOn: z.enum(["sunday", "monday"]).optional(),
            dateFormat: z.enum(["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"]).optional(),
          })
          .optional(),
      })
      .parse(request.body ?? {})
    const user = await prisma.user.update({
      where: { id },
      data: {
        name: body.name,
        phone: body.phone,
        location: body.location,
        bio: body.bio,
        avatar: body.avatar,
        settings: body.settings ? { upsert: { create: body.settings, update: body.settings } } : undefined,
      },
      include: { settings: true },
    })
    return { user: serializeUser(user), settings: serializeSettings(user.settings) }
  })

  app.get("/api/tasks", { preHandler: app.authenticate }, async (request) => {
    const tasks = await prisma.task.findMany({ where: { userId: userId(request) }, orderBy: { createdAt: "desc" } })
    return tasks.map(serializeTask)
  })

  app.post("/api/tasks", { preHandler: app.authenticate }, async (request, reply) => {
    const body = parse(taskSchema, request.body)
    const task = await prisma.task.create({
      data: {
        userId: userId(request),
        title: body.title,
        completed: body.completed ?? false,
        priority: body.priority ?? "medium",
        dueDate: body.dueDate,
        description: body.description ?? "",
        recurring: body.recurring ?? "none",
        reminders: body.reminders ?? false,
        checklist: body.checklist ?? [],
      },
    })
    return reply.code(201).send(serializeTask(task))
  })

  app.patch("/api/tasks/:id", { preHandler: app.authenticate }, async (request) => {
    const id = (request.params as { id: string }).id
    const body = taskSchema.partial().parse(request.body ?? {})
    await prisma.task.findFirstOrThrow({ where: { id, userId: userId(request) } })
    const task = await prisma.task.update({
      where: { id },
      data: {
        ...body,
        checklist: body.checklist ?? undefined,
      },
    })
    return serializeTask(task)
  })

  app.delete("/api/tasks/:id", { preHandler: app.authenticate }, async (request, reply) => {
    const id = (request.params as { id: string }).id
    await prisma.task.findFirstOrThrow({ where: { id, userId: userId(request) } })
    await prisma.task.delete({ where: { id } })
    return reply.code(204).send()
  })

  app.get("/api/notes", { preHandler: app.authenticate }, async (request) => {
    const notes = await prisma.note.findMany({ where: { userId: userId(request) }, orderBy: { createdAt: "desc" } })
    return notes.map(serializeNote)
  })

  app.post("/api/notes", { preHandler: app.authenticate }, async (request, reply) => {
    const body = parse(noteSchema, request.body)
    const note = await prisma.note.create({
      data: { userId: userId(request), title: body.title, content: body.content ?? "" },
    })
    return reply.code(201).send(serializeNote(note))
  })

  app.patch("/api/notes/:id", { preHandler: app.authenticate }, async (request) => {
    const body = noteSchema.partial().parse(request.body ?? {})
    const id = (request.params as { id: string }).id
    await prisma.note.findFirstOrThrow({ where: { id, userId: userId(request) } })
    const note = await prisma.note.update({
      where: { id },
      data: body,
    })
    return serializeNote(note)
  })

  app.delete("/api/notes/:id", { preHandler: app.authenticate }, async (request, reply) => {
    const id = (request.params as { id: string }).id
    await prisma.note.findFirstOrThrow({ where: { id, userId: userId(request) } })
    await prisma.note.delete({ where: { id } })
    return reply.code(204).send()
  })

  app.post("/api/notes/:id/voice", { preHandler: app.authenticate }, async (request) => {
    const id = (request.params as { id: string }).id
    const owner = userId(request)
    await prisma.note.findFirstOrThrow({ where: { id, userId: owner } })
    const contentType = String(request.headers["content-type"] ?? "")
    if (contentType.includes("multipart/form-data")) {
      let transcription = ""
      let duration = 0
      let bytes: Buffer | undefined
      let filename = "note.m4a"
      for await (const part of request.parts()) {
        if (part.type === "file") {
          filename = part.filename
          bytes = await part.toBuffer()
        } else if (part.fieldname === "transcription") {
          transcription = String(part.value ?? "")
        } else if (part.fieldname === "duration") {
          duration = Number(part.value) || 0
        }
      }
      if (!bytes) {
        throw httpError(400, "Attach an audio file named audio.")
      }
      const relative = await saveVoiceFile(voiceDir, owner, id, bytes, filename)
      const note = await prisma.note.update({
        where: { id },
        data: { transcription, voiceDuration: duration, voicePath: relative },
      })
      return serializeNote(note)
    }
    const body = z
      .object({
        transcription: z.string().optional(),
        duration: z.number().int().nonnegative().optional(),
        stored: z.boolean().optional(),
      })
      .parse(request.body ?? {})
    const note = await prisma.note.update({
      where: { id },
      data: {
        transcription: body.transcription ?? "",
        voiceDuration: body.duration ?? 0,
        voicePath: body.stored ? `${owner}/${id}` : undefined,
      },
    })
    return serializeNote(note)
  })

  app.get("/api/notes/:id/voice", { preHandler: app.authenticate }, async (request, reply) => {
    const id = (request.params as { id: string }).id
    const note = await prisma.note.findFirst({ where: { id, userId: userId(request) } })
    if (!note?.voicePath) {
      throw httpError(404, "Voice note not found.")
    }
    try {
      const bytes = await readVoiceFile(voiceDir, note.voicePath)
      return reply.type(voiceMime(note.voicePath)).send(bytes)
    } catch {
      throw httpError(404, "Voice note not found.")
    }
  })

  app.get("/api/habits", { preHandler: app.authenticate }, async (request) => {
    const id = userId(request)
    const start = await weekStart(id)
    const habits = await prisma.habit.findMany({
      where: { userId: id },
      include: { history: true },
      orderBy: { createdAt: "desc" },
    })
    return habits.map((habit) => hydrateHabit(habit, start))
  })

  app.post("/api/habits", { preHandler: app.authenticate }, async (request, reply) => {
    const body = parse(habitSchema, request.body)
    const id = userId(request)
    const habit = await prisma.habit.create({
      data: {
        userId: id,
        name: body.name,
        description: body.description ?? "",
        category: body.category ?? "health",
        frequency: body.frequency ?? "daily",
        customDays: body.customDays ?? [],
        goal: body.goal ?? 1,
        unit: body.unit ?? "times",
        reminders: body.reminders ?? false,
        reminderTime: body.reminderTime ?? "09:00",
      },
      include: { history: true },
    })
    return reply.code(201).send(hydrateHabit(habit, await weekStart(id)))
  })

  app.patch("/api/habits/:id", { preHandler: app.authenticate }, async (request) => {
    const body = habitSchema.partial().parse(request.body ?? {})
    const id = userId(request)
    const habitId = (request.params as { id: string }).id
    await prisma.habit.findFirstOrThrow({ where: { id: habitId, userId: id } })
    const habit = await prisma.habit.update({
      where: { id: habitId },
      data: { ...body, customDays: body.customDays ?? undefined },
      include: { history: true },
    })
    return hydrateHabit(habit, await weekStart(id))
  })

  app.delete("/api/habits/:id", { preHandler: app.authenticate }, async (request, reply) => {
    const habitId = (request.params as { id: string }).id
    await prisma.habit.findFirstOrThrow({ where: { id: habitId, userId: userId(request) } })
    await prisma.habit.delete({ where: { id: habitId } })
    return reply.code(204).send()
  })

  app.post("/api/habits/:id/toggle", { preHandler: app.authenticate }, async (request) => {
    const id = userId(request)
    const habitId = (request.params as { id: string }).id
    const date = z.object({ date: z.string().optional() }).parse(request.body ?? {}).date ?? localDateKey()
    const habit = await prisma.habit.findFirstOrThrow({ where: { id: habitId, userId: id }, include: { history: true } })
    const start = await weekStart(id)
    const customDays = Array.isArray(habit.customDays) ? (habit.customDays as string[]) : []
    if (!isHabitScheduledOn(habit.frequency as HabitFrequency, customDays, date, start)) {
      return hydrateHabit(habit, start)
    }
    const existing = habit.history.find((entry) => entry.date === date)
    if (existing) {
      await prisma.habitHistory.update({
        where: { id: existing.id },
        data: { completed: !existing.completed },
      })
    } else {
      await prisma.habitHistory.create({ data: { habitId, date, completed: true } })
    }
    const next = await prisma.habit.findFirstOrThrow({ where: { id: habitId, userId: id }, include: { history: true } })
    return hydrateHabit(next, start, date)
  })

  app.get("/api/goals", { preHandler: app.authenticate }, async (request) => {
    const goals = await prisma.goal.findMany({
      where: { userId: userId(request) },
      include: { milestones: true },
      orderBy: { createdAt: "desc" },
    })
    return goals.map(serializeGoal)
  })

  app.post("/api/goals", { preHandler: app.authenticate }, async (request, reply) => {
    const body = parse(goalSchema, request.body)
    const goal = await prisma.goal.create({
      data: {
        userId: userId(request),
        title: body.title,
        description: body.description ?? "",
        category: body.category ?? "personal",
        priority: body.priority ?? "medium",
        targetDate: body.targetDate ?? "",
        progress: body.progress ?? 0,
        status: body.status ?? "active",
      },
      include: { milestones: true },
    })
    return reply.code(201).send(serializeGoal(goal))
  })

  app.patch("/api/goals/:id", { preHandler: app.authenticate }, async (request) => {
    const body = goalSchema.partial().parse(request.body ?? {})
    const id = (request.params as { id: string }).id
    await prisma.goal.findFirstOrThrow({ where: { id, userId: userId(request) } })
    const goal = await prisma.goal.update({
      where: { id },
      data: body,
      include: { milestones: true },
    })
    return serializeGoal(goal)
  })

  app.delete("/api/goals/:id", { preHandler: app.authenticate }, async (request, reply) => {
    const id = (request.params as { id: string }).id
    await prisma.goal.findFirstOrThrow({ where: { id, userId: userId(request) } })
    await prisma.goal.delete({ where: { id } })
    return reply.code(204).send()
  })

  app.post("/api/goals/:id/milestones", { preHandler: app.authenticate }, async (request, reply) => {
    const body = z.object({ title: z.string().trim().min(1), dueDate: z.string().optional() }).parse(request.body)
    const goalId = (request.params as { id: string }).id
    await prisma.goal.findFirstOrThrow({ where: { id: goalId, userId: userId(request) } })
    await prisma.goalMilestone.create({ data: { goalId, title: body.title, dueDate: body.dueDate ?? "" } })
    return reply.code(201).send(serializeGoal(await refreshGoalProgress(prisma, goalId)))
  })

  app.patch("/api/goals/:id/milestones/:milestoneId", { preHandler: app.authenticate }, async (request) => {
    const { id: goalId, milestoneId } = request.params as { id: string; milestoneId: string }
    await prisma.goal.findFirstOrThrow({ where: { id: goalId, userId: userId(request) } })
    const body = z.object({ completed: z.boolean(), title: z.string().optional(), dueDate: z.string().optional() }).parse(request.body ?? {})
    const milestone = await prisma.goalMilestone.findFirst({ where: { id: milestoneId, goalId } })
    if (!milestone) {
      throw httpError(404, "Milestone not found.")
    }
    await prisma.goalMilestone.update({
      where: { id: milestoneId },
      data: { completed: body.completed, title: body.title, dueDate: body.dueDate },
    })
    return serializeGoal(await refreshGoalProgress(prisma, goalId))
  })

  app.get("/api/time-entries", { preHandler: app.authenticate }, async (request) => {
    const entries = await prisma.timeEntry.findMany({
      where: { userId: userId(request) },
      orderBy: { createdAt: "desc" },
    })
    return entries.map(serializeTime)
  })

  app.post("/api/time-entries", { preHandler: app.authenticate }, async (request, reply) => {
    const body = z.object({ taskName: z.string().trim().min(1), project: z.string().optional() }).parse(request.body)
    const id = userId(request)
    await prisma.timeEntry.updateMany({
      where: { userId: id, isRunning: true },
      data: { isRunning: false, endTime: new Date() },
    })
    const entry = await prisma.timeEntry.create({
      data: {
        userId: id,
        taskName: body.taskName,
        project: body.project ?? "Personal",
        startTime: new Date(),
        isRunning: true,
      },
    })
    return reply.code(201).send(serializeTime(entry))
  })

  app.post("/api/time-entries/:id/pause", { preHandler: app.authenticate }, async (request) => {
    const existing = await prisma.timeEntry.findFirstOrThrow({
      where: { id: (request.params as { id: string }).id, userId: userId(request) },
    })
    const duration = accumulatedDuration(existing, new Date())
    const entry = await prisma.timeEntry.update({
      where: { id: existing.id },
      data: { isRunning: false, duration, endTime: null },
    })
    return serializeTime(entry)
  })

  app.post("/api/time-entries/:id/resume", { preHandler: app.authenticate }, async (request) => {
    const existing = await prisma.timeEntry.findFirstOrThrow({
      where: { id: (request.params as { id: string }).id, userId: userId(request) },
    })
    const id = userId(request)
    await prisma.timeEntry.updateMany({
      where: { userId: id, isRunning: true, NOT: { id: existing.id } },
      data: { isRunning: false, endTime: new Date() },
    })
    const entry = await prisma.timeEntry.update({
      where: { id: existing.id },
      data: { isRunning: true, startTime: new Date(), endTime: null },
    })
    return serializeTime(entry)
  })

  app.post("/api/time-entries/:id/stop", { preHandler: app.authenticate }, async (request) => {
    const existing = await prisma.timeEntry.findFirstOrThrow({
      where: { id: (request.params as { id: string }).id, userId: userId(request) },
    })
    const endTime = new Date()
    const duration = accumulatedDuration(existing, endTime)
    const entry = await prisma.timeEntry.update({
      where: { id: existing.id },
      data: { isRunning: false, endTime, duration },
    })
    return serializeTime(entry)
  })

  app.get("/api/focus", { preHandler: app.authenticate }, async (request) => {
    const id = userId(request)
    const [active, sessions] = await Promise.all([
      prisma.activeFocus.findUnique({ where: { userId: id } }),
      prisma.focusSession.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" }, take: 20 }),
    ])
    return { active: active ? serializeActive(active) : null, sessions: sessions.map(serializeFocus) }
  })

  app.post("/api/focus/pause", { preHandler: app.authenticate }, async (request) => {
    const id = userId(request)
    const active = await prisma.activeFocus.findUnique({ where: { userId: id } })
    if (!active) {
      throw httpError(404, "No focus session is running.")
    }
    const remainingSeconds = liveRemaining(active)
    const next = await prisma.activeFocus.update({
      where: { userId: id },
      data: { isRunning: false, remainingSeconds },
    })
    return serializeActive(next)
  })

  app.post("/api/focus/resume", { preHandler: app.authenticate }, async (request) => {
    const id = userId(request)
    const active = await prisma.activeFocus.findUnique({ where: { userId: id } })
    if (!active) {
      throw httpError(404, "No focus session is running.")
    }
    const next = await prisma.activeFocus.update({
      where: { userId: id },
      data: { isRunning: true, startedAt: new Date() },
    })
    return serializeActive(next)
  })

  app.post("/api/focus/start", { preHandler: app.authenticate }, async (request, reply) => {
    const body = z
      .object({
        type: z.enum(["pomodoro", "deep-work", "break", "custom"]),
        durationMinutes: z.number().int().positive(),
      })
      .parse(request.body)
    const id = userId(request)
    const session = await prisma.focusSession.create({
      data: {
        userId: id,
        type: body.type,
        durationSeconds: body.durationMinutes * 60,
        completed: false,
        startTime: new Date(),
      },
    })
    const active = await prisma.activeFocus.upsert({
      where: { userId: id },
      create: {
        userId: id,
        sessionId: session.id,
        type: body.type,
        durationSeconds: session.durationSeconds,
        remainingSeconds: session.durationSeconds,
        isRunning: true,
        startedAt: new Date(),
      },
      update: {
        sessionId: session.id,
        type: body.type,
        durationSeconds: session.durationSeconds,
        remainingSeconds: session.durationSeconds,
        isRunning: true,
        startedAt: new Date(),
        accumulatedElapsed: 0,
      },
    })
    return reply.code(201).send(serializeActive(active))
  })

  app.post("/api/focus/stop", { preHandler: app.authenticate }, async (request) => {
    const id = userId(request)
    const active = await prisma.activeFocus.findUnique({ where: { userId: id } })
    if (active) {
      await prisma.focusSession.update({
        where: { id: active.sessionId },
        data: { endTime: new Date(), completed: false },
      })
      await prisma.activeFocus.delete({ where: { userId: id } })
    }
    return { ok: true }
  })

  app.get("/api/workspace", { preHandler: app.authenticate }, async (request) => {
    const id = userId(request)
    const start = await weekStart(id)
    const [user, tasks, notes, habits, goals, timeEntries, focus, sessions] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id }, include: { settings: true } }),
      prisma.task.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" } }),
      prisma.note.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" } }),
      prisma.habit.findMany({ where: { userId: id }, include: { history: true } }),
      prisma.goal.findMany({ where: { userId: id }, include: { milestones: true } }),
      prisma.timeEntry.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" } }),
      prisma.activeFocus.findUnique({ where: { userId: id } }),
      prisma.focusSession.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" }, take: 20 }),
    ])
    const snapshot = {
      user: serializeUser(user),
      settings: serializeSettings(user.settings),
      tasks: tasks.map(serializeTask),
      notes: notes.map(serializeNote),
      habits: habits.map((habit) => hydrateHabit(habit, start)),
      goals: goals.map(serializeGoal),
      timeEntries: timeEntries.map(serializeTime),
      focusSessions: sessions.map(serializeFocus),
      activeFocus: focus ? serializeActive(focus) : null,
    }
    return snapshot
  })

  app.get("/api/export", { preHandler: app.authenticate }, async (request) => {
    const workspace = await app.inject({
      method: "GET",
      url: "/api/workspace",
      headers: { authorization: request.headers.authorization ?? "" },
    })
    const snapshot = workspace.json() as Record<string, unknown>
    return {
      appName: "Manage.kar",
      schemaVersion: 1,
      exportDate: new Date().toISOString(),
      ...snapshot,
    }
  })

  app.post("/api/import", { preHandler: app.authenticate }, async (request) => {
    await replaceUserWorkspace(prisma, userId(request), request.body)
    return { ok: true }
  })

  app.delete("/api/workspace", { preHandler: app.authenticate }, async (request, reply) => {
    await clearUserWorkspace(prisma, userId(request))
    return reply.code(204).send()
  })

  app.setErrorHandler((error, _request, reply) => {
    const err = error as Error & { statusCode?: number }
    const status = typeof err.statusCode === "number" ? err.statusCode : 400
    const code = status >= 500 ? 500 : status
    return reply.code(code).send({ error: err.message })
  })

  if (options.webDir && existsSync(options.webDir)) {
    await app.register(fastifyStatic, { root: resolve(options.webDir), wildcard: false })
    app.setNotFoundHandler((request, reply) => {
      if (request.method === "GET" && !request.url.startsWith("/api")) {
        return reply.sendFile("index.html")
      }
      return reply.code(404).send({ error: "Not found" })
    })
  }

  return app
}

function httpError(statusCode: number, message: string) {
  const error = new Error(message)
  ;(error as Error & { statusCode: number }).statusCode = statusCode
  return error
}

function accumulatedDuration(
  entry: { duration: number; isRunning: boolean; startTime: Date },
  now: Date,
) {
  if (!entry.isRunning) {
    return entry.duration
  }
  return entry.duration + Math.max(0, now.getTime() - entry.startTime.getTime())
}

function liveRemaining(active: { isRunning: boolean; remainingSeconds: number; startedAt: Date }) {
  if (!active.isRunning) {
    return active.remainingSeconds
  }
  const elapsed = Math.floor((Date.now() - active.startedAt.getTime()) / 1000)
  return Math.max(0, active.remainingSeconds - elapsed)
}

async function refreshGoalProgress(prisma: PrismaClient, goalId: string) {
  const goal = await prisma.goal.findFirstOrThrow({ where: { id: goalId }, include: { milestones: true } })
  const progress =
    goal.milestones.length > 0
      ? Math.round((goal.milestones.filter((item) => item.completed).length / goal.milestones.length) * 100)
      : goal.progress
  return prisma.goal.update({
    where: { id: goalId },
    data: { progress },
    include: { milestones: true },
  })
}

function serializeUser(user: { id: string; email: string; name: string; phone: string; location: string; bio: string; avatar: string; createdAt: Date }) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    location: user.location,
    bio: user.bio,
    avatar: user.avatar,
    joinDate: user.createdAt.toISOString().slice(0, 10),
  }
}

function serializeSettings(settings: {
  notificationsEnabled: boolean
  taskReminders: boolean
  habitReminders: boolean
  focusBreaks: boolean
  theme: string
  fontSize: string
  animations: boolean
  clipboardMonitor: boolean
  weekStartsOn: string
  dateFormat: string
} | null) {
  return {
    notifications: {
      enabled: settings?.notificationsEnabled ?? false,
      taskReminders: settings?.taskReminders ?? true,
      habitReminders: settings?.habitReminders ?? true,
      focusBreaks: settings?.focusBreaks ?? true,
    },
    appearance: {
      theme: settings?.theme ?? "system",
      fontSize: settings?.fontSize ?? "medium",
      animations: settings?.animations ?? true,
    },
    privacy: { clipboardMonitor: settings?.clipboardMonitor ?? false },
    general: {
      weekStartsOn: settings?.weekStartsOn ?? "monday",
      dateFormat: settings?.dateFormat ?? "YYYY-MM-DD",
    },
  }
}

function serializeTask(task: {
  id: string
  title: string
  completed: boolean
  priority: string
  dueDate: string
  description: string
  recurring: string
  reminders: boolean
  checklist: Prisma.JsonValue
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: task.id,
    title: task.title,
    completed: task.completed,
    priority: task.priority,
    dueDate: task.dueDate,
    description: task.description,
    recurring: task.recurring,
    reminders: task.reminders,
    checklist: task.checklist,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  }
}

function serializeNote(note: {
  id: string
  title: string
  content: string
  voicePath: string | null
  transcription: string
  voiceDuration: number
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: note.id,
    title: note.title,
    content: note.content,
    transcription: note.transcription,
    voiceDuration: note.voiceDuration,
    voicePath: note.voicePath,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  }
}

function serializeGoal(goal: {
  id: string
  title: string
  description: string
  category: string
  priority: string
  targetDate: string
  progress: number
  status: string
  createdAt: Date
  updatedAt: Date
  milestones: Array<{ id: string; title: string; completed: boolean; dueDate: string }>
}) {
  return {
    ...goal,
    createdAt: goal.createdAt.toISOString(),
    updatedAt: goal.updatedAt.toISOString(),
  }
}

function serializeTime(entry: {
  id: string
  taskName: string
  project: string
  startTime: Date
  endTime: Date | null
  duration: number
  isRunning: boolean
}) {
  return {
    id: entry.id,
    taskName: entry.taskName,
    project: entry.project,
    startTime: entry.startTime.toISOString(),
    endTime: entry.endTime?.toISOString() ?? null,
    duration: entry.duration,
    isRunning: entry.isRunning,
  }
}

function serializeFocus(session: {
  id: string
  type: string
  durationSeconds: number
  completed: boolean
  startTime: Date
  endTime: Date | null
}) {
  return {
    id: session.id,
    type: session.type,
    durationSeconds: session.durationSeconds,
    completed: session.completed,
    startTime: session.startTime.toISOString(),
    endTime: session.endTime?.toISOString() ?? null,
  }
}

function serializeActive(active: {
  sessionId: string
  type: string
  durationSeconds: number
  remainingSeconds: number
  isRunning: boolean
  startedAt: Date
  accumulatedElapsed: number
}) {
  return {
    sessionId: active.sessionId,
    type: active.type,
    durationSeconds: active.durationSeconds,
    remainingSeconds: liveRemaining(active),
    isRunning: active.isRunning,
    startedAt: active.startedAt.toISOString(),
    accumulatedElapsed: active.accumulatedElapsed,
  }
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest) => Promise<void>
  }
}
