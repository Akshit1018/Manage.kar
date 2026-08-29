import type { KeyValueStore } from "@/lib/store/workspace"
import {
  NEW_CHAT_TARGET,
  type ChatListItem,
  type ComposerOpenDetail,
  type DialerState,
  type HermesSession,
  type OutboxMessage,
  type QueueCopyInput,
  type SessionPresence,
  type SessionSource,
  type WheelItem,
} from "./types"

export const DIALER_KEY = "managekar.dialer.v1"
export const DIALER_CHANGED_EVENT = "managekar:dialer-changed"
export const WHEEL_ITEM_HEIGHT = 48
/** Window event asking the chat composer to expand (fired by the orb's Chats icon). */
export const COMPOSER_OPEN_EVENT = "managekar:composer-open"

export function createEmptyDialer(): DialerState {
  return { schemaVersion: 1, sessions: [], outbox: [] }
}

/**
 * Placeholder sessions so the dialer is usable before Hermes pairing lands.
 * These stay in memory. Pairing replaces them; they are not written on first load.
 */
export function demoSessions(now = new Date()): HermesSession[] {
  const minutesAgo = (minutes: number) => new Date(now.getTime() - minutes * 60_000).toISOString()
  return [
    {
      id: "demo-local",
      title: "Hermes · local",
      presence: "active",
      lastActivityAt: minutesAgo(4),
      source: "demo",
    },
    {
      id: "demo-vps",
      title: "Hermes · VPS",
      presence: "idle",
      lastActivityAt: minutesAgo(35),
      source: "demo",
    },
    {
      id: "demo-research",
      title: "Research bot",
      presence: "offline",
      lastActivityAt: minutesAgo(60 * 26),
      source: "demo",
    },
  ]
}

export function visibleSessions(state: DialerState, now = new Date()): HermesSession[] {
  const paired = state.sessions.filter((session) => session.source === "paired")
  if (paired.length > 0) {
    return paired
  }
  if (state.sessions.length > 0) {
    return state.sessions
  }
  return demoSessions(now)
}

export function wheelItems(sessions: HermesSession[]): WheelItem[] {
  const sorted = [...sessions].sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt))
  return [
    { id: NEW_CHAT_TARGET, title: "New chat" },
    ...sorted.map((session) => ({
      id: session.id,
      title: session.title,
      presence: session.presence,
      source: session.source,
    })),
  ]
}

export function presenceDotClass(presence: SessionPresence, source?: SessionSource): string {
  if (source === "demo") {
    return "bg-muted-foreground/50"
  }
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

export function presenceLabel(presence: SessionPresence, source?: SessionSource): string {
  if (source === "demo") {
    return "not paired"
  }
  switch (presence) {
    case "active":
      return "reachable"
    case "idle":
      return "asleep"
    case "offline":
      return "unreachable"
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

export function resolveSession(state: DialerState, target: string): HermesSession | undefined {
  if (target === NEW_CHAT_TARGET) {
    return undefined
  }
  return state.sessions.find((item) => item.id === target) ?? demoSessions().find((item) => item.id === target)
}

export function queueMessage(
  state: DialerState,
  target: string,
  text: string,
  nowIso: string,
  options?: { deliver?: boolean },
): { state: DialerState; message: OutboxMessage } | null {
  const trimmed = text.trim()
  if (!trimmed) {
    return null
  }
  const known = resolveSession(state, target)
  const sessions =
    known && !state.sessions.some((item) => item.id === known.id) ? [...state.sessions, known] : state.sessions
  const deliverable = Boolean(options?.deliver) && known?.source === "paired" && known.presence === "active"
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
    state: { ...state, sessions, outbox: [...state.outbox, message] },
    message,
  }
}

export function canFlushOutbox(session?: HermesSession): boolean {
  return session?.source === "paired" && session.presence === "active"
}

export function flushOutbox(state: DialerState, target: string, nowIso: string): DialerState {
  const known = resolveSession(state, target)
  if (!canFlushOutbox(known)) {
    return state
  }
  return {
    ...state,
    outbox: state.outbox.map((message) =>
      message.target === target && message.status === "queued"
        ? { ...message, status: "sent", sentAt: nowIso }
        : message,
    ),
  }
}

export function queueCopy(input: QueueCopyInput): string {
  if (input.source === "demo") {
    return "Saved locally — will send after pairing"
  }
  if (input.status === "sent") {
    return "Sent"
  }
  switch (input.presence) {
    case "active":
    case "idle":
    case "offline":
      return "Queued — sends when the machine is reachable"
    case undefined:
      return "Saved locally — will send after pairing"
    default: {
      const _exhaustive: never = input.presence
      throw new Error(`Unhandled presence: ${_exhaustive}`)
    }
  }
}

export function messagesForTarget(state: DialerState, target: string): OutboxMessage[] {
  return state.outbox
    .filter((message) => message.target === target)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id - b.id)
}

export function chatListItems(state: DialerState, query = ""): ChatListItem[] {
  const sessions = visibleSessions(state)
  const newChatMessages = messagesForTarget(state, NEW_CHAT_TARGET)
  const items: ChatListItem[] = [
    {
      id: NEW_CHAT_TARGET,
      title: "New chat",
      queuedCount: queuedCountFor(state, NEW_CHAT_TARGET),
      preview: newChatMessages.at(-1)?.text ?? "Start a conversation",
      lastAt: newChatMessages.at(-1)?.createdAt ?? "",
    },
    ...[...sessions]
      .sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt))
      .map((session) => {
        const rows = messagesForTarget(state, session.id)
        return {
          id: session.id,
          title: session.title,
          presence: session.presence,
          source: session.source,
          queuedCount: queuedCountFor(state, session.id),
          preview: rows.at(-1)?.text ?? "No messages yet",
          lastAt: rows.at(-1)?.createdAt ?? session.lastActivityAt,
        }
      }),
  ]
  const needle = query.trim().toLowerCase()
  if (!needle) {
    return items
  }
  return items.filter(
    (item) => item.title.toLowerCase().includes(needle) || item.preview.toLowerCase().includes(needle),
  )
}

export function centeredWheelIndex(scrollTop: number, itemHeight: number, count: number): number {
  const index = Math.round(scrollTop / itemHeight)
  return Math.max(0, Math.min(count - 1, index))
}

export function dispatchComposerOpen(detail: ComposerOpenDetail = {}): void {
  if (typeof window === "undefined") {
    return
  }
  window.dispatchEvent(new CustomEvent<ComposerOpenDetail>(COMPOSER_OPEN_EVENT, { detail }))
}

export function notifyDialerChanged(): void {
  if (typeof window === "undefined") {
    return
  }
  window.dispatchEvent(new Event(DIALER_CHANGED_EVENT))
}

export function persistDialer(storage: KeyValueStore, state: DialerState): void {
  saveDialer(storage, state)
  if (typeof queueMicrotask === "function") {
    queueMicrotask(() => notifyDialerChanged())
    return
  }
  notifyDialerChanged()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

const DEMO_SESSION_IDS = new Set(demoSessions(new Date(0)).map((session) => session.id))

function asSource(value: unknown, id: string): SessionSource {
  if (value === "demo" || DEMO_SESSION_IDS.has(id)) {
    return "demo"
  }
  return "paired"
}

function asSession(value: unknown): HermesSession | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.title !== "string") {
    return null
  }
  if (value.id === NEW_CHAT_TARGET || value.id.trim() === "") {
    return null
  }
  const presence =
    value.presence === "active" || value.presence === "idle" || value.presence === "offline"
      ? value.presence
      : "offline"
  return {
    id: value.id.slice(0, 128),
    title: value.title.slice(0, 200),
    presence,
    lastActivityAt: typeof value.lastActivityAt === "string" ? value.lastActivityAt : new Date(0).toISOString(),
    source: asSource(value.source, value.id),
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
    target: value.target.slice(0, 128),
    text: value.text.slice(0, 20_000),
    createdAt: typeof value.createdAt === "string" ? value.createdAt : new Date(0).toISOString(),
    status: value.status === "sent" ? "sent" : "queued",
    ...(typeof value.sentAt === "string" ? { sentAt: value.sentAt } : {}),
  }
}

export function parseDialer(value: unknown): DialerState {
  if (!isRecord(value)) {
    return createEmptyDialer()
  }
  const sessions = Array.isArray(value.sessions)
    ? value.sessions.map(asSession).filter((item): item is HermesSession => item !== null)
    : []
  const outbox = Array.isArray(value.outbox)
    ? value.outbox.map(asOutboxMessage).filter((item): item is OutboxMessage => item !== null)
    : []
  return { schemaVersion: 1, sessions, outbox }
}

export function loadDialer(storage: KeyValueStore): DialerState {
  const raw = storage.getItem(DIALER_KEY)
  if (!raw) {
    return createEmptyDialer()
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    const empty = createEmptyDialer()
    saveDialer(storage, empty)
    return empty
  }
  return parseDialer(parsed)
}

export function saveDialer(storage: KeyValueStore, state: DialerState): void {
  storage.setItem(DIALER_KEY, JSON.stringify(state))
}

export function clearDialer(storage: KeyValueStore): void {
  storage.removeItem(DIALER_KEY)
}
