import type { KeyValueStore } from "@/lib/store/workspace"
import {
  NEW_CHAT_TARGET,
  type DialerState,
  type HermesSession,
  type OutboxMessage,
  type SessionPresence,
  type WheelItem,
} from "./types"

export const DIALER_KEY = "managekar.dialer.v1"
export const WHEEL_ITEM_HEIGHT = 48
/** Window event asking the chat composer to expand (fired by the orb's Chats icon). */
export const COMPOSER_OPEN_EVENT = "managekar:composer-open"

export function createEmptyDialer(): DialerState {
  return { schemaVersion: 1, sessions: [], outbox: [] }
}

/**
 * Placeholder sessions so the dialer is usable before Hermes pairing lands.
 * Real sessions will replace these when the pairing flow syncs from the agent.
 */
export function demoSessions(now = new Date()): HermesSession[] {
  const minutesAgo = (minutes: number) => new Date(now.getTime() - minutes * 60_000).toISOString()
  return [
    { id: "demo-local", title: "Hermes · local", presence: "active", lastActivityAt: minutesAgo(4) },
    { id: "demo-vps", title: "Hermes · VPS", presence: "idle", lastActivityAt: minutesAgo(35) },
    { id: "demo-research", title: "Research bot", presence: "offline", lastActivityAt: minutesAgo(60 * 26) },
  ]
}

export function wheelItems(sessions: HermesSession[]): WheelItem[] {
  const sorted = [...sessions].sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt))
  return [
    { id: NEW_CHAT_TARGET, title: "New chat" },
    ...sorted.map((session) => ({ id: session.id, title: session.title, presence: session.presence })),
  ]
}

export function presenceDotClass(presence: SessionPresence): string {
  switch (presence) {
    case "active":
      return "bg-emerald-500"
    case "idle":
      return "bg-yellow-400"
    case "offline":
      return "bg-red-500"
    default: {
      const _exhaustive: never = presence
      throw new Error(`Unhandled presence: ${_exhaustive}`)
    }
  }
}

export function presenceLabel(presence: SessionPresence): string {
  switch (presence) {
    case "active":
      return "online"
    case "idle":
      return "idle"
    case "offline":
      return "offline"
    default: {
      const _exhaustive: never = presence
      throw new Error(`Unhandled presence: ${_exhaustive}`)
    }
  }
}

export function targetTitle(sessions: HermesSession[], target: string): string {
  return sessions.find((session) => session.id === target)?.title ?? "New chat"
}

export function queuedCountFor(state: DialerState, target: string): number {
  return state.outbox.filter((message) => message.target === target && message.status === "queued").length
}

export function queueMessage(
  state: DialerState,
  target: string,
  text: string,
  nowIso: string,
): { state: DialerState; message: OutboxMessage } | null {
  const trimmed = text.trim()
  if (!trimmed) {
    return null
  }
  const session = state.sessions.find((item) => item.id === target)
  const deliverable = session?.presence === "active"
  const nextId = state.outbox.reduce((max, message) => Math.max(max, message.id), 0) + 1
  const message: OutboxMessage = {
    id: nextId,
    target,
    text: trimmed,
    createdAt: nowIso,
    status: deliverable ? "sent" : "queued",
    ...(deliverable ? { sentAt: nowIso } : {}),
  }
  return {
    state: { ...state, outbox: [...state.outbox, message] },
    message,
  }
}

export function flushOutbox(state: DialerState, target: string, nowIso: string): DialerState {
  return {
    ...state,
    outbox: state.outbox.map((message) =>
      message.target === target && message.status === "queued"
        ? { ...message, status: "sent", sentAt: nowIso }
        : message,
    ),
  }
}

export function centeredWheelIndex(scrollTop: number, itemHeight: number, count: number): number {
  const index = Math.round(scrollTop / itemHeight)
  return Math.max(0, Math.min(count - 1, index))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function asSession(value: unknown): HermesSession | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.title !== "string") {
    return null
  }
  const presence =
    value.presence === "active" || value.presence === "idle" || value.presence === "offline"
      ? value.presence
      : "offline"
  return {
    id: value.id,
    title: value.title,
    presence,
    lastActivityAt: typeof value.lastActivityAt === "string" ? value.lastActivityAt : new Date(0).toISOString(),
  }
}

function asOutboxMessage(value: unknown): OutboxMessage | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "number" ||
    typeof value.target !== "string" ||
    typeof value.text !== "string"
  ) {
    return null
  }
  return {
    id: value.id,
    target: value.target,
    text: value.text,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : new Date(0).toISOString(),
    status: value.status === "sent" ? "sent" : "queued",
    ...(typeof value.sentAt === "string" ? { sentAt: value.sentAt } : {}),
  }
}

export function loadDialer(storage: KeyValueStore): DialerState {
  const raw = storage.getItem(DIALER_KEY)
  if (!raw) {
    const seeded = { ...createEmptyDialer(), sessions: demoSessions() }
    saveDialer(storage, seeded)
    return seeded
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    parsed = null
  }
  if (!isRecord(parsed)) {
    const seeded = { ...createEmptyDialer(), sessions: demoSessions() }
    saveDialer(storage, seeded)
    return seeded
  }
  const sessions = Array.isArray(parsed.sessions)
    ? parsed.sessions.map(asSession).filter((item): item is HermesSession => item !== null)
    : []
  const outbox = Array.isArray(parsed.outbox)
    ? parsed.outbox.map(asOutboxMessage).filter((item): item is OutboxMessage => item !== null)
    : []
  return {
    schemaVersion: 1,
    sessions: sessions.length > 0 ? sessions : demoSessions(),
    outbox,
  }
}

export function saveDialer(storage: KeyValueStore, state: DialerState): void {
  storage.setItem(DIALER_KEY, JSON.stringify(state))
}
