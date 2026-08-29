import { describe, expect, it } from "vitest"
import {
  HERMES_DEFAULT_BASE,
  HERMES_STATUS_PATH,
  buildHermesWsUrl,
  hermesStatusUrl,
  hermesWsUrl,
  normalizeHermesBaseUrl,
} from "./endpoint"

describe("Hermes helper endpoint", () => {
  it("normalizes a dashboard base to http://127.0.0.1:9119 by default", () => {
    expect(normalizeHermesBaseUrl("")).toBe(HERMES_DEFAULT_BASE)
    expect(normalizeHermesBaseUrl("127.0.0.1:9119")).toBe("http://127.0.0.1:9119")
    expect(normalizeHermesBaseUrl("http://homelab.lan:9119/")).toBe("http://homelab.lan:9119")
    expect(normalizeHermesBaseUrl("ftp://nope")).toBeNull()
  })

  it("builds the official public status URL", () => {
    expect(hermesStatusUrl("http://127.0.0.1:9119")).toBe(`http://127.0.0.1:9119${HERMES_STATUS_PATH}`)
  })

  it("builds /api/ws with the dashboard token query the MIT server expects", () => {
    expect(hermesWsUrl({ base: "http://127.0.0.1:9119", token: "dash-token" })).toBe(
      "ws://127.0.0.1:9119/api/ws?token=dash-token",
    )
    expect(hermesWsUrl({ base: "https://vps.example:443" })).toBe("wss://vps.example/api/ws")
    expect(hermesWsUrl({ base: "http://homelab.lan:9119" })).toBe("ws://homelab.lan:9119/api/ws")
    expect(buildHermesWsUrl({ host: "127.0.0.1" })).toBe("ws://127.0.0.1:9119/api/ws")
    expect(buildHermesWsUrl({ baseUrl: "http://127.0.0.1:9119", token: "t1" })).toBe(
      "ws://127.0.0.1:9119/api/ws?token=t1",
    )
  })
})
