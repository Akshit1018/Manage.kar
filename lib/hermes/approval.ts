import type { HermesEvent } from "./protocol"

export type ApprovalChoice = "once" | "session" | "always" | "deny"

export interface PendingApproval {
  id: string
  command: string
  reason: string
  secondsLeft: number
  yolo: boolean
}

export function approvalChoiceLabel(choice: ApprovalChoice): string {
  switch (choice) {
    case "once":
      return "Once"
    case "session":
      return "This chat"
    case "always":
      return "Always"
    case "deny":
      return "Deny"
    default: {
      const _exhaustive: never = choice
      return _exhaustive
    }
  }
}

export function approvalTimeoutLabel(secondsLeft: number): string {
  return `${Math.max(0, Math.floor(secondsLeft))}s left`
}

export function yoloBannerCopy(): string {
  return "Approvals off on this machine"
}

export function resolvePendingApproval(list: PendingApproval[]): PendingApproval | null {
  return list[0] ?? null
}

function payloadString(payload: Record<string, unknown> | undefined, key: string): string {
  const value = payload?.[key]
  return typeof value === "string" ? value : ""
}

export function pendingApprovalFromEvent(event: HermesEvent): PendingApproval | null {
  if (event.type !== "approval.request") {
    return null
  }
  const command = payloadString(event.payload, "command")
  if (!command.trim()) {
    return null
  }
  const requestId = payloadString(event.payload, "request_id")
  return {
    id: requestId || `approval:${event.session_id ?? "unknown"}`,
    command,
    reason: payloadString(event.payload, "description") || payloadString(event.payload, "reason"),
    secondsLeft: typeof event.payload?.secondsLeft === "number" ? event.payload.secondsLeft : 300,
    yolo: false,
  }
}

export function approvalRespondParams(
  choice: ApprovalChoice,
  sessionId: string,
  requestId?: string,
): { method: "approval.respond"; choice: ApprovalChoice; session_id: string; request_id?: string } {
  return {
    method: "approval.respond",
    choice,
    session_id: sessionId,
    ...(requestId ? { request_id: requestId } : {}),
  }
}

export function showApprovalChoices(approval: PendingApproval | null, yolo: boolean): boolean {
  return Boolean(approval) && !yolo
}

export function approvalToolName(command: string): string {
  const token = command.trim().split(/\s+/)[0]
  return token || "tool"
}

export function showYoloBanner(yolo: boolean): boolean {
  return yolo
}

export function approvalChrome(): { cardClass: string; commandClass: string; railClass: string } {
  return {
    cardClass: "mk-approval-card",
    commandClass: "mk-approval-command",
    railClass: "mk-approval-rail",
  }
}
