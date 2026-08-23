import { describe, expect, it } from "vitest"
import { ANALYTICS_KEY, clearEvents, listEvents, recordEvent, type KeyValueStore } from "./local-events"

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

describe("local product events", () => {
  it("records events on this device and never invents a remote destination", () => {
    const storage = new MemoryStore()
    recordEvent(storage, "export", { count: 2 })
    recordEvent(storage, "task_created", { titleLength: 12 })

    const events = listEvents(storage)
    expect(events).toHaveLength(2)
    expect(events[0]?.name).toBe("export")
    expect(events[0]?.props).toEqual({ count: 2 })
    expect(events[1]?.name).toBe("task_created")
    expect(storage.getItem(ANALYTICS_KEY)).toContain("export")
    expect(storage.getItem(ANALYTICS_KEY)).not.toMatch(/https?:\/\//)
  })

  it("caps the log and can be cleared", () => {
    const storage = new MemoryStore()
    for (let index = 0; index < 220; index += 1) {
      recordEvent(storage, "task_created", { n: index })
    }

    const events = listEvents(storage)
    expect(events).toHaveLength(200)
    expect(events[0]?.props?.n).toBe(20)
    expect(events[199]?.props?.n).toBe(219)

    clearEvents(storage)
    expect(listEvents(storage)).toEqual([])
  })
})
