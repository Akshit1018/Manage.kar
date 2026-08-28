export type SessionPresence = "active" | "idle" | "offline"

export interface HermesSession {
  id: string
  title: string
  presence: SessionPresence
  lastActivityAt: string
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
}
