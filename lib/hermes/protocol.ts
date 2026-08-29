import { buildHermesWsUrl, HERMES_DEFAULT_PORT, HERMES_WS_PATH } from "./endpoint"

export { buildHermesWsUrl, HERMES_DEFAULT_PORT, HERMES_WS_PATH }

export type JsonRpcId = string | number

export type HermesMethod =
  | "prompt.submit"
  | "prompt.background"
  | "session.interrupt"
  | "session.steer"
  | "session.list"
  | "approval.respond"
  | "session.create"
  | "gateway.ping"

export type KnownHermesEventType =
  | "gateway.ready"
  | "session.info"
  | "message.start"
  | "message.delta"
  | "message.interim"
  | "message.complete"
  | "thinking.delta"
  | "reasoning.delta"
  | "tool.start"
  | "tool.progress"
  | "tool.complete"
  | "approval.request"
  | "clarify.request"
  | "sudo.request"
  | "secret.request"
  | "error"

export interface HermesEvent {
  type: string
  session_id?: string
  payload?: Record<string, unknown>
}

export interface JsonRpcRequest {
  jsonrpc: "2.0"
  id: JsonRpcId
  method: string
  params?: Record<string, unknown>
}

export type DecodedFrame =
  | { kind: "event"; event: HermesEvent }
  | { kind: "result"; id: JsonRpcId; result: unknown }
  | { kind: "error"; id: JsonRpcId; error: { code: number; message: string; data?: unknown } }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function encodeJsonRpc(message: JsonRpcRequest): string {
  return JSON.stringify(message)
}

export function decodeJsonRpc(line: string): DecodedFrame | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(line)
  } catch {
    return null
  }
  if (!isRecord(parsed) || parsed.jsonrpc !== "2.0") {
    return null
  }
  if (parsed.id !== undefined && parsed.id !== null && (typeof parsed.id === "string" || typeof parsed.id === "number")) {
    if (isRecord(parsed.error) && typeof parsed.error.message === "string") {
      return {
        kind: "error",
        id: parsed.id,
        error: {
          code: typeof parsed.error.code === "number" ? parsed.error.code : 0,
          message: parsed.error.message,
          ...(parsed.error.data !== undefined ? { data: parsed.error.data } : {}),
        },
      }
    }
    return { kind: "result", id: parsed.id, result: parsed.result }
  }
  if (parsed.method === "event" && isRecord(parsed.params) && typeof parsed.params.type === "string") {
    const payload = isRecord(parsed.params.payload) ? parsed.params.payload : undefined
    return {
      kind: "event",
      event: {
        type: parsed.params.type,
        ...(typeof parsed.params.session_id === "string" ? { session_id: parsed.params.session_id } : {}),
        ...(payload ? { payload } : {}),
      },
    }
  }
  return null
}

export function asKnownHermesEvent(type: string): KnownHermesEventType | null {
  switch (type) {
    case "gateway.ready":
    case "session.info":
    case "message.start":
    case "message.delta":
    case "message.interim":
    case "message.complete":
    case "thinking.delta":
    case "reasoning.delta":
    case "tool.start":
    case "tool.progress":
    case "tool.complete":
    case "approval.request":
    case "clarify.request":
    case "sudo.request":
    case "secret.request":
    case "error":
      return type
    default:
      return null
  }
}

export function hermesMethodLabel(method: HermesMethod): string {
  switch (method) {
    case "prompt.submit":
      return "Submit prompt"
    case "prompt.background":
      return "Background prompt"
    case "session.interrupt":
      return "Stop"
    case "session.steer":
      return "Steer"
    case "session.list":
      return "List sessions"
    case "approval.respond":
      return "Respond to approval"
    case "session.create":
      return "Create session"
    case "gateway.ping":
      return "Ping gateway"
    default: {
      const _exhaustive: never = method
      return _exhaustive
    }
  }
}
