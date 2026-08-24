import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { PrismaClient } from "@prisma/client"
import type { FastifyInstance } from "fastify"
import { buildApp } from "./app.js"

const prisma = new PrismaClient()
let app: FastifyInstance

async function authToken() {
  const response = await app.inject({
    method: "POST",
    url: "/api/auth/register",
    payload: { email: `user-${Date.now()}@manage.kar`, password: "correct-horse", name: "Sara" },
  })
  expect(response.statusCode).toBe(201)
  return response.json() as { token: string; user: { id: string } }
}

describe("Manage.kar API", () => {
  beforeAll(async () => {
    app = await buildApp(prisma)
    await app.ready()
  })

  beforeEach(async () => {
    await prisma.habitHistory.deleteMany()
    await prisma.goalMilestone.deleteMany()
    await prisma.activeFocus.deleteMany()
    await prisma.focusSession.deleteMany()
    await prisma.timeEntry.deleteMany()
    await prisma.goal.deleteMany()
    await prisma.habit.deleteMany()
    await prisma.note.deleteMany()
    await prisma.task.deleteMany()
    await prisma.settings.deleteMany()
    await prisma.user.deleteMany()
  })

  afterAll(async () => {
    await app.close()
    await prisma.$disconnect()
  })

  it("reports health", async () => {
    const response = await app.inject({ method: "GET", url: "/health" })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ ok: true, service: "managekar-api" })
  })

  it("rejects short passwords", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: { email: "a@b.com", password: "short" },
    })
    expect(response.statusCode).toBe(400)
  })

  it("registers, logs in, and isolates another user's tasks", async () => {
    const first = await authToken()
    const created = await app.inject({
      method: "POST",
      url: "/api/tasks",
      headers: { authorization: `Bearer ${first.token}` },
      payload: { title: "Ship native app", priority: "high", dueDate: "2026-08-24" },
    })
    expect(created.statusCode).toBe(201)

    const second = await authToken()
    const leaked = await app.inject({
      method: "GET",
      url: "/api/tasks",
      headers: { authorization: `Bearer ${second.token}` },
    })
    expect(leaked.json()).toEqual([])
  })

  it("requires a bearer token", async () => {
    const response = await app.inject({ method: "GET", url: "/api/tasks" })
    expect(response.statusCode).toBe(401)
  })

  it("creates a note and stores a voice pointer", async () => {
    const { token } = await authToken()
    const note = await app.inject({
      method: "POST",
      url: "/api/notes",
      headers: { authorization: `Bearer ${token}` },
      payload: { title: "Voice idea", content: "Record later" },
    })
    expect(note.statusCode).toBe(201)
    const id = note.json().id as string
    const voice = await app.inject({
      method: "POST",
      url: `/api/notes/${id}/voice`,
      headers: { authorization: `Bearer ${token}` },
      payload: { transcription: "hello from the bowl", duration: 3, stored: true },
    })
    expect(voice.statusCode).toBe(200)
    expect(voice.json().transcription).toBe("hello from the bowl")
    expect(voice.json().voiceDuration).toBe(3)
  })

  it("toggles a habit and hydrates streak", async () => {
    const { token } = await authToken()
    const habit = await app.inject({
      method: "POST",
      url: "/api/habits",
      headers: { authorization: `Bearer ${token}` },
      payload: { name: "Walk", category: "health", frequency: "daily" },
    })
    expect(habit.statusCode).toBe(201)
    const toggled = await app.inject({
      method: "POST",
      url: `/api/habits/${habit.json().id}/toggle`,
      headers: { authorization: `Bearer ${token}` },
      payload: { date: "2026-08-24" },
    })
    expect(toggled.statusCode).toBe(200)
    expect(toggled.json().completedToday).toBe(true)
    expect(toggled.json().streak).toBeGreaterThanOrEqual(1)
  })

  it("adds a goal milestone and updates progress", async () => {
    const { token } = await authToken()
    const goal = await app.inject({
      method: "POST",
      url: "/api/goals",
      headers: { authorization: `Bearer ${token}` },
      payload: { title: "Ship", category: "work", targetDate: "2026-12-01" },
    })
    const updated = await app.inject({
      method: "POST",
      url: `/api/goals/${goal.json().id}/milestones`,
      headers: { authorization: `Bearer ${token}` },
      payload: { title: "API", dueDate: "2026-09-01" },
    })
    expect(updated.statusCode).toBe(201)
    expect(updated.json().milestones).toHaveLength(1)
  })

  it("starts and stops a time entry", async () => {
    const { token } = await authToken()
    const started = await app.inject({
      method: "POST",
      url: "/api/time-entries",
      headers: { authorization: `Bearer ${token}` },
      payload: { taskName: "Write API", project: "Work" },
    })
    expect(started.json().isRunning).toBe(true)
    const stopped = await app.inject({
      method: "POST",
      url: `/api/time-entries/${started.json().id}/stop`,
      headers: { authorization: `Bearer ${token}` },
    })
    expect(stopped.json().isRunning).toBe(false)
    expect(stopped.json().endTime).toBeTruthy()
  })

  it("starts a focus session", async () => {
    const { token } = await authToken()
    const focus = await app.inject({
      method: "POST",
      url: "/api/focus/start",
      headers: { authorization: `Bearer ${token}` },
      payload: { type: "pomodoro", durationMinutes: 25 },
    })
    expect(focus.statusCode).toBe(201)
    expect(focus.json().isRunning).toBe(true)
    const current = await app.inject({
      method: "GET",
      url: "/api/focus",
      headers: { authorization: `Bearer ${token}` },
    })
    expect(current.json().active.sessionId).toBe(focus.json().sessionId)
  })
})
