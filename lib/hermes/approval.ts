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
