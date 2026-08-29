#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
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

const skill = read(".cursor/skills/unlazy/SKILL.md")
const source = read(".cursor/skills/unlazy/SOURCE.md")
const audit = read("docs/superpowers/plans/2026-08-29-inflight-task-audit.md")
const snapshotRaw = read("docs/superpowers/evidence/2026-08-29-pr-snapshot.json")

if (skill && !/^---[\s\S]*name:\s*unlazy/m.test(skill)) {
  fail("SKILL.md is not the unlazy skill")
}
if (source && !source.includes("https://github.com/Leonxlnx/unlazy")) {
  fail("SOURCE.md does not name the canonical GitHub URL")
}
if (source && !source.includes("da0b00a3a6b706b471797cd4ef579ae1001ff6d7")) {
  fail("SOURCE.md does not pin upstream commit da0b00a")
}

let snapshot
try {
  snapshot = JSON.parse(snapshotRaw)
} catch {
  snapshot = null
  fail("PR snapshot is not valid JSON")
}

const requiredHeadings = [
  "## Laziest gaps",
  "## Skill install",
  "## Stacked pull requests",
  "## Docs ledger",
  "## Product leftovers",
  "## Live servers and previews",
]

for (const heading of requiredHeadings) {
  if (!audit.includes(heading)) {
    fail(`audit missing heading ${heading}`)
  }
}

if (!audit.includes("LAZIEST GAPS FIRST")) {
  fail("audit does not mark lazy gaps as first")
}

const leftoverNeedles = [
  "Hermes socket",
  "real pairing",
  "Flutter parity",
  "Android overlay",
  "Plugins tab",
  "7-column kanban",
]
for (const needle of leftoverNeedles) {
  if (!audit.includes(needle)) {
    fail(`audit does not classify leftover: ${needle}`)
  }
}

if (snapshot?.openPullRequests) {
  const expectedCount = snapshot.openPullRequests.length
  const counted = Number((audit.match(/OPEN_PR_COUNT=(\d+)/) || [])[1] || 0)
  if (counted !== expectedCount) {
    fail(`audit OPEN_PR_COUNT=${counted} does not match snapshot ${expectedCount}`)
  }
  for (const pr of snapshot.openPullRequests) {
    if (!audit.includes(`PR #${pr.number}`)) {
      fail(`audit missing PR #${pr.number}`)
    }
  }
  if (snapshot.mainSubject !== "Initial commit from local archive") {
    fail("snapshot main subject drifted; re-measure before claiming nothing merged")
  }
}

const previewNeedles = [
  "127.0.0.1:3005",
  "127.0.0.1:3007",
  "trycloudflare.com",
  "NOT on latest branch",
]
for (const needle of previewNeedles) {
  if (!audit.includes(needle)) {
    fail(`audit missing preview evidence: ${needle}`)
  }
}

if (audit.includes("Looks good") || audit.includes("should be fine")) {
  fail("audit contains unverified satisfaction language")
}

if (failures.length > 0) {
  for (const message of failures) {
    console.error(`FAIL ${message}`)
  }
  process.exit(1)
}

console.log("inflight audit verification passed")
