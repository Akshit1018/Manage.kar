import { describe, expect, it } from "vitest"
import {
  WORKSPACE_CORRUPT_PREFIX,
  WORKSPACE_KEY,
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
  type KeyValueStore,
} from "./workspace"

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
      history: [{ date: "2026-08-23", completed: true }],
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
    }

    const invalid = parseBackup("not-json")
    expect(invalid.ok).toBe(false)

    expect(parseBackup("{}").ok).toBe(false)
    expect(parseBackup(JSON.stringify({ hello: "world" })).ok).toBe(false)
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
})
