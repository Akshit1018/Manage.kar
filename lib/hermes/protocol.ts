export const HERMES_DEFAULT_PORT = 9119
export const HERMES_WS_PATH = "/api/ws"

export type JsonRpcId = string | number

export type HermesMethod = "prompt.submit" | "session.interrupt" | "approval.respond" | "session.create"

export type KnownHermesEventType =
  | "gateway.ready"
  | "message.start"
  | "message.delta"
  | "message.complete"
  | "tool.start"
  | "tool.progress"
  | "tool.complete"
  | "approval.request"
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

export function buildHermesWsUrl(input: {
  host?: string
  port?: number
  path?: string
  protocol?: "ws" | "wss"
}): string {
  const host = input.host ?? "127.0.0.1"
  const port = input.port ?? HERMES_DEFAULT_PORT
  const path = input.path ?? HERMES_WS_PATH
  const protocol = input.protocol ?? "ws"
  const normalized = path.startsWith("/") ? path : `/${path}`
  return `${protocol}://${host}:${port}${normalized}`
}

export function encodeJsonRpc(message: JsonRpcRequest): string {
  return JSON.stringify(message)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
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
  if (parsed.id === undefined || parsed.id === null || (typeof parsed.id !== "string" && typeof parsed.id !== "number")) {
    return null
  }
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

export function asKnownHermesEvent(type: string): KnownHermesEventType | null {
  switch (type) {
    case "gateway.ready":
    case "message.start":
    case "message.delta":
    case "message.complete":
    case "tool.start":
    case "tool.progress":
    case "tool.complete":
    case "approval.request":
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
    case "session.interrupt":
      return "Stop"
    case "approval.respond":
      return "Respond to approval"
    case "session.create":
      return "Create session"
    default: {
      const _exhaustive: never = method
      return _exhaustive
    }
  }
}
