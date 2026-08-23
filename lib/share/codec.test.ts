import { describe, expect, it } from "vitest"
import { decodeSharePayload, encodeSharePayload } from "./codec"

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
