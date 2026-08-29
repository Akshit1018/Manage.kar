import { describe, expect, it } from "vitest"
import {
  HERMES_DEFAULT_PORT,
  HERMES_WS_PATH,
  buildHermesWsUrl,
  decodeJsonRpc,
  encodeJsonRpc,
  hermesMethodLabel,
} from "./protocol"

describe("Hermes JSON-RPC protocol", () => {
  it("builds the dashboard WebSocket URL on port 9119", () => {
    expect(buildHermesWsUrl({ host: "127.0.0.1" })).toBe("ws://127.0.0.1:9119/api/ws")
    expect(HERMES_DEFAULT_PORT).toBe(9119)
    expect(HERMES_WS_PATH).toBe("/api/ws")
    expect(buildHermesWsUrl({ host: "vps.example", port: 443, protocol: "wss" })).toBe(
      "wss://vps.example:443/api/ws",
    )
  })

  it("encodes a newline-free JSON-RPC request for prompt.submit", () => {
    const line = encodeJsonRpc({
      jsonrpc: "2.0",
      id: "r1",
      method: "prompt.submit",
      params: { session_id: "s1", text: "hello" },
    })
    expect(line).not.toContain("\n")
    expect(JSON.parse(line)).toEqual({
      jsonrpc: "2.0",
      id: "r1",
      method: "prompt.submit",
      params: { session_id: "s1", text: "hello" },
    })
  })

  it("decodes event frames and RPC results", () => {
    const event = decodeJsonRpc(
      JSON.stringify({
        jsonrpc: "2.0",
        method: "event",
        params: { type: "message.delta", session_id: "s1", payload: { text: "hel" } },
      }),
    )
    expect(event).toEqual({
      kind: "event",
      event: { type: "message.delta", session_id: "s1", payload: { text: "hel" } },
    })
    const result = decodeJsonRpc(JSON.stringify({ jsonrpc: "2.0", id: "r1", result: { ok: true } }))
    expect(result).toEqual({ kind: "result", id: "r1", result: { ok: true } })
    expect(decodeJsonRpc("{nope")).toBeNull()
  })

  it("labels the methods this companion speaks", () => {
    expect(hermesMethodLabel("prompt.submit")).toBe("Submit prompt")
    expect(hermesMethodLabel("session.interrupt")).toBe("Stop")
    expect(hermesMethodLabel("approval.respond")).toBe("Respond to approval")
    expect(hermesMethodLabel("session.create")).toBe("Create session")
  })
})
