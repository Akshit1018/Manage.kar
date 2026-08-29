import { describe, expect, it } from "vitest"
import { attachToHermesDashboard } from "./attach"

const STATUS = {
  version: "0.5.0",
  gateway_running: true,
  auth_required: false,
  install_id: "install-1",
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  })
}

describe("attachToHermesDashboard", () => {
  it("does not pair from a successful /api/status poll", async () => {
    const probe = await attachToHermesDashboard({
      fetchImpl: async () => jsonResponse(STATUS),
      openSocket: async () => {
        throw new Error("should not open")
      },
      request: async () => {
        throw new Error("should not request")
      },
      baseUrl: "http://127.0.0.1:9119",
      machineId: "m1",
      name: "Home",
      nowIso: "2026-08-29T17:00:00.000Z",
      mode: "probe",
    })
    expect(probe.kind).toBe("waiting")
    if (probe.kind === "waiting") {
      expect(probe.dashboard?.version).toBe("0.5.0")
    }
  })

  it("pairs only after the socket opens and session.create returns a Hermes session_id", async () => {
    const urls: string[] = []
    const methods: string[] = []
    const probe = await attachToHermesDashboard({
      fetchImpl: async () => jsonResponse(STATUS),
      openSocket: async (url) => {
        urls.push(url)
      },
      request: async (method) => {
        methods.push(method)
        return { session_id: "a1b2c3d4", stored_session_id: "key-1" }
      },
      baseUrl: "http://127.0.0.1:9119",
      token: "dash-token",
      machineId: "m1",
      name: "Home VPS",
      nowIso: "2026-08-29T17:00:00.000Z",
      mode: "connect",
    })
    expect(probe).toMatchObject({
      kind: "paired",
      machineId: "m1",
      name: "Home VPS",
      hermesSessionId: "a1b2c3d4",
    })
    expect(urls[0]).toContain("/api/ws?token=dash-token")
    expect(methods).toEqual(["session.create"])
  })

  it("names needs_token when the dashboard requires auth and the socket is refused", async () => {
    const probe = await attachToHermesDashboard({
      fetchImpl: async () => jsonResponse({ ...STATUS, auth_required: true }),
      openSocket: async () => {
        throw new Error("WebSocket connection failed")
      },
      request: async () => ({}),
      baseUrl: "http://127.0.0.1:9119",
      machineId: "m1",
      name: "Home",
      nowIso: "2026-08-29T17:00:00.000Z",
      mode: "connect",
    })
    expect(probe.kind).toBe("needs_token")
  })
})
