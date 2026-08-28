import { describe, expect, it } from "vitest"
import {
  centeredWheelIndex,
  createEmptyDialer,
  flushOutbox,
  loadDialer,
  presenceDotClass,
  presenceLabel,
  queueMessage,
  queuedCountFor,
  saveDialer,
  targetTitle,
  wheelItems,
} from "./dialer"
import { NEW_CHAT_TARGET, type DialerState, type HermesSession } from "./types"

function session(overrides: Partial<HermesSession>): HermesSession {
  return {
    id: "s1",
    title: "Hermes local",
    presence: "active",
    lastActivityAt: "2026-08-28T09:00:00.000Z",
    ...overrides,
  }
}

function stateWith(sessions: HermesSession[]): DialerState {
  return { ...createEmptyDialer(), sessions }
}

class MemoryStore {
  private map = new Map<string, string>()
  getItem(key: string) {
    return this.map.get(key) ?? null
  }
  setItem(key: string, value: string) {
    this.map.set(key, value)
  }
  removeItem(key: string) {
    this.map.delete(key)
  }
}

describe("wheelItems", () => {
  it("puts New chat first, then sessions by most recent activity", () => {
    const items = wheelItems([
      session({ id: "old", title: "Old", lastActivityAt: "2026-08-01T00:00:00.000Z" }),
      session({ id: "fresh", title: "Fresh", lastActivityAt: "2026-08-28T00:00:00.000Z" }),
    ])
    expect(items.map((item) => item.id)).toEqual([NEW_CHAT_TARGET, "fresh", "old"])
    expect(items[0].presence).toBeUndefined()
  })
})

describe("presence", () => {
  it("maps presence to a dot color", () => {
    expect(presenceDotClass("active")).toContain("emerald")
    expect(presenceDotClass("idle")).toContain("yellow")
    expect(presenceDotClass("offline")).toContain("red")
  })

  it("labels presence for screen readers", () => {
    expect(presenceLabel("active")).toBe("online")
    expect(presenceLabel("idle")).toBe("idle")
    expect(presenceLabel("offline")).toBe("offline")
  })
})

describe("queueMessage", () => {
  it("appends a queued message for an offline session", () => {
    const state = stateWith([session({ id: "s1", presence: "offline" })])
    const result = queueMessage(state, "s1", "  hello agent  ", "2026-08-28T10:00:00.000Z")
    expect(result).not.toBeNull()
    expect(result?.message.status).toBe("queued")
    expect(result?.message.text).toBe("hello agent")
    expect(result?.state.outbox).toHaveLength(1)
  })

  it("marks the message sent immediately when the session is active", () => {
    const state = stateWith([session({ id: "s1", presence: "active" })])
    const result = queueMessage(state, "s1", "hi", "2026-08-28T10:00:00.000Z")
    expect(result?.message.status).toBe("sent")
    expect(result?.message.sentAt).toBe("2026-08-28T10:00:00.000Z")
  })

  it("queues new-chat messages until a chat exists to carry them", () => {
    const result = queueMessage(createEmptyDialer(), NEW_CHAT_TARGET, "hi", "2026-08-28T10:00:00.000Z")
    expect(result?.message.status).toBe("queued")
  })

  it("rejects empty text", () => {
    expect(queueMessage(createEmptyDialer(), NEW_CHAT_TARGET, "   ", "2026-08-28T10:00:00.000Z")).toBeNull()
  })

  it("allocates increasing ids", () => {
    const first = queueMessage(createEmptyDialer(), NEW_CHAT_TARGET, "one", "2026-08-28T10:00:00.000Z")
    const second = queueMessage(first!.state, NEW_CHAT_TARGET, "two", "2026-08-28T10:01:00.000Z")
    expect(second!.message.id).toBeGreaterThan(first!.message.id)
  })
})

describe("queuedCountFor", () => {
  it("counts only queued messages for the target", () => {
    let state = stateWith([session({ id: "s1", presence: "offline" })])
    state = queueMessage(state, "s1", "a", "2026-08-28T10:00:00.000Z")!.state
    state = queueMessage(state, "s1", "b", "2026-08-28T10:01:00.000Z")!.state
    state = queueMessage(state, NEW_CHAT_TARGET, "c", "2026-08-28T10:02:00.000Z")!.state
    expect(queuedCountFor(state, "s1")).toBe(2)
    expect(queuedCountFor(state, NEW_CHAT_TARGET)).toBe(1)
  })
})

describe("flushOutbox", () => {
  it("sends queued messages for a session that came back online", () => {
    let state = stateWith([session({ id: "s1", presence: "offline" })])
    state = queueMessage(state, "s1", "a", "2026-08-28T10:00:00.000Z")!.state
    const flushed = flushOutbox(state, "s1", "2026-08-28T11:00:00.000Z")
    expect(flushed.outbox.every((message) => message.status === "sent")).toBe(true)
    expect(flushed.outbox[0].sentAt).toBe("2026-08-28T11:00:00.000Z")
  })

  it("leaves other targets queued", () => {
    let state = stateWith([session({ id: "s1", presence: "offline" }), session({ id: "s2", presence: "offline" })])
    state = queueMessage(state, "s1", "a", "2026-08-28T10:00:00.000Z")!.state
    state = queueMessage(state, "s2", "b", "2026-08-28T10:00:00.000Z")!.state
    const flushed = flushOutbox(state, "s1", "2026-08-28T11:00:00.000Z")
    expect(queuedCountFor(flushed, "s2")).toBe(1)
  })
})

describe("targetTitle", () => {
  it("resolves session titles and falls back to New chat", () => {
    const sessions = [session({ id: "s1", title: "VPS main" })]
    expect(targetTitle(sessions, "s1")).toBe("VPS main")
    expect(targetTitle(sessions, NEW_CHAT_TARGET)).toBe("New chat")
    expect(targetTitle(sessions, "missing")).toBe("New chat")
  })
})

describe("centeredWheelIndex", () => {
  it("rounds scroll offset to the nearest item and clamps", () => {
    expect(centeredWheelIndex(0, 48, 5)).toBe(0)
    expect(centeredWheelIndex(70, 48, 5)).toBe(1)
    expect(centeredWheelIndex(9999, 48, 5)).toBe(4)
    expect(centeredWheelIndex(-20, 48, 5)).toBe(0)
  })
})

describe("storage round trip", () => {
  it("seeds demo sessions on first load and persists outbox", () => {
    const store = new MemoryStore()
    const first = loadDialer(store)
    expect(first.sessions.length).toBeGreaterThan(0)

    const queued = queueMessage(first, first.sessions[0].id, "hello", "2026-08-28T10:00:00.000Z")!
    saveDialer(store, queued.state)

    const reloaded = loadDialer(store)
    expect(reloaded.outbox).toHaveLength(1)
    expect(reloaded.outbox[0].text).toBe("hello")
  })

  it("recovers from corrupt storage with a fresh seed", () => {
    const store = new MemoryStore()
    store.setItem("managekar.dialer.v1", "{not json")
    const state = loadDialer(store)
    expect(state.schemaVersion).toBe(1)
    expect(state.outbox).toEqual([])
  })
})
