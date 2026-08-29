#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const mode = process.argv[2]
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

function run(args) {
  const result = spawnSync("pnpm", ["test", ...args], {
    cwd: root,
    encoding: "utf8",
  })
  if (result.status !== 0) {
    fail(`pnpm test ${args.join(" ")} exited ${result.status}`)
    if (result.stdout) {
      process.stderr.write(result.stdout)
    }
    if (result.stderr) {
      process.stderr.write(result.stderr)
    }
  }
}

function verifyStatus() {
  requireIncludes("lib/hermes/status.ts", ["gateway_running", "auth_required", "parseHermesDashboardStatus"])
  requireIncludes("lib/hermes/status.test.ts", ["official public /api/status", "rejects non-Hermes JSON"])
  requireIncludes("lib/hermes/endpoint.ts", ["/api/status", "/api/ws", "token"])
  run(["lib/hermes/status.test.ts", "lib/hermes/endpoint.test.ts"])
}

function verifyProtocol() {
  requireIncludes("lib/hermes/protocol.ts", [
    "gateway.ping",
    "session.create",
    "prompt.submit",
    "thinking.delta",
    "clarify.request",
  ])
  requireIncludes("lib/hermes/protocol.test.ts", ["idFirst", "token=dash"])
  requireIncludes("lib/hermes/client.ts", ["jsonrpc", "connect"])
  run(["lib/hermes/protocol.test.ts", "lib/hermes/client.test.ts", "lib/hermes/thread.test.ts"])
}

function verifyAttach() {
  requireIncludes("lib/hermes/attach.ts", ["session.create", "needs_token", "mode"])
  requireIncludes("lib/hermes/attach.test.ts", [
    "does not pair from a successful /api/status poll",
    "session.create",
    "needs_token",
  ])
  requireIncludes("lib/pairing/handshake.ts", ["needs_token", "dashboardVersion"])
  requireIncludes("lib/pairing/types.ts", ["hermesSessionId", "needs_token"])
  run([
    "lib/hermes/attach.test.ts",
    "lib/hermes/session-map.test.ts",
    "lib/pairing/handshake.test.ts",
    "lib/pairing/pairing.test.ts",
  ])
}

function verifySend() {
  requireIncludes("lib/hermes/send.ts", ["hermesSessionId"])
  requireIncludes("lib/hermes/send.test.ts", ["official Hermes session_id", "never marks a demo message sent"])
  requireIncludes("components/chat-composer.tsx", ["hermesSessionId"])
  run(["lib/hermes/send.test.ts"])
}

function verifyUi() {
  requireIncludes("components/pairing-sheet.tsx", [
    "helper-url",
    "helper-token",
    "Connect",
    "attachToHermesDashboard",
    "This phone waits for a Hermes helper",
    "Simulate pairing (dev)",
    "Not a real QR yet",
  ])
  requireIncludes("components/workspace/chats-view.tsx", ["connectPairedMachine", "outboundHermesSessionId"])
  requireIncludes("docs/DECISIONS.md", ["GET /api/status", "session.create"])
}

const markers = {
  status: "hermes status verification passed",
  protocol: "hermes protocol verification passed",
  attach: "hermes attach verification passed",
  send: "hermes send verification passed",
  ui: "hermes ui verification passed",
}

if (!mode || !markers[mode]) {
  process.stderr.write(`usage: verify-mit-hermes-speak.mjs <${Object.keys(markers).join("|")}>\n`)
  process.exit(2)
}

switch (mode) {
  case "status":
    verifyStatus()
    break
  case "protocol":
    verifyProtocol()
    break
  case "attach":
    verifyAttach()
    break
  case "send":
    verifySend()
    break
  case "ui":
    verifyUi()
    break
  default: {
    fail(`unhandled mode ${mode}`)
  }
}

if (failures.length > 0) {
  for (const item of failures) {
    process.stderr.write(`${item}\n`)
  }
  process.exit(1)
}

process.stdout.write(`${markers[mode]}\n`)
