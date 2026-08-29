import { describe, expect, it } from "vitest"
import { parseHermesDashboardStatus } from "./status"

const OFFICIAL_STATUS = {
  version: "0.5.0",
  release_date: "2026-08-01",
  gateway_running: true,
  gateway_state: "running",
  auth_required: false,
  auth_providers: [],
  install_id: "install-1",
  overall: "ok",
  components: {
    gateway: { status: "ok", state: "running" },
    dashboard: { status: "ok" },
  },
}

describe("parseHermesDashboardStatus", () => {
  it("accepts the official public /api/status shape", () => {
    expect(parseHermesDashboardStatus(OFFICIAL_STATUS)).toEqual({
      version: "0.5.0",
      gatewayRunning: true,
      authRequired: false,
      installId: "install-1",
      overall: "ok",
    })
  })

  it("rejects non-Hermes JSON so a random 200 cannot count as a helper", () => {
    expect(parseHermesDashboardStatus({ ok: true })).toBeNull()
    expect(parseHermesDashboardStatus({ version: 1, gateway_running: true })).toBeNull()
    expect(parseHermesDashboardStatus(null)).toBeNull()
  })

  it("records auth_required from the official gate advertisement", () => {
    expect(parseHermesDashboardStatus({ ...OFFICIAL_STATUS, auth_required: true })?.authRequired).toBe(true)
  })
})
