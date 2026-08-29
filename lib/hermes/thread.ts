import { asKnownHermesEvent, type HermesEvent } from "./protocol"

export type ToolPhase = "start" | "progress" | "complete"

export type ThreadItem =
  | { kind: "assistant"; id: string; text: string; streaming: boolean }
  | { kind: "tool"; id: string; name: string; phase: ToolPhase; preview?: string }

export interface ThreadState {
  sessionId: string
  items: ThreadItem[]
  streaming: boolean
}

export function createThread(sessionId: string): ThreadState {
  return { sessionId, items: [], streaming: false }
}

function asText(payload: Record<string, unknown> | undefined): string {
  return typeof payload?.text === "string" ? payload.text : ""
}

function toolId(payload: Record<string, unknown> | undefined, fallback: string): string {
  return typeof payload?.tool_id === "string" && payload.tool_id.trim() !== "" ? payload.tool_id : fallback
}

function toolName(payload: Record<string, unknown> | undefined): string {
  return typeof payload?.name === "string" && payload.name.trim() !== "" ? payload.name : "tool"
}

function upsertAssistant(items: ThreadItem[], sessionId: string, text: string, streaming: boolean): ThreadItem[] {
  const id = `assistant:${sessionId}`
  const existing = items.find((item) => item.kind === "assistant" && item.id === id)
  if (!existing || existing.kind !== "assistant") {
    return [...items, { kind: "assistant", id, text, streaming }]
  }
  return items.map((item) =>
    item.kind === "assistant" && item.id === id ? { ...item, text, streaming } : item,
  )
}

function upsertTool(
  items: ThreadItem[],
  id: string,
  name: string,
  phase: ToolPhase,
  preview?: string,
): ThreadItem[] {
  const existing = items.find((item) => item.kind === "tool" && (item.id === id || item.name === name))
  if (!existing || existing.kind !== "tool") {
    return [...items, { kind: "tool", id, name, phase, ...(preview ? { preview } : {}) }]
  }
  return items.map((item) =>
    item.kind === "tool" && (item.id === existing.id || item.name === name)
      ? { ...item, id, name, phase, ...(preview !== undefined ? { preview } : {}) }
      : item,
  )
}

export function applyHermesEvent(thread: ThreadState, event: HermesEvent): ThreadState {
  if (event.session_id && event.session_id !== thread.sessionId) {
    return thread
  }
  const known = asKnownHermesEvent(event.type)
  if (!known) {
    return thread
  }
  switch (known) {
    case "gateway.ready":
    case "approval.request":
    case "error":
      return thread
    case "message.start":
      return {
        ...thread,
        streaming: true,
        items: upsertAssistant(thread.items, thread.sessionId, "", true),
      }
    case "message.delta": {
      const prior = thread.items.find((item) => item.kind === "assistant" && item.id === `assistant:${thread.sessionId}`)
      const nextText = `${prior && prior.kind === "assistant" ? prior.text : ""}${asText(event.payload)}`
      return {
        ...thread,
        streaming: true,
        items: upsertAssistant(thread.items, thread.sessionId, nextText, true),
      }
    }
    case "message.complete": {
      const prior = thread.items.find((item) => item.kind === "assistant" && item.id === `assistant:${thread.sessionId}`)
      const finalText = asText(event.payload) || (prior && prior.kind === "assistant" ? prior.text : "")
      return {
        ...thread,
        streaming: false,
        items: upsertAssistant(thread.items, thread.sessionId, finalText, false),
      }
    }
    case "tool.start":
      return {
        ...thread,
        items: upsertTool(thread.items, toolId(event.payload, toolName(event.payload)), toolName(event.payload), "start"),
      }
    case "tool.progress":
      return {
        ...thread,
        items: upsertTool(
          thread.items,
          toolId(event.payload, toolName(event.payload)),
          toolName(event.payload),
          "progress",
          typeof event.payload?.preview === "string" ? event.payload.preview : undefined,
        ),
      }
    case "tool.complete":
      return {
        ...thread,
        items: upsertTool(
          thread.items,
          toolId(event.payload, toolName(event.payload)),
          toolName(event.payload),
          "complete",
          typeof event.payload?.summary === "string"
            ? event.payload.summary
            : typeof event.payload?.result_text === "string"
              ? event.payload.result_text
              : undefined,
        ),
      }
    default: {
      const _exhaustive: never = known
      return _exhaustive
    }
  }
}
