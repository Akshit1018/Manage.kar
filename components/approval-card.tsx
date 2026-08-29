"use client"

import { Button } from "@/components/ui/button"
import {
  approvalChoiceLabel,
  approvalChrome,
  approvalTimeoutLabel,
  approvalToolName,
  yoloBannerCopy,
  type ApprovalChoice,
  type PendingApproval,
} from "@/lib/hermes/approval"

const CHOICES: ApprovalChoice[] = ["once", "session", "always", "deny"]

interface ApprovalCardProps {
  approval: PendingApproval | null
  onChoose?: (choice: ApprovalChoice) => void
}

export function ApprovalCard({ approval, onChoose }: ApprovalCardProps) {
  const chrome = approvalChrome()

  if (!approval) {
    return (
      <aside className={`${chrome.cardClass} mk-editorial-card space-y-2 p-4`} aria-label="No pending tool approval">
        <p className="text-sm text-muted-foreground">No tool is waiting for approval.</p>
      </aside>
    )
  }

  return (
    <aside className={`${chrome.cardClass} mk-editorial-card space-y-3 p-4`} aria-label="Pending tool approval">
      {approval.yolo ? (
        <p className="rounded-xl bg-destructive/15 px-3 py-2 text-sm font-medium text-destructive">
          {yoloBannerCopy()}
        </p>
      ) : null}
      <div className={chrome.railClass}>
        <span className="mk-approval-tool">{approvalToolName(approval.command)}</span>
        <p className={`${chrome.commandClass} font-semibold`}>{approval.command}</p>
        <p className="text-sm text-muted-foreground">{approval.reason}</p>
        <p className="text-xs text-muted-foreground">{approvalTimeoutLabel(approval.secondsLeft)}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {CHOICES.map((choice) => (
          <Button
            key={choice}
            type="button"
            variant={choice === "deny" ? "outline" : "default"}
            className="mk-touch"
            onClick={() => onChoose?.(choice)}
          >
            {approvalChoiceLabel(choice)}
          </Button>
        ))}
      </div>
    </aside>
  )
}
