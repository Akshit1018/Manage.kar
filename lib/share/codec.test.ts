import { describe, expect, it } from "vitest"
import {
  SHARE_EXPIRED_ERROR,
  decodeSharePayload,
  encodeSharePayload,
  isShareExpired,
  shareExpiresAt,
} from "./codec"

describe("share codec", () => {
  it("round-trips unicode task titles", () => {
    const encoded = encodeSharePayload({
      userName: "अक्षित",
      tasks: [
        {
          id: 1,
          title: "दवाई लेनी है",
          completed: false,
          priority: "high",
          dueDate: "Today",
        },
      ],
      sharedAt: "2026-08-23T00:00:00.000Z",
    })

    expect(encoded.ok).toBe(true)
    if (!encoded.ok) return

    const decoded = decodeSharePayload(encoded.token)
    expect(decoded.ok).toBe(true)
    if (decoded.ok) {
      expect(decoded.payload.userName).toBe("अक्षित")
      expect(decoded.payload.tasks[0]?.title).toBe("दवाई लेनी है")
    }
  })

  it("rejects corrupt share tokens", () => {
    const decoded = decodeSharePayload("%%%not-valid%%%")
    expect(decoded.ok).toBe(false)
  })

  it("computes a client-side expiry and rejects expired tokens", () => {
    const now = new Date("2026-08-23T12:00:00.000Z")
    expect(shareExpiresAt("never", now)).toBeUndefined()
    expect(shareExpiresAt("1d", now)).toBe("2026-08-24T12:00:00.000Z")
    expect(shareExpiresAt("7d", now)).toBe("2026-08-30T12:00:00.000Z")
    expect(shareExpiresAt("30d", now)).toBe("2026-09-22T12:00:00.000Z")

    const encoded = encodeSharePayload({
      userName: "Ada",
      tasks: [{ id: 1, title: "Bill", completed: false, priority: "high", dueDate: "2026-08-24" }],
      sharedAt: now.toISOString(),
      expiresAt: "2026-08-23T11:00:00.000Z",
    })
    expect(encoded.ok).toBe(true)
    if (!encoded.ok) return

    const decoded = decodeSharePayload(encoded.token, now)
    expect(decoded.ok).toBe(false)
    if (!decoded.ok) {
      expect(decoded.error).toBe(SHARE_EXPIRED_ERROR)
    }
  })

  it("still decodes links without expiresAt and future expiries", () => {
    const now = new Date("2026-08-23T12:00:00.000Z")
    const legacy = encodeSharePayload({
      userName: "Ada",
      tasks: [{ id: 1, title: "Bill", completed: false, priority: "high", dueDate: "2026-08-24" }],
      sharedAt: now.toISOString(),
    })
    expect(legacy.ok).toBe(true)
    if (!legacy.ok) return
    expect(decodeSharePayload(legacy.token, now).ok).toBe(true)

    const fresh = encodeSharePayload({
      userName: "Ada",
      tasks: [{ id: 1, title: "Bill", completed: false, priority: "high", dueDate: "2026-08-24" }],
      sharedAt: now.toISOString(),
      expiresAt: shareExpiresAt("7d", now),
    })
    expect(fresh.ok).toBe(true)
    if (!fresh.ok) return
    const decoded = decodeSharePayload(fresh.token, now)
    expect(decoded.ok).toBe(true)
    if (decoded.ok) {
      expect(isShareExpired(decoded.payload, now)).toBe(false)
    }
  })

  it("rejects oversized share payloads instead of minting an unusable URL", () => {
    const hugeTitle = "x".repeat(80_000)
    const encoded = encodeSharePayload({
      userName: "User",
      tasks: [
        {
          id: 1,
          title: hugeTitle,
          completed: false,
          priority: "low",
          dueDate: "Today",
        },
      ],
      sharedAt: "2026-08-23T00:00:00.000Z",
    })

    expect(encoded.ok).toBe(false)
  })
})
