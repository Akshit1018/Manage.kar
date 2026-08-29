export type SessionPresence = "active" | "idle" | "offline"
export type SessionSource = "demo" | "paired"

export interface HermesSession {
  id: string
  title: string
  presence: SessionPresence
  lastActivityAt: string
  source: SessionSource
}

/** The wheel's permanent first entry: composing to a brand-new chat. */
export const NEW_CHAT_TARGET = "new-chat"

export type OutboxStatus = "queued" | "sent"

export interface OutboxMessage {
  id: number
  /** NEW_CHAT_TARGET or a HermesSession id. */
  target: string
  text: string
  createdAt: string
  status: OutboxStatus
  sentAt?: string
}

export interface DialerState {
  schemaVersion: 1
  sessions: HermesSession[]
  outbox: OutboxMessage[]
}

export interface WheelItem {
  id: string
  title: string
  /** Undefined for the New chat entry, which has no machine behind it yet. */
  presence?: SessionPresence
  source?: SessionSource
}

export interface ChatListItem {
  id: string
  title: string
  presence?: SessionPresence
  source?: SessionSource
  queuedCount: number
  preview: string
  lastAt: string
}

export interface ComposerOpenDetail {
  target?: string
  openTab?: boolean
}

export interface QueueCopyInput {
  status: OutboxStatus
  source?: SessionSource
  presence?: SessionPresence
}
