"use client"

import { Button } from "@/components/ui/button"
import {
  approvalChoiceLabel,
  approvalTimeoutLabel,
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
  if (!approval) {
    return null
  }

  return (
    <aside className="mk-editorial-card space-y-3 p-4" aria-label="Pending tool approval">
      {approval.yolo ? (
        <p className="rounded-xl bg-destructive/15 px-3 py-2 text-sm font-medium text-destructive">
          {yoloBannerCopy()}
        </p>
      ) : null}
      <div>
        <p className="text-sm font-semibold">{approval.command}</p>
        <p className="mt-1 text-sm text-muted-foreground">{approval.reason}</p>
        <p className="mt-2 text-xs text-muted-foreground">{approvalTimeoutLabel(approval.secondsLeft)}</p>
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
