#!/usr/bin/env node
import { appendFileSync, mkdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const dsn = process.env.SENTRY_DSN ?? ""

if (!dsn) {
  const dir = join(root, "qa/attempts")
  mkdirSync(dir, { recursive: true })
  appendFileSync(
    join(dir, "attempts.log"),
    [
      `at: ${new Date().toISOString()}`,
      "action: query-sentry-without-dsn",
      "blocked: true",
      "requested: p50/p95/error-rate",
      "reason: No Sentry DSN. Observability queries fail closed instead of guessing.",
      "",
    ].join("\n"),
  )
  process.stderr.write("QA observability: SENTRY_DSN missing. Fail closed. No guessed p50.\n")
  process.exit(2)
}

process.stdout.write("QA observability: SENTRY_DSN present. Query Sentry MCP next.\n")
