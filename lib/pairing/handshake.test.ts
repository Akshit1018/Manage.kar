import { describe, expect, it } from "vitest"
import { createEmptyDialer } from "@/lib/dialer/dialer"
import { createEmptyPairing } from "./pairing"
import {
  PAIRING_CODE_TTL_MS,
  applyHelperProbe,
  handshakeStatusCopy,
  pairingFailureCopy,
  startHandshake,
} from "./handshake"
import { completeHandshakePairing } from "./handshake"

const STARTED = "2026-08-29T10:00:00.000Z"
const LATER = "2026-08-29T10:01:00.000Z"

describe("pairing handshake", () => {
  it("starts in waiting and does not pair from showing a QR", () => {
    const draft = startHandshake({
      name: "Home VPS",
      kind: "vps",
      code: "MK-ABCD-EFGH",
      nowIso: STARTED,
    })
    expect(draft.phase).toBe("waiting")
    expect(draft.expiresAt).toBe(new Date(Date.parse(STARTED) + PAIRING_CODE_TTL_MS).toISOString())
    expect(completeHandshakePairing(createEmptyPairing(), createEmptyDialer(), draft, STARTED)).toBeNull()
  })

  it("names helper_not_running, code_expired, and unreachable", () => {
    const draft = startHandshake({
      name: "Home VPS",
      kind: "vps",
      code: "MK-ABCD-EFGH",
      nowIso: STARTED,
    })
    expect(applyHelperProbe(draft, { kind: "helper_not_running" }, LATER).phase).toBe("failed")
    expect(applyHelperProbe(draft, { kind: "helper_not_running" }, LATER).failure).toBe("helper_not_running")
    expect(applyHelperProbe(draft, { kind: "unreachable" }, LATER).failure).toBe("unreachable")
    expect(pairingFailureCopy("helper_not_running")).toMatch(/helper is not running/i)
    expect(pairingFailureCopy("code_expired")).toMatch(/expired/i)
    expect(pairingFailureCopy("unreachable")).toMatch(/unreachable/i)
    expect(pairingFailureCopy("needs_token")).toMatch(/session token/i)
    expect(pairingFailureCopy("claim_failed")).toMatch(/ticket/i)
    expect(applyHelperProbe(draft, { kind: "needs_token" }, LATER).failure).toBe("needs_token")
    const expired = applyHelperProbe(draft, { kind: "waiting" }, "2026-08-29T10:20:00.000Z")
    expect(expired.failure).toBe("code_expired")
    expect(handshakeStatusCopy(expired, new Date("2026-08-29T10:20:00.000Z"))).toMatch(/expired/i)
  })

  it("pairs only when the helper confirms the code", () => {
    const draft = startHandshake({
      name: "Home VPS",
      kind: "vps",
      code: "MK-ABCD-EFGH",
      nowIso: STARTED,
    })
    const waiting = applyHelperProbe(draft, { kind: "waiting" }, LATER)
    expect(waiting.phase).toBe("waiting")
    const confirmed = applyHelperProbe(
      draft,
      { kind: "paired", machineId: "m1", name: "Home VPS" },
      LATER,
    )
    expect(confirmed.phase).toBe("paired")
    const result = completeHandshakePairing(createEmptyPairing(), createEmptyDialer(), confirmed, LATER)
    expect(result?.pairing.machines[0]?.id).toBe("m1")
    expect(result?.dialer.sessions[0]?.source).toBe("paired")
  })

  it("keeps waiting when /api/status looks like a Hermes dashboard", () => {
    const draft = startHandshake({
      name: "Home VPS",
      kind: "vps",
      code: "MK-ABCD-EFGH",
      nowIso: STARTED,
    })
    const waiting = applyHelperProbe(
      draft,
      { kind: "waiting", dashboard: { version: "0.5.0", gatewayRunning: true, authRequired: false } },
      LATER,
    )
    expect(waiting.phase).toBe("waiting")
    expect(waiting.dashboardVersion).toBe("0.5.0")
    expect(completeHandshakePairing(createEmptyPairing(), createEmptyDialer(), waiting, LATER)).toBeNull()
  })
})
