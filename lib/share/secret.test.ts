import { describe, expect, it } from "vitest"
import { decodeSharePayload, encodeSharePayload } from "./codec"
import {
  decodeEncryptedSharePayload,
  encodeEncryptedSharePayload,
  isEncryptedShareToken,
} from "./secret"

const sample = {
  userName: "Ada",
  tasks: [
    {
      id: 1,
      title: "Secret bill",
      completed: false,
      priority: "high" as const,
      dueDate: "2026-08-24",
    },
  ],
  sharedAt: "2026-08-23T00:00:00.000Z",
}

describe("password-protected share links", () => {
  it("encrypts a payload so the token is not readable JSON", async () => {
    const encoded = await encodeEncryptedSharePayload(sample, "correct horse")
    expect(encoded.ok).toBe(true)
    if (!encoded.ok) {
      return
    }

    expect(isEncryptedShareToken(encoded.token)).toBe(true)
    expect(encoded.token.includes("Secret bill")).toBe(false)
    expect(decodeSharePayload(encoded.token).ok).toBe(false)
  })

  it("decrypts with the password and rejects the wrong one", async () => {
    const encoded = await encodeEncryptedSharePayload(sample, "correct horse")
    expect(encoded.ok).toBe(true)
    if (!encoded.ok) {
      return
    }

    const unlocked = await decodeEncryptedSharePayload(encoded.token, "correct horse")
    expect(unlocked.ok).toBe(true)
    if (unlocked.ok) {
      expect(unlocked.payload.tasks[0]?.title).toBe("Secret bill")
    }

    const rejected = await decodeEncryptedSharePayload(encoded.token, "wrong")
    expect(rejected.ok).toBe(false)
  })

  it("refuses to mint an encrypted link without a password", async () => {
    const encoded = await encodeEncryptedSharePayload(sample, "   ")
    expect(encoded.ok).toBe(false)
  })

  it("still round-trips plaintext tokens for older links", () => {
    const encoded = encodeSharePayload(sample)
    expect(encoded.ok).toBe(true)
    if (!encoded.ok) {
      return
    }
    expect(isEncryptedShareToken(encoded.token)).toBe(false)
    const decoded = decodeSharePayload(encoded.token)
    expect(decoded.ok).toBe(true)
  })
})
