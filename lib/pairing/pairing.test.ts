import { describe, expect, it } from "vitest"
import type { KeyValueStore } from "@/lib/store/workspace"
import { createEmptyDialer, queueMessage } from "@/lib/dialer/dialer"
import {
  PAIRING_KEY,
  completeSimulatedPairing,
  createEmptyPairing,
  generatePairingCode,
  loadPairing,
  machineSessionId,
  markMachineSeen,
  pairingLink,
  parsePairing,
  removeMachine,
  savePairing,
} from "./pairing"

class MemoryStore implements KeyValueStore {
  private readonly data = new Map<string, string>()

  getItem(key: string): string | null {
    return this.data.has(key) ? this.data.get(key)! : null
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value)
  }

  removeItem(key: string): void {
    this.data.delete(key)
  }
}

const NOW_ISO = "2026-08-28T12:00:00.000Z"

describe("generatePairingCode", () => {
  it("formats as MK-XXXX-XXXX from an unambiguous alphabet", () => {
    const code = generatePairingCode(() => 0.42)
    expect(code).toMatch(/^MK-[A-Z2-9]{4}-[A-Z2-9]{4}$/)
    expect(code).not.toMatch(/[O01IL]/)
  })

  it("varies with the random source", () => {
    let calls = 0
    const code = generatePairingCode(() => {
      calls += 1
      return (calls % 10) / 10
    })
    expect(code).toMatch(/^MK-[A-Z2-9]{4}-[A-Z2-9]{4}$/)
    expect(new Set(code.replace("MK-", "").replace("-", "")).size).toBeGreaterThan(1)
  })
})

describe("pairingLink", () => {
  it("builds a local link that carries the code", () => {
    const link = pairingLink("MK-ABCD-EFGH")
    expect(link).toContain("MK-ABCD-EFGH")
  })
})

describe("parsePairing", () => {
  it("returns an empty state for garbage", () => {
    expect(parsePairing(null)).toEqual(createEmptyPairing())
    expect(parsePairing("nope")).toEqual(createEmptyPairing())
    expect(parsePairing({ machines: "bad" })).toEqual(createEmptyPairing())
  })

  it("keeps valid machines and drops broken rows", () => {
    const state = parsePairing({
      schemaVersion: 1,
      machines: [
        { id: "m1", name: "Home VPS", kind: "vps", pairedAt: NOW_ISO, lastSeenAt: NOW_ISO },
        { id: "", name: "broken" },
        { id: "m2", name: "Laptop", kind: "weird-kind", pairedAt: NOW_ISO, lastSeenAt: NOW_ISO },
      ],
    })
    expect(state.machines).toHaveLength(2)
    expect(state.machines[0]?.name).toBe("Home VPS")
    expect(state.machines[1]?.kind).toBe("local")
  })
})

describe("persistence", () => {
  it("round-trips through storage", () => {
    const storage = new MemoryStore()
    const empty = createEmptyPairing()
    const { pairing } = completeSimulatedPairing(empty, createEmptyDialer(), {
      id: "m1",
      name: "Home VPS",
      kind: "vps",
      nowIso: NOW_ISO,
    })
    savePairing(storage, pairing)
    expect(storage.getItem(PAIRING_KEY)).not.toBeNull()
    expect(loadPairing(storage).machines).toHaveLength(1)
  })

  it("recovers from corrupt storage with an empty state", () => {
    const storage = new MemoryStore()
    storage.setItem(PAIRING_KEY, "{corrupt")
    expect(loadPairing(storage)).toEqual(createEmptyPairing())
  })
})

describe("completeSimulatedPairing", () => {
  it("adds a machine and creates an active paired dialer session", () => {
    const result = completeSimulatedPairing(createEmptyPairing(), createEmptyDialer(), {
      id: "m1",
      name: "Home VPS",
      kind: "vps",
      nowIso: NOW_ISO,
    })

    expect(result.pairing.machines).toEqual([
      { id: "m1", name: "Home VPS", kind: "vps", pairedAt: NOW_ISO, lastSeenAt: NOW_ISO },
    ])
    const session = result.dialer.sessions.find((item) => item.id === machineSessionId("m1"))
    expect(session?.source).toBe("paired")
    expect(session?.presence).toBe("active")
    expect(session?.title).toBe("Home VPS")
  })

  it("produces a session whose deliver:true sends are marked sent", () => {
    const result = completeSimulatedPairing(createEmptyPairing(), createEmptyDialer(), {
      id: "m1",
      name: "Home VPS",
      kind: "vps",
      nowIso: NOW_ISO,
    })
    const queued = queueMessage(result.dialer, machineSessionId("m1"), "hello", NOW_ISO, { deliver: true })
    expect(queued?.message.status).toBe("sent")
  })

  it("does not duplicate the machine or session when paired twice", () => {
    const first = completeSimulatedPairing(createEmptyPairing(), createEmptyDialer(), {
      id: "m1",
      name: "Home VPS",
      kind: "vps",
      nowIso: NOW_ISO,
    })
    const second = completeSimulatedPairing(first.pairing, first.dialer, {
      id: "m1",
      name: "Home VPS renamed",
      kind: "vps",
      nowIso: "2026-08-29T12:00:00.000Z",
    })
    expect(second.pairing.machines).toHaveLength(1)
    expect(second.pairing.machines[0]?.name).toBe("Home VPS renamed")
    expect(second.dialer.sessions.filter((item) => item.id === machineSessionId("m1"))).toHaveLength(1)
  })
})

describe("markMachineSeen", () => {
  it("updates lastSeenAt for the machine", () => {
    const { pairing } = completeSimulatedPairing(createEmptyPairing(), createEmptyDialer(), {
      id: "m1",
      name: "Home VPS",
      kind: "vps",
      nowIso: NOW_ISO,
    })
    const later = "2026-08-29T09:00:00.000Z"
    const seen = markMachineSeen(pairing, "m1", later)
    expect(seen.machines[0]?.lastSeenAt).toBe(later)
  })
})

describe("removeMachine", () => {
  it("removes the machine and its dialer session", () => {
    const paired = completeSimulatedPairing(createEmptyPairing(), createEmptyDialer(), {
      id: "m1",
      name: "Home VPS",
      kind: "vps",
      nowIso: NOW_ISO,
    })
    const removed = removeMachine(paired.pairing, paired.dialer, "m1")
    expect(removed.pairing.machines).toHaveLength(0)
    expect(removed.dialer.sessions.some((item) => item.id === machineSessionId("m1"))).toBe(false)
  })
})
