import {
  canFlushOutbox,
  flushOutbox,
  queueMessage,
  resolveSession,
} from "@/lib/dialer/dialer"
import type { DialerState, OutboxMessage, SessionPresence, SessionSource } from "@/lib/dialer/types"
import type { ConnectionState } from "./client"

export interface DeliverabilityInput {
  source?: SessionSource
  presence?: SessionPresence
  connection: ConnectionState
}

export function canDeliverNow(input: DeliverabilityInput): boolean {
  if (input.source === "demo" || input.source === undefined) {
    return false
  }
  return input.connection === "open" && input.presence === "active" && input.source === "paired"
}

export interface SubmitPromptParams {
  method: "prompt.submit"
  text: string
  session_id: string
}

export interface SendCompanionInput {
  state: DialerState
  target: string
  text: string
  nowIso: string
  connection: ConnectionState
  submit: (params: SubmitPromptParams) => Promise<unknown>
}

export async function sendCompanionMessage(
  input: SendCompanionInput,
): Promise<{ state: DialerState; message: OutboxMessage; submitted: boolean }> {
  const queued = queueMessage(input.state, input.target, input.text, input.nowIso)
  if (!queued) {
    throw new Error("Message is empty")
  }
  const session = resolveSession(queued.state, input.target)
  if (!canDeliverNow({ source: session?.source, presence: session?.presence, connection: input.connection })) {
    return { state: queued.state, message: queued.message, submitted: false }
  }
  if (!canFlushOutbox(session)) {
    return { state: queued.state, message: queued.message, submitted: false }
  }
  try {
    await input.submit({
      method: "prompt.submit",
      text: queued.message.text,
      session_id: input.target,
    })
  } catch {
    return { state: queued.state, message: queued.message, submitted: false }
  }
  const flushed = flushOutbox(queued.state, input.target, input.nowIso)
  const message = flushed.outbox.find((item) => item.id === queued.message.id) ?? queued.message
  return { state: flushed, message, submitted: message.status === "sent" }
}
