#!/usr/bin/env node
import { appendFileSync, mkdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const WRITE_SQL =
  /\b(INSERT|UPDATE|DELETE|MERGE|DROP|TRUNCATE|ALTER|GRANT|REVOKE|CREATE|COPY|CALL|DO|VACUUM|REINDEX|CLUSTER|COMMENT|SECURITY)\b/i

function databaseUserFromUrl(url) {
  try {
    return decodeURIComponent(new URL(url).username || "") || null
  } catch {
    const match = url.match(/^postgres(?:ql)?:\/\/([^:/]+)@/i)
    return match?.[1] ? decodeURIComponent(match[1]) : null
  }
}

function redact(value) {
  return value.replace(/:([^:@/]+)@/g, ":***@")
}

function writeAttempt(action, requested, reason) {
  const dir = join(root, "qa/attempts")
  mkdirSync(dir, { recursive: true })
  appendFileSync(
    join(dir, "attempts.log"),
    [
      `at: ${new Date().toISOString()}`,
      `action: ${action}`,
      "blocked: true",
      `requested: ${redact(requested)}`,
      `reason: ${reason}`,
      "",
    ].join("\n"),
  )
}

const command = process.argv[2] ?? "url"
const value = process.argv.slice(3).join(" ") || process.env.DATABASE_URL || ""

try {
  if (command === "url") {
    if (!value) {
      process.stdout.write("QA read-only guard: no DATABASE_URL. PWA path only.\n")
      process.exit(0)
    }
    const user = databaseUserFromUrl(value)
    if (user === "managekar" || user === "postgres") {
      throw new Error(`QA refused owner database URL for role ${user}. Use qa_agent.`)
    }
    if (user !== "qa_agent") {
      throw new Error(`QA refused database URL. Role must be qa_agent, not ${user ?? "missing"}.`)
    }
    process.stdout.write("QA read-only guard: database URL accepted for qa_agent\n")
    process.exit(0)
  }
  if (command === "sql") {
    const stripped = value.replace(/--[^\n]*/g, " ").replace(/\/\*[\s\S]*?\*\//g, " ").trim()
    if (!stripped || WRITE_SQL.test(stripped)) {
      throw new Error("QA refused mutating SQL. SELECT/EXPLAIN/SHOW only. Write cleanup to a review file.")
    }
    process.stdout.write("QA read-only guard: SQL accepted\n")
    process.exit(0)
  }
  throw new Error(`Unknown command ${command}`)
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  writeAttempt(command === "sql" ? "sql-write" : "use-owner-db-url", value, message)
  process.stderr.write(`${message}\n`)
  process.exit(2)
}
