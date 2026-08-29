import { describe, expect, it } from "vitest"
import {
  approvalChoiceLabel,
  approvalChrome,
  approvalTimeoutLabel,
  approvalToolName,
  resolvePendingApproval,
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
