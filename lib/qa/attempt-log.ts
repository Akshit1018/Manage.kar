import type { ForbiddenQaAction } from "./forbidden"
import { forbiddenQaReason } from "./forbidden"

export interface QaAttempt {
  at: string
  action: ForbiddenQaAction
  requested: string
  blocked: true
  reason: string
}

export function redactQaSecret(value: string): string {
  return value.replace(/:([^:@/]+)@/g, ":***@")
}

export function qaAttemptRecord(input: {
  action: ForbiddenQaAction
  requested: string
  now?: string
}): QaAttempt {
  return {
    at: input.now ?? new Date().toISOString(),
    action: input.action,
    requested: redactQaSecret(input.requested),
    blocked: true,
    reason: forbiddenQaReason(input.action),
  }
}

export function formatQaAttempt(attempt: QaAttempt): string {
  return [
    `at: ${attempt.at}`,
    `action: ${attempt.action}`,
    `blocked: ${attempt.blocked}`,
    `requested: ${attempt.requested}`,
    `reason: ${attempt.reason}`,
    "",
  ].join("\n")
}
