import { describe, expect, it } from "vitest"
import { localDateKey } from "@/lib/dates/due-date"
import {
  WORKSPACE_CORRUPT_PREFIX,
  WORKSPACE_KEY,
  allocateEntityId,
  createEmptyWorkspace,
  inspectWorkspace,
  loadWorkspace,
  migrateLegacyWorkspace,
  mutateWorkspace,
  nextNumericId,
  parseBackup,
  resetCorruptWorkspace,
  saveWorkspace,
  serializeBackup,
  clearWorkspace,
  type KeyValueStore,
} from "./workspace"
import { DIALER_KEY, createEmptyDialer, queueMessage, saveDialer } from "@/lib/dialer/dialer"
import { NEW_CHAT_TARGET } from "@/lib/dialer/types"
import { PAIRING_KEY, completeSimulatedPairing, createEmptyPairing, savePairing } from "@/lib/pairing/pairing"

class MemoryStore implements KeyValueStore {
  private readonly data = new Map<string, string>()

  getItem(key: string): string | null {
    return this.data.has(key) ? this.data.get(key)! : null
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value)
  }

  removeItem(key: string): void {
    this.data.delete(key)
  }
}

describe("workspace store", () => {
  it("creates an empty versioned workspace", () => {
    const workspace = createEmptyWorkspace()

    expect(workspace.schemaVersion).toBe(1)
    expect(workspace.tasks).toEqual([])
    expect(workspace.notes).toEqual([])
    expect(workspace.habits).toEqual([])
    expect(workspace.goals).toEqual([])
    expect(workspace.timeEntries).toEqual([])
    expect(workspace.focusSessions).toEqual([])
    expect(workspace.activeFocus).toBeNull()
    expect(workspace.profile.name).toBe("User")
  })

  it("returns an empty workspace when storage is empty", () => {
    const workspace = loadWorkspace(new MemoryStore())

    expect(workspace.tasks).toEqual([])
    expect(workspace.notes).toEqual([])
  })

  it("round-trips tasks, notes, and habits", () => {
    const storage = new MemoryStore()
    const workspace = createEmptyWorkspace()
    workspace.tasks.push({
      id: 1,
      title: "Ship persistence",
      completed: false,
      priority: "high",
      dueDate: "2026-08-23",
    })
    workspace.notes.push({
      id: 1,
      title: "Decision",
      content: "Local store is source of truth",
      createdAt: "2026-08-23T00:00:00.000Z",
    })
    workspace.habits.push({
      id: 1,
      name: "Write tests first",
      category: "productivity",
      frequency: "daily",
      streak: 1,
      completed: false,
      completedToday: true,
      reminders: false,
      createdAt: "2026-08-23T00:00:00.000Z",
      history: [{ date: localDateKey(), completed: true }],
    })

    saveWorkspace(storage, workspace)
    const loaded = loadWorkspace(storage)

    expect(storage.getItem(WORKSPACE_KEY)).toContain("Ship persistence")
    expect(loaded.tasks[0]?.title).toBe("Ship persistence")
    expect(loaded.notes[0]?.content).toContain("Local store")
    expect(loaded.habits[0]?.completedToday).toBe(true)
    expect(loaded.schemaVersion).toBe(1)
  })

  it("quarantines corrupt workspace JSON and refuses to overwrite it", () => {
    const storage = new MemoryStore()
    storage.setItem(WORKSPACE_KEY, "{not-json")

    const inspected = inspectWorkspace(storage)
    expect(inspected.status).toBe("corrupt")
    expect(inspected.quarantineKey?.startsWith(WORKSPACE_CORRUPT_PREFIX)).toBe(true)
    expect(storage.getItem(inspected.quarantineKey ?? "")).toBe("{not-json")
    expect(storage.getItem(WORKSPACE_KEY)).toBe("{not-json")
    expect(inspected.workspace.tasks).toEqual([])

    const afterMutate = mutateWorkspace(storage, (workspace) => ({
      ...workspace,
      tasks: [
        {
          id: 1,
          title: "should not persist over damage",
          completed: false,
          priority: "low",
          dueDate: "2026-08-23",
        },
      ],
    }))
    expect(afterMutate.tasks).toEqual([])
    expect(storage.getItem(WORKSPACE_KEY)).toBe("{not-json")

    const reset = resetCorruptWorkspace(storage)
    expect(reset.tasks).toEqual([])
    expect(JSON.parse(storage.getItem(WORKSPACE_KEY) ?? "{}").schemaVersion).toBe(1)
  })

  it("keeps valid rows and reports dropped invalid ones", () => {
    const storage = new MemoryStore()
    storage.setItem(
      WORKSPACE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        tasks: [
          { id: 1, title: "Good", completed: false, priority: "low", dueDate: "2026-08-23" },
          { id: "bad", title: 12 },
        ],
        notes: [],
        habits: [],
      }),
    )

    const inspected = inspectWorkspace(storage)
    expect(inspected.workspace.tasks).toHaveLength(1)
    expect(inspected.workspace.tasks[0]?.title).toBe("Good")
    expect(inspected.dropped.tasks).toBe(1)
  })

  it("patches storage instead of replacing it with a stale tab snapshot", () => {
    const storage = new MemoryStore()
    saveWorkspace(storage, {
      ...createEmptyWorkspace(),
      tasks: [
        {
          id: 1,
          title: "Shared",
          completed: false,
          priority: "medium",
          dueDate: "2026-08-23",
        },
      ],
    })

    mutateWorkspace(storage, (workspace) => ({
      ...workspace,
      tasks: [
        ...workspace.tasks,
        {
          id: 99,
          title: "TAB1-ONLY-SHOULD-SURVIVE",
          completed: false,
          priority: "high",
          dueDate: "2026-08-23",
        },
      ],
    }))

    mutateWorkspace(storage, (workspace) => ({
      ...workspace,
      tasks: workspace.tasks.map((task) =>
        task.id === 1 ? { ...task, completed: true } : task,
      ),
    }))

    const loaded = loadWorkspace(storage)
    expect(loaded.tasks.map((task) => task.title)).toEqual([
      "Shared",
      "TAB1-ONLY-SHOULD-SURVIVE",
    ])
    expect(loaded.tasks[0]?.completed).toBe(true)
  })

  it("round-trips goals, time entries, and focus state", () => {
    const storage = new MemoryStore()
    const workspace = createEmptyWorkspace()
    workspace.goals.push({
      id: 1,
      title: "Ship remediations",
      description: "Fix the red-team findings",
      category: "work",
      priority: "high",
      targetDate: "2026-09-01",
      progress: 10,
      milestones: [],
      status: "active",
      createdAt: "2026-08-23T00:00:00.000Z",
    })
    workspace.timeEntries.push({
      id: 1,
      taskName: "Write tests",
      project: "Manage.kar",
      startTime: "2026-08-23T10:00:00.000Z",
      duration: 120000,
      isRunning: false,
    })
    workspace.activeFocus = {
      sessionId: 7,
      type: "pomodoro",
      durationSeconds: 1500,
      remainingSeconds: 1400,
      isRunning: true,
      startedAt: "2026-08-23T10:05:00.000Z",
      accumulatedElapsed: 100,
    }

    saveWorkspace(storage, workspace)
    const loaded = loadWorkspace(storage)

    expect(loaded.goals[0]?.title).toBe("Ship remediations")
    expect(loaded.timeEntries[0]?.taskName).toBe("Write tests")
    expect(loaded.activeFocus?.sessionId).toBe(7)
  })

  it("migrates orphan localStorage keys into the workspace document", () => {
    const storage = new MemoryStore()
    storage.setItem(
      "manageKarTasks",
      JSON.stringify([{ id: 9, title: "Legacy task", completed: false, priority: "low", dueDate: "Today" }]),
    )
    storage.setItem(
      "manageKarNotes",
      JSON.stringify([{ id: 3, title: "Legacy note", content: "from FAB", createdAt: "yesterday" }]),
    )
    storage.setItem("manageKarUserProfile", JSON.stringify({ name: "Akshit" }))

    const migrated = migrateLegacyWorkspace(storage)

    expect(migrated.tasks[0]?.title).toBe("Legacy task")
    expect(migrated.notes[0]?.title).toBe("Legacy note")
    expect(migrated.profile.name).toBe("Akshit")
    expect(loadWorkspace(storage).tasks[0]?.title).toBe("Legacy task")
  })

  it("does not overwrite an existing v1 workspace during migration", () => {
    const storage = new MemoryStore()
    const existing = createEmptyWorkspace()
    existing.tasks.push({
      id: 1,
      title: "Canonical",
      completed: false,
      priority: "medium",
      dueDate: "2026-08-23",
    })
    saveWorkspace(storage, existing)
    storage.setItem(
      "manageKarTasks",
      JSON.stringify([{ id: 2, title: "Stale side channel", completed: false, priority: "low", dueDate: "Today" }]),
    )

    const migrated = migrateLegacyWorkspace(storage)

    expect(migrated.tasks).toHaveLength(1)
    expect(migrated.tasks[0]?.title).toBe("Canonical")
  })

  it("assigns the next numeric id from the highest existing id", () => {
    expect(nextNumericId([])).toBe(1)
    expect(nextNumericId([{ id: 2 }, { id: 7 }])).toBe(8)
  })

  it("allocates workspace-wide ids so modules cannot collide", () => {
    const workspace = createEmptyWorkspace()
    workspace.tasks.push({
      id: 2,
      title: "Existing task",
      completed: false,
      priority: "low",
      dueDate: "2026-08-23",
    })
    workspace.goals.push({
      id: 5,
      title: "Existing goal",
      description: "",
      category: "work",
      priority: "medium",
      targetDate: "2026-09-01",
      progress: 0,
      milestones: [],
      status: "active",
      createdAt: "2026-08-23T00:00:00.000Z",
    })

    const first = allocateEntityId(workspace)
    const second = allocateEntityId(first.workspace)

    expect(first.id).toBe(6)
    expect(second.id).toBe(7)
    expect(second.workspace.nextEntityId).toBe(8)
    expect(first.id).not.toBe(workspace.tasks[0]?.id)
    expect(first.id).not.toBe(workspace.goals[0]?.id)
  })

  it("parses a v1 backup and rejects garbage", () => {
    const workspace = createEmptyWorkspace()
    workspace.tasks.push({
      id: 1,
      title: "Backup me",
      completed: true,
      priority: "low",
      dueDate: "2026-08-23",
    })

    const parsed = parseBackup(serializeBackup(workspace))
    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.workspace.tasks[0]?.title).toBe("Backup me")
      expect(parsed.dialer).toBeUndefined()
    }

    const invalid = parseBackup("not-json")
    expect(invalid.ok).toBe(false)

    expect(parseBackup("{}").ok).toBe(false)
    expect(parseBackup(JSON.stringify({ hello: "world" })).ok).toBe(false)
  })

  it("writes slogan due dates back as ISO on load", () => {
    const storage = new MemoryStore()
    storage.setItem(
      WORKSPACE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        tasks: [{ id: 1, title: "Pay rent  ", completed: false, priority: "high", dueDate: "Today" }],
        notes: [],
        habits: [],
      }),
    )

    const inspected = inspectWorkspace(storage)
    expect(inspected.workspace.tasks[0]?.dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(inspected.workspace.tasks[0]?.title).toBe("Pay rent")
    expect(JSON.parse(storage.getItem(WORKSPACE_KEY) ?? "{}").tasks[0].dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(JSON.parse(storage.getItem(WORKSPACE_KEY) ?? "{}").tasks[0].title).toBe("Pay rent")
  })

  it("surfaces a quota failure instead of throwing through persist", () => {
    const storage = new MemoryStore()
    saveWorkspace(storage, createEmptyWorkspace())
    storage.setItem = () => {
      throw new DOMException("full", "QuotaExceededError")
    }

    expect(() =>
      mutateWorkspace(storage, (workspace) => ({
        ...workspace,
        tasks: [
          {
            id: 1,
            title: "Too big",
            completed: false,
            priority: "low",
            dueDate: "2026-08-23",
          },
        ],
      })),
    ).toThrow(/Could not save workspace/)
  })

  it("accepts the legacy settings-export shape as a backup", () => {
    const parsed = parseBackup(
      JSON.stringify({
        appName: "Manage.kar",
        tasks: [{ id: 4, title: "Imported", completed: false, priority: "high", dueDate: "Tomorrow" }],
        notes: [],
        habits: [],
        profile: { name: "Imported User" },
      }),
    )

    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.workspace.tasks[0]?.title).toBe("Imported")
      expect(parsed.workspace.profile.name).toBe("Imported User")
    }
  })

  it("seeds place labels on a new workspace", () => {
    const workspace = createEmptyWorkspace()
    expect(workspace.labels.map((label) => `${label.kind}:${label.name}`)).toEqual([
      "place:errand",
      "place:home",
      "place:office",
      "place:phone",
    ])
  })

  it("seeds places and turns leftover mentions into person labels on load", () => {
    const storage = new MemoryStore()
    storage.setItem(
      WORKSPACE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        tasks: [
          {
            id: 1,
            title: "Call",
            completed: false,
            priority: "medium",
            dueDate: "2026-08-27",
            mentions: ["john"],
            assignedTo: ["sarah"],
          },
        ],
        notes: [],
        habits: [],
      }),
    )

    const loaded = loadWorkspace(storage)
    expect(loaded.labels.some((label) => label.name === "home" && label.kind === "place")).toBe(true)
    expect(loaded.labels.some((label) => label.name === "john" && label.kind === "person")).toBe(true)
    expect(loaded.labels.some((label) => label.name === "sarah" && label.kind === "person")).toBe(true)
    const people = loaded.labels.filter((label) => label.kind === "person")
    expect(loaded.tasks[0]?.labelIds).toEqual(expect.arrayContaining(people.map((label) => label.id)))
  })

  it("round-trips note pins and label colors, and tolerates old data without them", () => {
    const storage = new MemoryStore()
    const workspace = createEmptyWorkspace()
    const allocatedLabel = allocateEntityId(workspace)
    allocatedLabel.workspace.labels.push({ id: allocatedLabel.id, name: "ideas", kind: "tag", color: "purple" })
    const allocatedNote = allocateEntityId(allocatedLabel.workspace)
    allocatedNote.workspace.notes.push({
      id: allocatedNote.id,
      title: "Pinned idea",
      content: "Keep this on top",
      createdAt: "2026-08-23T00:00:00.000Z",
      pinned: true,
      labelIds: [allocatedLabel.id],
    })

    saveWorkspace(storage, allocatedNote.workspace)
    const loaded = loadWorkspace(storage)

    expect(loaded.notes.find((note) => note.title === "Pinned idea")?.pinned).toBe(true)
    expect(loaded.labels.find((label) => label.name === "ideas")?.color).toBe("purple")

    storage.setItem(
      WORKSPACE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        tasks: [],
        notes: [
          { id: 1, title: "Old note", content: "no pin field", createdAt: "2026-01-01T00:00:00.000Z" },
          { id: 2, title: "Bad pin", content: "", createdAt: "2026-01-01T00:00:00.000Z", pinned: "yes" },
        ],
        habits: [],
        labels: [{ id: 3, name: "legacy", kind: "tag", color: "not-a-color" }],
      }),
    )
    const legacy = loadWorkspace(storage)
    expect(legacy.notes.find((note) => note.id === 1)?.pinned).toBeUndefined()
    expect(legacy.notes.find((note) => note.id === 2)?.pinned).toBeUndefined()
    expect(legacy.labels.find((label) => label.name === "legacy")?.color).toBeUndefined()
  })

  it("round-trips task status, owner, worker, and follow-up metadata", () => {
    const storage = new MemoryStore()
    const workspace = createEmptyWorkspace()
    workspace.tasks.push({
      id: 1,
      title: "Board task",
      completed: false,
      priority: "medium",
      dueDate: "2026-08-28",
      status: "doing",
      owner: "me",
      worker: "hermes",
      followUp: { cadence: "daily", lastNudgedAt: "2026-08-27T10:00:00.000Z" },
    })

    saveWorkspace(storage, workspace)
    const loaded = loadWorkspace(storage)
    const task = loaded.tasks.find((item) => item.title === "Board task")

    expect(task?.status).toBe("doing")
    expect(task?.owner).toBe("me")
    expect(task?.worker).toBe("hermes")
    expect(task?.followUp).toEqual({ cadence: "daily", lastNudgedAt: "2026-08-27T10:00:00.000Z" })
  })

  it("keeps tasks with invalid status or follow-up data, dropping only the bad fields", () => {
    const storage = new MemoryStore()
    storage.setItem(
      WORKSPACE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        tasks: [
          {
            id: 1,
            title: "Odd metadata",
            completed: false,
            priority: "low",
            dueDate: "2026-08-28",
            status: "blocked",
            owner: "  ",
            worker: 42,
            followUp: { cadence: "hourly" },
          },
        ],
        notes: [],
        habits: [],
      }),
    )

    const loaded = loadWorkspace(storage)
    const task = loaded.tasks.find((item) => item.title === "Odd metadata")
    expect(task).toBeDefined()
    expect(task?.status).toBeUndefined()
    expect(task?.owner).toBeUndefined()
    expect(task?.worker).toBeUndefined()
    expect(task?.followUp).toBeUndefined()
  })

  it("keeps pins, colors, and task metadata through a backup round trip", () => {
    const workspace = createEmptyWorkspace()
    workspace.labels.push({ id: 90, name: "deep", kind: "tag", color: "teal" })
    workspace.notes.push({
      id: 91,
      title: "Backup pin",
      content: "still pinned",
      createdAt: "2026-08-23T00:00:00.000Z",
      pinned: true,
    })

    const parsed = parseBackup(serializeBackup(workspace))
    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.workspace.notes.find((note) => note.title === "Backup pin")?.pinned).toBe(true)
      expect(parsed.workspace.labels.find((label) => label.name === "deep")?.color).toBe("teal")
    }
  })

  it("includes the dialer in backups and removes it on wipe", () => {
    const storage = new MemoryStore()
    const queued = queueMessage(createEmptyDialer(), NEW_CHAT_TARGET, "secret prompt", "2026-08-28T10:00:00.000Z")!
    saveDialer(storage, queued.state)
    saveWorkspace(storage, createEmptyWorkspace())

    const backup = serializeBackup(createEmptyWorkspace(), queued.state)
    const parsed = parseBackup(backup)
    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.dialer?.outbox[0]?.text).toBe("secret prompt")
    }

    expect(storage.getItem(DIALER_KEY)).not.toBeNull()
    clearWorkspace(storage)
    expect(storage.getItem(DIALER_KEY)).toBeNull()
    expect(storage.getItem(WORKSPACE_KEY)).not.toBeNull()
  })

  it("includes pairing state in backups and removes it on wipe", () => {
    const storage = new MemoryStore()
    const paired = completeSimulatedPairing(createEmptyPairing(), createEmptyDialer(), {
      id: "m1",
      name: "Home VPS",
      kind: "vps",
      nowIso: "2026-08-28T10:00:00.000Z",
    })
    savePairing(storage, paired.pairing)
    saveWorkspace(storage, createEmptyWorkspace())

    const backup = serializeBackup(createEmptyWorkspace(), paired.dialer, paired.pairing)
    const parsed = parseBackup(backup)
    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.pairing?.machines[0]?.name).toBe("Home VPS")
      expect(parsed.dialer?.sessions[0]?.source).toBe("paired")
    }

    const withoutPairing = parseBackup(serializeBackup(createEmptyWorkspace()))
    expect(withoutPairing.ok).toBe(true)
    if (withoutPairing.ok) {
      expect(withoutPairing.pairing).toBeUndefined()
    }

    expect(storage.getItem(PAIRING_KEY)).not.toBeNull()
    clearWorkspace(storage)
    expect(storage.getItem(PAIRING_KEY)).toBeNull()
  })
})
