#!/usr/bin/env node
import { appendFileSync, mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const command = process.argv[2] ?? "write"

if (command === "execute" || command === "run") {
  const dir = join(root, "qa/attempts")
  mkdirSync(dir, { recursive: true })
  appendFileSync(
    join(dir, "attempts.log"),
    [
      `at: ${new Date().toISOString()}`,
      "action: execute-cleanup",
      "blocked: true",
      `requested: ${process.argv.slice(2).join(" ")}`,
      "reason: Cleanup files are review-only. A human runs them after reading.",
      "",
    ].join("\n"),
  )
  process.stderr.write("QA refused to execute cleanup. Review qa/cleanup/ and run it yourself.\n")
  process.exit(2)
}

const date = process.argv[3] ?? new Date().toISOString().slice(0, 10)
const target = process.argv[4] ?? "unspecified target"
const body = process.argv[5] ?? "_No leftover test rows._"
const dir = join(root, "qa/cleanup")
mkdirSync(dir, { recursive: true })
const path = join(dir, `cleanup-${date}.md`)
writeFileSync(
  path,
  [
    `# cleanup-${date}`,
    "",
    `Target: ${target}`,
    "Status: review only. The overnight agent must not execute these steps.",
    "",
    "Human decision per item: [ ] run  [ ] skip  [ ] escalate",
    "",
    body,
    "",
  ].join("\n"),
)
process.stdout.write(`Wrote ${path}\n`)
