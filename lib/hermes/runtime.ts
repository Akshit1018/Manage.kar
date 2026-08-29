import type { PendingApproval } from "./approval"
import { pendingApprovalFromEvent } from "./approval"
import type { ConnectionState } from "./client"
import { applyHermesEvent, createThread, type ThreadState } from "./thread"
import type { HermesEvent } from "./protocol"

export interface CompanionRuntime {
  connection: ConnectionState
  threads: Record<string, ThreadState>
  approvals: Record<string, PendingApproval>
  yolo: boolean
}

export function createCompanionRuntime(): CompanionRuntime {
  return {
    connection: "idle",
    threads: {},
    approvals: {},
    yolo: false,
  }
}

export function applyRuntimeEvent(runtime: CompanionRuntime, event: HermesEvent): CompanionRuntime {
  const sessionId = event.session_id
  const approval = pendingApprovalFromEvent(event)
  const approvals = { ...runtime.approvals }
  if (approval && sessionId) {
    approvals[sessionId] = approval
  }
  if (!sessionId) {
    return { ...runtime, approvals }
  }
  const current = runtime.threads[sessionId] ?? createThread(sessionId)
  return {
    ...runtime,
    approvals,
    threads: {
      ...runtime.threads,
      [sessionId]: applyHermesEvent(current, event),
    },
  }
}

export function approvalForSession(runtime: CompanionRuntime, sessionId: string): PendingApproval | null {
  return runtime.approvals[sessionId] ?? null
}

export function clearApproval(runtime: CompanionRuntime, sessionId: string): CompanionRuntime {
  const approvals = { ...runtime.approvals }
  delete approvals[sessionId]
  return { ...runtime, approvals }
}

let singleton = createCompanionRuntime()
const listeners = new Set<(runtime: CompanionRuntime) => void>()

export function getCompanionRuntime(): CompanionRuntime {
  return singleton
}

export function setCompanionRuntime(next: CompanionRuntime): void {
  singleton = next
  for (const listener of listeners) {
    listener(singleton)
  }
}

export function subscribeCompanionRuntime(listener: (runtime: CompanionRuntime) => void): () => void {
  listeners.add(listener)
  listener(singleton)
  return () => {
    listeners.delete(listener)
  }
}

export function resetCompanionRuntime(): void {
  setCompanionRuntime(createCompanionRuntime())
}
