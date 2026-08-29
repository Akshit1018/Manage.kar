import { describe, expect, it } from "vitest"
import {
  centeredWheelIndex,
  chatListItems,
  createEmptyDialer,
  canFlushOutbox,
  flushOutbox,
  loadDialer,
  messagesForTarget,
  presenceDotClass,
  presenceLabel,
  queueCopy,
  queueMessage,
  queuedCountFor,
  saveDialer,
  targetTitle,
  visibleSessions,
  wheelItems,
  DIALER_KEY,
} from "./dialer"
import { NEW_CHAT_TARGET, type DialerState, type HermesSession } from "./types"

function session(overrides: Partial<HermesSession>): HermesSession {
  return {
    id: "s1",
    title: "Hermes local",
    presence: "active",
    lastActivityAt: "2026-08-28T09:00:00.000Z",
    source: "paired",
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
    expect(presenceLabel("active")).toBe("reachable")
    expect(presenceLabel("idle")).toBe("asleep")
    expect(presenceLabel("offline")).toBe("unreachable")
    expect(presenceLabel("active", "demo")).toBe("not paired")
    expect(presenceLabel("offline", "demo")).toBe("not paired")
    expect(presenceDotClass("active", "demo")).not.toContain("emerald")
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

  it("queues when the session is idle", () => {
    const state = stateWith([session({ id: "s1", presence: "idle" })])
    const result = queueMessage(state, "s1", "hi", "2026-08-28T10:00:00.000Z")
    expect(result?.message.status).toBe("queued")
  })

  it("does not mark a message sent without an explicit transport ack", () => {
    const state = stateWith([session({ id: "s1", presence: "active" })])
    const result = queueMessage(state, "s1", "hi", "2026-08-28T10:00:00.000Z")
    expect(result?.message.status).toBe("queued")
    expect(result?.message.sentAt).toBeUndefined()
  })

  it("marks the message sent only when the caller confirms delivery", () => {
    const state = stateWith([session({ id: "s1", presence: "active", source: "paired" })])
    const result = queueMessage(state, "s1", "hi", "2026-08-28T10:00:00.000Z", { deliver: true })
    expect(result?.message.status).toBe("sent")
    expect(result?.message.sentAt).toBe("2026-08-28T10:00:00.000Z")
  })

  it("never treats a demo session as delivered even if deliver is requested", () => {
    const state = stateWith([session({ id: "demo-local", source: "demo", presence: "active" })])
    const result = queueMessage(state, "demo-local", "hi", "2026-08-28T10:00:00.000Z", { deliver: true })
    expect(result?.message.status).toBe("queued")
  })

  it("attaches a demo session into state when the user messages it", () => {
    const result = queueMessage(createEmptyDialer(), "demo-local", "hi", "2026-08-28T10:00:00.000Z")
    expect(result?.state.sessions.find((item) => item.id === "demo-local")?.source).toBe("demo")
    expect(result?.message.target).toBe("demo-local")
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
  it("does not flush demo or unreachable sessions", () => {
    expect(canFlushOutbox(session({ source: "demo", presence: "active" }))).toBe(false)
    expect(canFlushOutbox(session({ source: "paired", presence: "offline" }))).toBe(false)
    expect(canFlushOutbox(session({ source: "paired", presence: "active" }))).toBe(true)
    let demo = queueMessage(createEmptyDialer(), "demo-local", "a", "2026-08-28T10:00:00.000Z")!.state
    expect(flushOutbox(demo, "demo-local", "2026-08-28T11:00:00.000Z").outbox[0]?.status).toBe("queued")
    let offline = stateWith([session({ id: "s1", presence: "offline" })])
    offline = queueMessage(offline, "s1", "a", "2026-08-28T10:00:00.000Z")!.state
    expect(flushOutbox(offline, "s1", "2026-08-28T11:00:00.000Z").outbox[0]?.status).toBe("queued")
  })

  it("sends queued messages only for a paired reachable session", () => {
    let state = stateWith([session({ id: "s1", presence: "active" })])
    state = queueMessage(state, "s1", "a", "2026-08-28T10:00:00.000Z")!.state
    const flushed = flushOutbox(state, "s1", "2026-08-28T11:00:00.000Z")
    expect(flushed.outbox.every((message) => message.status === "sent")).toBe(true)
    expect(flushed.outbox[0].sentAt).toBe("2026-08-28T11:00:00.000Z")
  })

  it("leaves other targets queued", () => {
    let state = stateWith([session({ id: "s1", presence: "active" }), session({ id: "s2", presence: "active" })])
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
  it("does not persist demo machines on first load", () => {
    const store = new MemoryStore()
    const first = loadDialer(store)
    expect(first.sessions).toEqual([])
    expect(store.getItem(DIALER_KEY)).toBeNull()
    expect(visibleSessions(first).some((item) => item.source === "demo")).toBe(true)
  })

  it("keeps an empty persisted session list empty", () => {
    const store = new MemoryStore()
    const queued = queueMessage(createEmptyDialer(), NEW_CHAT_TARGET, "hello", "2026-08-28T10:00:00.000Z")!
    saveDialer(store, queued.state)
    const reloaded = loadDialer(store)
    expect(reloaded.sessions).toEqual([])
    expect(reloaded.outbox).toHaveLength(1)
    expect(reloaded.outbox[0].text).toBe("hello")
  })

  it("recovers from corrupt storage without writing demo machines", () => {
    const store = new MemoryStore()
    store.setItem(DIALER_KEY, "{not json")
    const state = loadDialer(store)
    expect(state.schemaVersion).toBe(1)
    expect(state.sessions).toEqual([])
    expect(state.outbox).toEqual([])
    expect(JSON.parse(store.getItem(DIALER_KEY) ?? "{}").sessions).toEqual([])
  })

  it("rejects a planted session that steals the new-chat id", () => {
    const store = new MemoryStore()
    store.setItem(
      DIALER_KEY,
      JSON.stringify({
        schemaVersion: 1,
        sessions: [{ id: NEW_CHAT_TARGET, title: "Hijack", presence: "active" }],
        outbox: [],
      }),
    )
    expect(loadDialer(store).sessions).toEqual([])
  })
})

describe("visibleSessions and chat list", () => {
  it("shows in-memory demos until a paired machine exists", () => {
    const demos = visibleSessions(createEmptyDialer())
    expect(demos.map((item) => item.id)).toEqual(["demo-local", "demo-vps", "demo-research"])
    expect(demos.map((item) => item.title)).toEqual(["Hermes · local", "Hermes · VPS", "Bot Chat"])
    const paired = visibleSessions(stateWith([session({ id: "real", source: "paired" })]))
    expect(paired.map((item) => item.id)).toEqual(["real"])
  })

  it("lists New chat first, then sessions by latest activity, with queued badges", () => {
    let state = stateWith([
      session({ id: "old", title: "Old", lastActivityAt: "2026-08-01T00:00:00.000Z" }),
      session({ id: "fresh", title: "Fresh", lastActivityAt: "2026-08-28T00:00:00.000Z" }),
    ])
    state = queueMessage(state, "old", "later", "2026-08-28T10:00:00.000Z")!.state
    state = queueMessage(state, NEW_CHAT_TARGET, "start", "2026-08-28T09:00:00.000Z")!.state
    const items = chatListItems(state, "")
    expect(items.map((item) => item.id)).toEqual([NEW_CHAT_TARGET, "fresh", "old"])
    expect(items[0].queuedCount).toBe(1)
    expect(items[2].queuedCount).toBe(1)
    expect(items[2].preview).toBe("later")
  })

  it("filters the chat list by title or preview", () => {
    const state = stateWith([session({ id: "vps", title: "Hermes · VPS" })])
    expect(chatListItems(state, "vps").map((item) => item.id)).toEqual(["vps"])
    expect(chatListItems(state, "nope")).toEqual([])
  })

  it("returns outbox rows for one target in time order", () => {
    let state = createEmptyDialer()
    state = queueMessage(state, NEW_CHAT_TARGET, "one", "2026-08-28T10:00:00.000Z")!.state
    state = queueMessage(state, "s1", "skip", "2026-08-28T10:01:00.000Z")!.state
    state = queueMessage(state, NEW_CHAT_TARGET, "two", "2026-08-28T10:02:00.000Z")!.state
    expect(messagesForTarget(state, NEW_CHAT_TARGET).map((item) => item.text)).toEqual(["one", "two"])
  })

  it("uses honest copy until a real send exists", () => {
    expect(queueCopy({ status: "queued", source: "demo" })).toMatch(/pairing/i)
    expect(queueCopy({ status: "sent", source: "demo" })).toMatch(/pairing/i)
    expect(queueCopy({ status: "queued", source: "paired", presence: "offline" })).toMatch(/reachable/i)
    expect(queueCopy({ status: "queued", source: "paired", presence: "offline" })).not.toMatch(/online/i)
    expect(queueCopy({ status: "sent" })).toMatch(/sent/i)
  })

  it("treats leftover demo machine ids as demo even without a source field", () => {
    const store = new MemoryStore()
    store.setItem(
      DIALER_KEY,
      JSON.stringify({
        schemaVersion: 1,
        sessions: [{ id: "demo-local", title: "Hermes · local", presence: "active" }],
        outbox: [],
      }),
    )
    expect(loadDialer(store).sessions[0]?.source).toBe("demo")
  })
})
