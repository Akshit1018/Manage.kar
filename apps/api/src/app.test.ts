import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { PrismaClient } from "@prisma/client"
import type { FastifyInstance } from "fastify"
import { buildApp } from "./app.js"

const prisma = new PrismaClient()
const voiceDir = mkdtempSync(join(tmpdir(), "managekar-voice-"))
let app: FastifyInstance

function multipartBody(fields: Record<string, string>, file: { filename: string; content: Buffer; type: string }) {
  const boundary = "----formdata-managekar"
  const chunks: Buffer[] = []
  for (const [name, value] of Object.entries(fields)) {
    chunks.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`,
      ),
    )
  }
  chunks.push(
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="audio"; filename="${file.filename}"\r\nContent-Type: ${file.type}\r\n\r\n`,
    ),
  )
  chunks.push(file.content)
  chunks.push(Buffer.from(`\r\n--${boundary}--\r\n`))
  return {
    headers: { "content-type": `multipart/form-data; boundary=${boundary}` },
    payload: Buffer.concat(chunks),
  }
}

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
    app = await buildApp(prisma, { voiceDir })
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
    rmSync(voiceDir, { recursive: true, force: true })
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

  it("stores a multipart voice file and serves it only to the owner", async () => {
    const first = await authToken()
    const note = await app.inject({
      method: "POST",
      url: "/api/notes",
      headers: { authorization: `Bearer ${first.token}` },
      payload: { title: "Voice idea", content: "Record later" },
    })
    const id = note.json().id as string
    const audio = Buffer.from("m4a-fixture-bytes")
    const body = multipartBody({ transcription: "hello from the bowl", duration: "4" }, {
      filename: "note.m4a",
      content: audio,
      type: "audio/mp4",
    })
    const uploaded = await app.inject({
      method: "POST",
      url: `/api/notes/${id}/voice`,
      headers: { authorization: `Bearer ${first.token}`, ...body.headers },
      payload: body.payload,
    })
    expect(uploaded.statusCode).toBe(200)
    expect(uploaded.json().voiceDuration).toBe(4)
    expect(uploaded.json().voicePath).toBeTruthy()

    const download = await app.inject({
      method: "GET",
      url: `/api/notes/${id}/voice`,
      headers: { authorization: `Bearer ${first.token}` },
    })
    expect(download.statusCode).toBe(200)
    expect(download.rawPayload.equals(audio)).toBe(true)

    const second = await authToken()
    const leaked = await app.inject({
      method: "GET",
      url: `/api/notes/${id}/voice`,
      headers: { authorization: `Bearer ${second.token}` },
    })
    expect(leaked.statusCode).toBe(404)
  })

  it("pauses a running timer without double-counting on stop", async () => {
    const { token } = await authToken()
    const started = await app.inject({
      method: "POST",
      url: "/api/time-entries",
      headers: { authorization: `Bearer ${token}` },
      payload: { taskName: "Write API", project: "Work" },
    })
    const paused = await app.inject({
      method: "POST",
      url: `/api/time-entries/${started.json().id}/pause`,
      headers: { authorization: `Bearer ${token}` },
    })
    expect(paused.statusCode).toBe(200)
    expect(paused.json().isRunning).toBe(false)
    expect(paused.json().endTime).toBeNull()
    const durationAfterPause = paused.json().duration as number

    const stopped = await app.inject({
      method: "POST",
      url: `/api/time-entries/${started.json().id}/stop`,
      headers: { authorization: `Bearer ${token}` },
    })
    expect(stopped.json().isRunning).toBe(false)
    expect(stopped.json().endTime).toBeTruthy()
    expect(stopped.json().duration).toBe(durationAfterPause)
  })

  it("pauses focus and reports remaining time from the last resume", async () => {
    const { token, user } = await authToken()
    const focus = await app.inject({
      method: "POST",
      url: "/api/focus/start",
      headers: { authorization: `Bearer ${token}` },
      payload: { type: "pomodoro", durationMinutes: 25 },
    })
    expect(focus.statusCode).toBe(201)
    await prisma.activeFocus.update({
      where: { userId: user.id },
      data: { startedAt: new Date(Date.now() - 10_000), remainingSeconds: 60 },
    })
    const current = await app.inject({
      method: "GET",
      url: "/api/focus",
      headers: { authorization: `Bearer ${token}` },
    })
    expect(current.json().active.remainingSeconds).toBeLessThanOrEqual(50)
    expect(current.json().active.remainingSeconds).toBeGreaterThanOrEqual(45)

    const paused = await app.inject({
      method: "POST",
      url: "/api/focus/pause",
      headers: { authorization: `Bearer ${token}` },
    })
    expect(paused.json().isRunning).toBe(false)
    const remaining = paused.json().remainingSeconds as number
    const resumed = await app.inject({
      method: "POST",
      url: "/api/focus/resume",
      headers: { authorization: `Bearer ${token}` },
    })
    expect(resumed.json().isRunning).toBe(true)
    expect(resumed.json().remainingSeconds).toBe(remaining)
  })

  it("toggles a goal milestone and updates progress", async () => {
    const { token } = await authToken()
    const goal = await app.inject({
      method: "POST",
      url: "/api/goals",
      headers: { authorization: `Bearer ${token}` },
      payload: { title: "Ship", category: "work", targetDate: "2026-12-01" },
    })
    const withMilestone = await app.inject({
      method: "POST",
      url: `/api/goals/${goal.json().id}/milestones`,
      headers: { authorization: `Bearer ${token}` },
      payload: { title: "API", dueDate: "2026-09-01" },
    })
    const milestoneId = withMilestone.json().milestones[0].id as string
    const toggled = await app.inject({
      method: "PATCH",
      url: `/api/goals/${goal.json().id}/milestones/${milestoneId}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { completed: true },
    })
    expect(toggled.statusCode).toBe(200)
    expect(toggled.json().milestones[0].completed).toBe(true)
    expect(toggled.json().progress).toBe(100)
  })

  it("exports and imports a Manage.kar backup", async () => {
    const { token } = await authToken()
    await app.inject({
      method: "POST",
      url: "/api/tasks",
      headers: { authorization: `Bearer ${token}` },
      payload: { title: "Keep this", priority: "low", dueDate: "2026-08-24" },
    })
    const exported = await app.inject({
      method: "GET",
      url: "/api/export",
      headers: { authorization: `Bearer ${token}` },
    })
    expect(exported.statusCode).toBe(200)
    expect(exported.json().appName).toBe("Manage.kar")
    expect(exported.json().schemaVersion).toBe(1)
    expect(exported.json().tasks).toHaveLength(1)

    const imported = await app.inject({
      method: "POST",
      url: "/api/import",
      headers: { authorization: `Bearer ${token}` },
      payload: {
        appName: "Manage.kar",
        schemaVersion: 1,
        tasks: [{ title: "From web backup", completed: false, priority: "high", dueDate: "2026-09-01" }],
        notes: [{ title: "Imported note", content: "hello" }],
        habits: [{ name: "Walk", category: "health", frequency: "daily" }],
        goals: [],
        timeEntries: [],
        settings: { notifications: { enabled: true, taskReminders: true, habitReminders: true, focusBreaks: true } },
        profile: { name: "Imported", phone: "1", location: "Delhi", bio: "Hi" },
      },
    })
    expect(imported.statusCode).toBe(200)
    const workspace = await app.inject({
      method: "GET",
      url: "/api/workspace",
      headers: { authorization: `Bearer ${token}` },
    })
    expect(workspace.json().tasks.map((item: { title: string }) => item.title)).toEqual(["From web backup"])
    expect(workspace.json().notes).toHaveLength(1)
    expect(workspace.json().user.name).toBe("Imported")
  })
})
