import { describe, expect, it } from "vitest"
import {
  CANONICAL_BOT_CHAT_TITLE,
  chatIdentityKind,
  chatIdentityLabel,
  isCanonicalBotChatTitle,
  normalizeSessionTitle,
} from "./chat-identity"

describe("Hermes Bot Chat title contract", () => {
  it("treats the exact desktop title as the canonical Bot Chat", () => {
    expect(CANONICAL_BOT_CHAT_TITLE).toBe("Bot Chat")
    expect(isCanonicalBotChatTitle("Bot Chat")).toBe(true)
    expect(isCanonicalBotChatTitle("  Bot Chat  ")).toBe(true)
    expect(isCanonicalBotChatTitle("Research bot")).toBe(false)
    expect(isCanonicalBotChatTitle("Home VPS")).toBe(false)
  })

  it("normalizes session titles the way the MIT dashboard does", () => {
    expect(normalizeSessionTitle("Bot Chat")).toBe("Bot Chat")
    expect(normalizeSessionTitle("  ")).toBeNull()
    expect(normalizeSessionTitle(12)).toBeNull()
    expect(normalizeSessionTitle(null)).toBeNull()
  })

  it("labels identity without inventing an online machine", () => {
    expect(chatIdentityKind({ title: "Bot Chat", source: "paired" })).toBe("bot-chat")
    expect(chatIdentityKind({ title: "Home VPS", source: "paired" })).toBe("machine")
    expect(chatIdentityKind({ title: "Research bot", source: "demo" })).toBe("demo")
    expect(chatIdentityKind({ title: "New chat" })).toBe("new")
    expect(chatIdentityLabel("bot-chat", "Bot Chat")).toBe("Bot Chat")
    expect(chatIdentityLabel("machine", "Home VPS")).toBe("Home VPS")
    expect(chatIdentityLabel("demo", "Research bot")).toBe("Research bot")
    expect(chatIdentityLabel("new", "New chat")).toBe("New chat")
  })
})
