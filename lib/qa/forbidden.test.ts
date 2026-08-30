import { describe, expect, it } from "vitest"
import { formatQaAttempt, qaAttemptRecord } from "./attempt-log"
import { formatQaCleanupFile } from "./cleanup-file"
import { FORBIDDEN_QA_ACTIONS, forbiddenQaReason, isForbiddenQaAction } from "./forbidden"

describe("QA never-do list", () => {
  it("names every forbidden action and records a blocked attempt", () => {
    expect(FORBIDDEN_QA_ACTIONS).toContain("sql-write")
    expect(FORBIDDEN_QA_ACTIONS).toContain("execute-cleanup")
    expect(FORBIDDEN_QA_ACTIONS).toContain("use-owner-db-url")
    expect(isForbiddenQaAction("sql-write")).toBe(true)
    expect(isForbiddenQaAction("please-delete")).toBe(false)
    const attempt = qaAttemptRecord({
      action: "execute-cleanup",
      requested: "psql -f qa/cleanup/cleanup-2026-08-30.md",
      now: "2026-08-30T19:22:00.000Z",
    })
    expect(attempt.blocked).toBe(true)
    expect(attempt.reason).toBe(forbiddenQaReason("execute-cleanup"))
    expect(formatQaAttempt(attempt)).toContain("blocked: true")
    expect(formatQaAttempt(attempt)).toContain("execute-cleanup")
    expect(
      qaAttemptRecord({
        action: "use-owner-db-url",
        requested: "postgresql://managekar:managekar@127.0.0.1:5432/managekar",
      }).requested,
    ).toBe("postgresql://managekar:***@127.0.0.1:5432/managekar")
  })

  it("writes cleanup as a review file, not a runnable agent command", () => {
    const file = formatQaCleanupFile({
      date: "2026-08-30",
      target: "pwa localStorage on this device",
      items: [
        {
          surface: "pwa-localStorage",
          kind: "task",
          title: "qa-2026-08-30-marker",
          proposed: "In Tasks, open qa-2026-08-30-marker and delete it after review.",
        },
      ],
    })
    expect(file).toContain("Status: review only")
    expect(file).toContain("qa-2026-08-30-marker")
    expect(file).toContain("must not execute")
  })
})
