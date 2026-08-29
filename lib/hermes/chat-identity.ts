/**
 * Session title helpers adapted from NousResearch/hermes-agent
 * web/src/lib/chat-title.ts (MIT License, Copyright (c) 2025 Nous Research).
 *
 * Desktop Bot Mode pins one forever DM per bot titled exactly "Bot Chat".
 */

import type { SessionSource } from "@/lib/dialer/types"

export const CANONICAL_BOT_CHAT_TITLE = "Bot Chat"

export type ChatIdentityKind = "bot-chat" | "machine" | "demo" | "new"

export function normalizeSessionTitle(raw: unknown): string | null {
  if (typeof raw !== "string") {
    return null
  }
  const title = raw.trim()
  return title ? title : null
}

export function isCanonicalBotChatTitle(title: string): boolean {
  return normalizeSessionTitle(title) === CANONICAL_BOT_CHAT_TITLE
}

export function chatIdentityKind(input: { title: string; source?: SessionSource }): ChatIdentityKind {
  if (isCanonicalBotChatTitle(input.title)) {
    return "bot-chat"
  }
  switch (input.source) {
    case "demo":
      return "demo"
    case "paired":
      return "machine"
    case undefined:
      return "new"
    default: {
      const _exhaustive: never = input.source
      return _exhaustive
    }
  }
}

export function chatIdentityLabel(kind: ChatIdentityKind, title: string): string {
  switch (kind) {
    case "bot-chat":
      return CANONICAL_BOT_CHAT_TITLE
    case "machine":
    case "demo":
    case "new": {
      return normalizeSessionTitle(title) ?? title
    }
    default: {
      const _exhaustive: never = kind
      return _exhaustive
    }
  }
}
