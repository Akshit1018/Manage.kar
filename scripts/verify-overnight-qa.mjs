#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const failures = []

function fail(message) {
  failures.push(message)
}

function read(rel) {
  const path = join(root, rel)
  if (!existsSync(path)) {
    fail(`missing file ${rel}`)
    return ""
  }
  return readFileSync(path, "utf8")
}

function requireIncludes(rel, needles) {
  const source = read(rel)
  if (!source) {
    return source
  }
  for (const needle of needles) {
    if (!source.includes(needle)) {
      fail(`${rel} missing ${JSON.stringify(needle)}`)
    }
  }
  return source
}

function run(command, args, expectedStatus) {
  const result = spawnSync(command, args, { cwd: root, encoding: "utf8" })
  if (result.status !== expectedStatus) {
    fail(`${command} ${args.join(" ")} exited ${result.status}, expected ${expectedStatus}`)
    if (result.stdout) {
      process.stderr.write(result.stdout)
    }
    if (result.stderr) {
      process.stderr.write(result.stderr)
    }
  }
  return result
}

requireIncludes("lib/qa/readonly-guard.ts", ["qa_agent", "assertQaDatabaseUrl", "assertReadOnlySql"])
requireIncludes("lib/qa/forbidden.ts", ["execute-cleanup", "use-owner-db-url", "sql-write"])
requireIncludes("qa/sql/001-create-qa-agent-readonly.sql", [
  "CREATE ROLE qa_agent",
  "GRANT SELECT",
  "REVOKE INSERT, UPDATE, DELETE, TRUNCATE",
])
requireIncludes("qa/MISSION.md", ["YOU MAY NOT", "Execute cleanup"])
requireIncludes("qa/NEVER.md", ["qa/attempts/attempts.log"])
requireIncludes("scripts/qa-readonly-guard.mjs", ["qa_agent", "attempts.log"])
requireIncludes("scripts/qa-cleanup-write.mjs", ["execute-cleanup"])

run("./node_modules/.bin/vitest", ["run", "lib/qa/readonly-guard.test.ts", "lib/qa/forbidden.test.ts"], 0)
run(process.execPath, ["scripts/qa-readonly-guard.mjs", "url"], 0)
run(
  process.execPath,
  ["scripts/qa-readonly-guard.mjs", "url", "postgresql://managekar:managekar@127.0.0.1:5432/managekar"],
  2,
)
run(process.execPath, ["scripts/qa-readonly-guard.mjs", "sql", "DELETE FROM \"Task\""], 2)
run(process.execPath, ["scripts/qa-cleanup-write.mjs", "execute"], 2)
run(process.execPath, ["scripts/qa-observability.mjs"], 2)

const attempts = read("qa/attempts/attempts.log")
for (const needle of ["use-owner-db-url", "sql-write", "execute-cleanup", "query-sentry-without-dsn"]) {
  if (!attempts.includes(needle)) {
    fail(`qa/attempts/attempts.log missing ${needle}`)
  }
}

if (failures.length > 0) {
  for (const item of failures) {
    process.stderr.write(`${item}\n`)
  }
  process.exit(1)
}

process.stdout.write("overnight qa verification passed\n")
