export const FORBIDDEN_QA_ACTIONS = [
  "sql-write",
  "use-owner-db-url",
  "execute-cleanup",
  "delete-workspace",
  "reset-local-workspace",
  "change-config",
  "pair-real-host",
  "spend-live-model",
  "query-sentry-without-dsn",
] as const

export type ForbiddenQaAction = (typeof FORBIDDEN_QA_ACTIONS)[number]

export function isForbiddenQaAction(value: string): value is ForbiddenQaAction {
  return (FORBIDDEN_QA_ACTIONS as readonly string[]).includes(value)
}

export function forbiddenQaReason(action: ForbiddenQaAction): string {
  switch (action) {
    case "sql-write":
      return "Mutating SQL is blocked. Propose it in qa/cleanup/ for a human."
    case "use-owner-db-url":
      return "Owner DATABASE_URL is blocked. QA may only use role qa_agent."
    case "execute-cleanup":
      return "Cleanup files are review-only. A human runs them after reading."
    case "delete-workspace":
      return "DELETE /api/workspace and account wipes are forbidden."
    case "reset-local-workspace":
      return "Reset workspace / localStorage clear on a real profile is forbidden."
    case "change-config":
      return "Config, secrets, DNS, and env writes are forbidden."
    case "pair-real-host":
      return "Pairing a real Hermes host is forbidden on an unattended run."
    case "spend-live-model":
      return "Live model spend is forbidden. Dummy / no keys only."
    case "query-sentry-without-dsn":
      return "No Sentry DSN. Observability queries fail closed instead of guessing."
    default: {
      const _exhaustive: never = action
      return _exhaustive
    }
  }
}
