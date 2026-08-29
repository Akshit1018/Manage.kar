import { describe, expect, it } from "vitest"
import { createEmptyDialer, queueMessage } from "@/lib/dialer/dialer"
import type { DialerState, HermesSession } from "@/lib/dialer/types"
import { canDeliverNow, sendCompanionMessage } from "./send"

function paired(presence: HermesSession["presence"] = "active"): HermesSession {
  return {
    id: "machine-m1",
    title: "Home VPS",
    presence,
    lastActivityAt: "2026-08-29T10:00:00.000Z",
    source: "paired",
  }
}

function withSession(session: HermesSession): DialerState {
  return { ...createEmptyDialer(), sessions: [session] }
}

describe("canDeliverNow", () => {
  it("requires a paired reachable session and an open socket", () => {
    expect(canDeliverNow({ source: "demo", presence: "active", connection: "open" })).toBe(false)
    expect(canDeliverNow({ source: "paired", presence: "offline", connection: "open" })).toBe(false)
    expect(canDeliverNow({ source: "paired", presence: "active", connection: "closed" })).toBe(false)
    expect(canDeliverNow({ source: "paired", presence: "active", connection: "open" })).toBe(true)
  })
})

describe("sendCompanionMessage", () => {
  it("never marks a demo message sent even when the socket is open", async () => {
    const calls: unknown[] = []
    const result = await sendCompanionMessage({
      state: createEmptyDialer(),
      target: "demo-local",
      text: "hello",
      nowIso: "2026-08-29T10:00:00.000Z",
      connection: "open",
      submit: async (params) => {
        calls.push(params)
        return { ok: true }
      },
    })
    expect(result.message.status).toBe("queued")
    expect(result.submitted).toBe(false)
    expect(calls).toEqual([])
  })

  it("keeps a paired unreachable message queued", async () => {
    const result = await sendCompanionMessage({
      state: withSession(paired("offline")),
      target: "machine-m1",
      text: "hello",
      nowIso: "2026-08-29T10:00:00.000Z",
      connection: "open",
      submit: async () => ({ ok: true }),
    })
    expect(result.message.status).toBe("queued")
    expect(result.submitted).toBe(false)
  })

  it("submits and flushes only when the paired session is reachable", async () => {
    const queued = queueMessage(withSession(paired("active")), "machine-m1", "hello", "2026-08-29T10:00:00.000Z")
    const result = await sendCompanionMessage({
      state: queued!.state,
      target: "machine-m1",
      text: "second",
      nowIso: "2026-08-29T10:01:00.000Z",
      connection: "open",
      submit: async (params) => {
        expect(params).toMatchObject({ method: "prompt.submit", text: "second", session_id: "machine-m1" })
        return { ok: true }
      },
    })
    expect(result.submitted).toBe(true)
    expect(result.message.status).toBe("sent")
    expect(result.state.outbox.every((item) => item.status === "sent")).toBe(true)
  })

  it("submits the official Hermes session_id when the machine stored one", async () => {
    const result = await sendCompanionMessage({
      state: withSession(paired("active")),
      target: "machine-m1",
      text: "hello",
      nowIso: "2026-08-29T10:00:00.000Z",
      connection: "open",
      hermesSessionId: "a1b2c3d4",
      submit: async (params) => {
        expect(params.session_id).toBe("a1b2c3d4")
        return { ok: true }
      },
    })
    expect(result.submitted).toBe(true)
  })

  it("keeps the queued copy if submit fails", async () => {
    const result = await sendCompanionMessage({
      state: withSession(paired("active")),
      target: "machine-m1",
      text: "hello",
      nowIso: "2026-08-29T10:00:00.000Z",
      connection: "open",
      submit: async () => {
        throw new Error("socket down")
      },
    })
    expect(result.message.status).toBe("queued")
    expect(result.submitted).toBe(false)
  })
})
