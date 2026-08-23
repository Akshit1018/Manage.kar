import { describe, expect, it } from "vitest"
import { sanitizeAvatarUrl } from "./avatar"

describe("avatar URLs", () => {
  it("accepts https image URLs and rejects javascript or empty junk", () => {
    expect(sanitizeAvatarUrl("https://example.com/me.png")).toBe("https://example.com/me.png")
    expect(sanitizeAvatarUrl("javascript:alert(1)")).toBe("")
    expect(sanitizeAvatarUrl("data:text/html,hi")).toBe("")
    expect(sanitizeAvatarUrl("http://insecure.example/me.png")).toBe("")
  })
})
