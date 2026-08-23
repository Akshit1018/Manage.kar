import { describe, expect, it } from "vitest"
import {
  WORKSPACE_KEY,
  createEmptyWorkspace,
  loadWorkspace,
  migrateLegacyWorkspace,
  nextNumericId,
  parseBackup,
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
      dueDate: "Today",
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

  it("recovers from corrupt workspace JSON", () => {
    const storage = new MemoryStore()
    storage.setItem(WORKSPACE_KEY, "{not-json")

    expect(loadWorkspace(storage).tasks).toEqual([])
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
      dueDate: "Today",
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
      dueDate: "Today",
    })

    const parsed = parseBackup(serializeBackup(workspace))
    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.workspace.tasks[0]?.title).toBe("Backup me")
    }

    const invalid = parseBackup("not-json")
    expect(invalid.ok).toBe(false)
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
