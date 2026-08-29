import { describe, expect, it } from "vitest"
import {
  MANAGEKAR_PAIR_KIND,
  buildManagekarPairTicket,
  claimPluginPair,
  compactPairPayload,
  parseManagekarClaimResult,
  parseManagekarPairTicket,
  parsePairPayload,
  pluginClaimUrl,
  pluginPairUrl,
  pluginQrUrl,
  requestPluginPair,
} from "./plugin-pair"

const NOW = "2026-08-29T17:00:00.000Z"
const LATER = "2026-08-29T17:01:00.000Z"

describe("managekar.pair.v1", () => {
  it("builds a ticket the phone can claim", () => {
    const ticket = buildManagekarPairTicket({
      pairId: "aa".repeat(16),
      claimUrl: "http://127.0.0.1:9119/api/plugins/managekar/claim",
      qrUrl: "http://127.0.0.1:9119/pair/aabb",
      hostLabel: "Home VPS",
      expiresAt: "2026-08-29T17:10:00.000Z",
    })
    expect(ticket.kind).toBe(MANAGEKAR_PAIR_KIND)
    expect(ticket.v).toBe(1)
    expect(parseManagekarPairTicket(ticket)).toEqual(ticket)
  })

  it("rejects non-tickets and missing claim URLs", () => {
    expect(parseManagekarPairTicket(null)).toBeNull()
    expect(parseManagekarPairTicket({ v: 1, kind: "whatsapp" })).toBeNull()
    expect(
      parseManagekarPairTicket({
        v: 1,
        kind: MANAGEKAR_PAIR_KIND,
        pairId: "x",
        claimUrl: "ftp://nope",
        expiresAt: NOW,
      }),
    ).toBeNull()
  })

  it("reads JSON, compact, and URL payloads", () => {
    const ticket = buildManagekarPairTicket({
      pairId: "pair1",
      claimUrl: "http://10.0.0.4:9119/api/plugins/managekar/claim",
      expiresAt: NOW,
    })
    expect(parsePairPayload(JSON.stringify(ticket))?.pairId).toBe("pair1")
    expect(parsePairPayload(compactPairPayload(ticket))?.pairId).toBe("pair1")
    expect(
      parsePairPayload("http://10.0.0.4:9119/pair/pair1")?.claimUrl,
    ).toBe("http://10.0.0.4:9119/api/plugins/managekar/claim")
  })
})

describe("plugin routes", () => {
  it("mounts under /api/plugins/managekar/", () => {
    expect(pluginPairUrl("http://127.0.0.1:9119")).toBe(
      "http://127.0.0.1:9119/api/plugins/managekar/pair",
    )
    expect(pluginClaimUrl("http://127.0.0.1:9119/")).toBe(
      "http://127.0.0.1:9119/api/plugins/managekar/claim",
    )
    expect(pluginQrUrl("http://127.0.0.1:9119", "abc")).toBe(
      "http://127.0.0.1:9119/pair/abc",
    )
  })
})

describe("claim result", () => {
  it("keeps endpoint and token and drops empty fields", () => {
    expect(
      parseManagekarClaimResult({
        endpoint: "http://127.0.0.1:9119",
        token: "mk_live",
        install_id: "install-1",
        version: "0.5.0-stub",
      }),
    ).toEqual({
      endpoint: "http://127.0.0.1:9119",
      token: "mk_live",
      installId: "install-1",
      version: "0.5.0-stub",
    })
    expect(parseManagekarClaimResult({ endpoint: "http://x", token: "" })).toBeNull()
  })
})

describe("requestPluginPair / claimPluginPair", () => {
  it("pairs from a host mint then claims once", async () => {
    const ticket = buildManagekarPairTicket({
      pairId: "minted",
      claimUrl: "http://127.0.0.1:9119/api/plugins/managekar/claim",
      expiresAt: "2026-08-29T17:10:00.000Z",
      hostLabel: "stub",
    })
    const minted = await requestPluginPair({
      fetchImpl: async (url) => {
        expect(String(url)).toContain("/api/plugins/managekar/pair")
        return new Response(JSON.stringify({ ticket }), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      },
      baseUrl: "http://127.0.0.1:9119",
      hostLabel: "stub",
    })
    expect(minted.pairId).toBe("minted")

    const claimed = await claimPluginPair({
      fetchImpl: async (url, init) => {
        expect(String(url)).toBe(ticket.claimUrl)
        const body = JSON.parse(String(init?.body))
        expect(body.pair_id).toBe("minted")
        return new Response(
          JSON.stringify({
            endpoint: "http://127.0.0.1:9119",
            token: "mk_claimed",
            install_id: "install-1",
            version: "0.5.0-stub",
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        )
      },
      ticket: minted,
      deviceId: "phone-1",
      deviceName: "Pixel",
      nowIso: LATER,
    })
    expect(claimed.token).toBe("mk_claimed")
  })

  it("does not claim an expired ticket", async () => {
    const ticket = buildManagekarPairTicket({
      pairId: "old",
      claimUrl: "http://127.0.0.1:9119/api/plugins/managekar/claim",
      expiresAt: NOW,
    })
    await expect(
      claimPluginPair({
        fetchImpl: async () => {
          throw new Error("should not fetch")
        },
        ticket,
        deviceId: "phone-1",
        deviceName: "Pixel",
        nowIso: "2026-08-29T17:20:00.000Z",
      }),
    ).rejects.toThrow(/expired/i)
  })
})
