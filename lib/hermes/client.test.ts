import { describe, expect, it } from "vitest"
import { HermesJsonRpcClient, MemorySocket, SOCKET_OPEN } from "./client"

describe("HermesJsonRpcClient", () => {
  it("connects, requests, streams events, and disconnects", async () => {
    const [local, remote] = MemorySocket.pair()
    const client = new HermesJsonRpcClient({
      socketFactory: () => local,
      createRequestId: () => "r1",
    })

    const connecting = client.connect("ws://127.0.0.1:9119/api/ws")
    expect(client.connectionState).toBe("connecting")
    remote.readyState = SOCKET_OPEN
    local.open()
    await connecting
    expect(client.connectionState).toBe("open")

    const events: string[] = []
    client.onEvent((event) => {
      events.push(String(event.type))
    })

    const pending = client.request<{ session_id: string }>("session.create", {})
    expect(remote.lastReceived).toContain("session.create")
    local.deliver(
      JSON.stringify({
        jsonrpc: "2.0",
        method: "event",
        params: { type: "message.delta", session_id: "s1", payload: { text: "hi" } },
      }),
    )
    local.deliver(JSON.stringify({ jsonrpc: "2.0", id: "r1", result: { session_id: "s1" } }))
    await expect(pending).resolves.toEqual({ session_id: "s1" })
    expect(events).toEqual(["message.delta"])

    client.disconnect()
    expect(client.connectionState).toBe("closed")
    await expect(client.request("prompt.submit", { text: "nope" })).rejects.toThrow(/not connected/i)
  })

  it("rejects connect when the socket errors", async () => {
    const socket = new MemorySocket()
    const client = new HermesJsonRpcClient({ socketFactory: () => socket })
    const pending = client.connect("ws://127.0.0.1:9119/api/ws")
    socket.error()
    await expect(pending).rejects.toThrow(/connection failed/i)
    expect(client.connectionState).toBe("error")
  })
})
