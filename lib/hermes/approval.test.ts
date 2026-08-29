import { describe, expect, it } from "vitest"
import {
  approvalChoiceLabel,
  approvalChrome,
  approvalRespondParams,
  approvalTimeoutLabel,
  approvalToolName,
  pendingApprovalFromEvent,
  resolvePendingApproval,
  showApprovalChoices,
  yoloBannerCopy,
} from "./approval"

describe("approval card contract", () => {
  it("labels Hermes four choices", () => {
    expect(approvalChoiceLabel("once")).toBe("Once")
    expect(approvalChoiceLabel("session")).toBe("This chat")
    expect(approvalChoiceLabel("always")).toBe("Always")
    expect(approvalChoiceLabel("deny")).toBe("Deny")
  })

  it("counts down in whole seconds", () => {
    expect(approvalTimeoutLabel(300)).toBe("300s left")
    expect(approvalTimeoutLabel(-1)).toBe("0s left")
  })

  it("uses a visible YOLO banner and never invents a pending command", () => {
    expect(yoloBannerCopy()).toBe("Approvals off on this machine")
    expect(resolvePendingApproval([])).toBeNull()
    expect(pendingApprovalFromEvent({ type: "message.delta", payload: { text: "hi" } })).toBeNull()
    expect(showApprovalChoices(null, false)).toBe(false)
  })

  it("maps a live approval.request and does not offer YOLO on the phone", () => {
    const pending = pendingApprovalFromEvent({
      type: "approval.request",
      session_id: "s1",
      payload: {
        request_id: "a1",
        command: "rm -rf /tmp/x",
        description: "Delete a temp path",
        allow_permanent: true,
      },
    })
    expect(pending).toEqual({
      id: "a1",
      command: "rm -rf /tmp/x",
      reason: "Delete a temp path",
      secondsLeft: 300,
      yolo: false,
    })
    expect(showApprovalChoices(pending, false)).toBe(true)
    expect(showApprovalChoices(pending, true)).toBe(false)
    expect(approvalRespondParams("once", "s1", "a1")).toEqual({
      method: "approval.respond",
      choice: "once",
      session_id: "s1",
      request_id: "a1",
    })
  })

  it("names the tool from the command and uses dashboard-style chrome classes", () => {
    expect(approvalToolName("web_search query=cats")).toBe("web_search")
    expect(approvalToolName("  ")).toBe("tool")
    expect(approvalChrome()).toEqual({
      cardClass: "mk-approval-card",
      commandClass: "mk-approval-command",
      railClass: "mk-approval-rail",
    })
  })
})
