import { describe, expect, it } from "vitest"
import { applyHermesEvent, createThread } from "./thread"

describe("thread event application", () => {
  it("streams tokens into an assistant bubble and stops streaming on complete", () => {
    let thread = createThread("s1")
    thread = applyHermesEvent(thread, { type: "message.start", session_id: "s1" })
    thread = applyHermesEvent(thread, {
      type: "message.delta",
      session_id: "s1",
      payload: { text: "Hel" },
    })
    thread = applyHermesEvent(thread, {
      type: "message.delta",
      session_id: "s1",
      payload: { text: "lo" },
    })
    expect(thread.streaming).toBe(true)
    expect(thread.items).toEqual([
      { kind: "assistant", id: "assistant:s1", text: "Hello", streaming: true },
    ])
    thread = applyHermesEvent(thread, {
      type: "message.complete",
      session_id: "s1",
      payload: { text: "Hello" },
    })
    expect(thread.streaming).toBe(false)
    expect(thread.items[0]).toMatchObject({ kind: "assistant", text: "Hello", streaming: false })
  })

  it("renders tool-call cards from start/progress/complete", () => {
    let thread = createThread("s1")
    thread = applyHermesEvent(thread, {
      type: "tool.start",
      session_id: "s1",
      payload: { tool_id: "t1", name: "web_search" },
    })
    thread = applyHermesEvent(thread, {
      type: "tool.progress",
      session_id: "s1",
      payload: { name: "web_search", preview: "querying" },
    })
    thread = applyHermesEvent(thread, {
      type: "tool.complete",
      session_id: "s1",
      payload: { tool_id: "t1", name: "web_search", summary: "done" },
    })
    expect(thread.items).toEqual([
      {
        kind: "tool",
        id: "t1",
        name: "web_search",
        phase: "complete",
        preview: "done",
      },
    ])
  })
})
