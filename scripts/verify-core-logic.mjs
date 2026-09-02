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

function requireAbsent(rel, needles) {
  const source = read(rel)
  if (!source) {
    return source
  }
  for (const needle of needles) {
    if (source.includes(needle)) {
      fail(`${rel} still contains ${JSON.stringify(needle)}`)
    }
  }
  return source
}

requireIncludes("docs/FEATURE_TRUTH_MAP.md", [
  "two stores",
  "isHabitScheduledOn",
  "tab is open",
  "idb:voice:",
  "model: dummy",
  "?view=",
  "deleteGoal",
])
requireAbsent("docs/FEATURE_TRUTH_MAP.md", [
  "Canonical forensic copy",
  "toggleHabitOnDate never reads them",
])
requireIncludes("docs/forensic/FEATURE_TRUTH_MAP.md", ["34ef512", "docs/FEATURE_TRUTH_MAP.md", "Not HEAD"])
requireIncludes("docs/DECISIONS.md", ["D021", "two stores", "model: dummy"])
requireIncludes("docs/QUALITY_SCORECARD.md", ["apps/api"])
requireAbsent("docs/QUALITY_SCORECARD.md", ["14 unit tests", "goals/time not in it yet", "API | n/a"])
requireIncludes("lib/habits/streak.ts", ["isHabitScheduledOn"])
requireIncludes("lib/habits/schedule.ts", ["customDays"])
requireIncludes("lib/reminders/use-local-reminders.ts", ["setInterval", "60_000"])
requireIncludes("apps/mobile/lib/src/overlay/overlay_capability.dart", [
  "does not verify a live overlay draw",
])
requireIncludes("README.md", ["two clients", "docs/FEATURE_TRUTH_MAP.md"])

const tests = spawnSync("./node_modules/.bin/vitest", ["run", "lib/core/truth.test.ts"], {
  cwd: root,
  encoding: "utf8",
})
if (tests.status !== 0) {
  fail(`vitest exited ${tests.status}`)
  if (tests.stdout) {
    process.stderr.write(tests.stdout)
  }
  if (tests.stderr) {
    process.stderr.write(tests.stderr)
  }
}

if (failures.length > 0) {
  for (const item of failures) {
    process.stderr.write(`${item}\n`)
  }
  process.exit(1)
}

process.stdout.write("core logic verification passed\n")
