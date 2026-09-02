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
    return
  }
  for (const needle of needles) {
    if (!source.includes(needle)) {
      fail(`${rel} missing ${JSON.stringify(needle)}`)
    }
  }
}

function requireAbsent(rel, needles) {
  const source = read(rel)
  if (!source) {
    return
  }
  for (const needle of needles) {
    if (source.includes(needle)) {
      fail(`${rel} still has leftover ${JSON.stringify(needle)}`)
    }
  }
}

requireIncludes("lib/dialer/dialer.ts", ["CANONICAL_BOT_CHAT_TITLE"])
requireAbsent("lib/dialer/dialer.ts", ["Research bot"])
requireIncludes("apps/mobile/lib/src/state/dialer.dart", ['title: "Bot Chat"'])
requireAbsent("apps/mobile/lib/src/state/dialer.dart", ["Research bot"])
requireIncludes("lib/ui/home-chrome.ts", ['return "Today"'])
requireIncludes("components/workspace/dashboard.tsx", ["homeGreeting"])
requireAbsent("components/workspace/dashboard.tsx", ['"Your workspace"'])
requireIncludes("app/layout.tsx", ["Hermes companion"])
requireAbsent("app/layout.tsx", ["local tasks, notes, and habits"])
requireIncludes("apps/mobile/lib/src/screens/shell_screen.dart", ['label: "Home"'])
requireAbsent("apps/mobile/lib/src/screens/shell_screen.dart", ["Your workspace"])
requireIncludes("docs/DECISIONS.md", ["Bot Chat", "not a marketplace name"])

const tests = spawnSync(
  "./node_modules/.bin/vitest",
  [
    "run",
    "lib/dialer/dialer.test.ts",
    "lib/hermes/chat-identity.test.ts",
    "lib/ui/home-chrome.test.ts",
    "lib/core/truth.test.ts",
    "lib/core/remaining.test.ts",
  ],
  { cwd: root, encoding: "utf8" },
)
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

process.stdout.write("leftover name verification passed\n")
