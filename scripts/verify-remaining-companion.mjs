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

function flutterBin() {
  if (process.env.FLUTTER_ROOT) {
    return join(process.env.FLUTTER_ROOT, "bin", "flutter")
  }
  if (existsSync("/home/ubuntu/flutter/bin/flutter")) {
    return "/home/ubuntu/flutter/bin/flutter"
  }
  return "flutter"
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd: cwd ?? root,
    encoding: "utf8",
    env: {
      ...process.env,
      PATH: `/home/ubuntu/flutter/bin:${process.env.PATH ?? ""}`,
    },
  })
  if (result.status !== 0) {
    fail(`${command} ${args.join(" ")} exited ${result.status}`)
    if (result.stdout) {
      process.stderr.write(result.stdout)
    }
    if (result.stderr) {
      process.stderr.write(result.stderr)
    }
  }
  return result
}

function verifyFlutterPresence() {
  const chats = requireIncludes("apps/mobile/lib/src/screens/chats_screen.dart", [
    'return "reachable"',
    'return "asleep"',
    'return "unreachable"',
    'return "not paired"',
  ])
  if (chats.includes('return "online"')) {
    fail("chats_screen.dart still returns online")
  }
  const dialer = requireIncludes("apps/mobile/lib/src/state/dialer.dart", [
    "reachable",
    'source == "demo"',
  ])
  if (dialer.includes("back online")) {
    fail("dialer.dart still says back online")
  }
  requireIncludes("apps/mobile/test/dialer_test.dart", [
    'presenceLabel("active", "demo")',
    '"not paired"',
    '"reachable"',
    '"asleep"',
    '"unreachable"',
  ])
  requireAbsent("apps/mobile/test/dialer_test.dart", ['contains("online")'])
  run(flutterBin(), ["test", "test/dialer_test.dart", "test/widget_test.dart"], join(root, "apps/mobile"))
}

function verifyProtocol() {
  requireIncludes("lib/hermes/protocol.ts", [
    "prompt.submit",
    "session.interrupt",
    "approval.respond",
    "/api/ws",
    "9119",
    "message.delta",
    "tool.start",
    "approval.request",
  ])
  requireIncludes("lib/hermes/client.ts", ["jsonrpc", "connect", "disconnect", "request"])
  requireIncludes("lib/hermes/thread.ts", ["message.delta", "tool.start", "tool.complete", "streaming"])
  requireIncludes("lib/hermes/send.ts", ["canFlushOutbox", "source === \"demo\""])
  requireIncludes("lib/hermes/protocol.test.ts", ["ws://127.0.0.1:9119/api/ws"])
  requireIncludes("lib/hermes/send.test.ts", ["never marks a demo message sent"])
  requireIncludes("lib/dialer/dialer.ts", ["canFlushOutbox"])
  run("pnpm", [
    "test",
    "lib/hermes/protocol.test.ts",
    "lib/hermes/client.test.ts",
    "lib/hermes/thread.test.ts",
    "lib/hermes/send.test.ts",
    "lib/dialer/dialer.test.ts",
  ])
}

function verifyPairing() {
  requireIncludes("lib/pairing/handshake.ts", [
    "helper_not_running",
    "code_expired",
    "unreachable",
    "waiting",
  ])
  requireIncludes("lib/pairing/handshake.test.ts", [
    "helper_not_running",
    "code_expired",
    "does not pair from showing a QR",
  ])
  requireIncludes("lib/pairing/types.ts", ["managekar.pairing.v1", "PairingFailure"])
  requireIncludes("components/pairing-sheet.tsx", [
    "This phone waits for a Hermes helper",
    "Simulate pairing (dev)",
    "showSimulatedPairingControl",
    "Not a real QR yet",
  ])
  requireAbsent("components/pairing-sheet.tsx", ["QR was scanned"])
  requireIncludes("lib/pairing/developer.ts", ["#dev", "dev=1"])
  run("pnpm", [
    "test",
    "lib/pairing/handshake.test.ts",
    "lib/pairing/developer.test.ts",
    "lib/pairing/pairing.test.ts",
  ])
}

function verifyApproval() {
  requireIncludes("lib/hermes/approval.ts", [
    "pendingApprovalFromEvent",
    "approvalRespondParams",
    "showApprovalChoices",
  ])
  requireIncludes("lib/hermes/approval.test.ts", [
    "pendingApprovalFromEvent",
    "does not invent a pending command",
    "does not offer YOLO on the phone",
  ])
  requireIncludes("components/approval-card.tsx", ["approvalChoiceLabel", "Once"])
  const card = read("components/approval-card.tsx")
  if (card.includes('choice === "yolo"') || card.includes(">YOLO<") || card.includes('"Yolo"')) {
    fail("approval-card offers YOLO on the phone")
  }
  requireIncludes("components/workspace/chats-view.tsx", [
    "pendingApprovalFromEvent",
    "ApprovalCard",
    "onChoose",
  ])
  requireAbsent("components/workspace/chats-view.tsx", ["resolvePendingApproval([])"])
  run("pnpm", ["test", "lib/hermes/approval.test.ts"])
}

function verifyOverlay() {
  requireIncludes("apps/mobile/lib/src/overlay/overlay_capability.dart", [
    "OverlayStatus",
    "notGranted",
    "unsupported",
    "SYSTEM_ALERT_WINDOW",
  ])
  requireIncludes("apps/mobile/test/overlay_capability_test.dart", [
    "does not claim SYSTEM_ALERT_WINDOW is working",
    "notGranted",
  ])
  requireIncludes("apps/mobile/android/app/src/main/AndroidManifest.xml", [
    "android.permission.SYSTEM_ALERT_WINDOW",
  ])
  requireIncludes(
    "apps/mobile/android/app/src/main/kotlin/com/managekar/managekar/OverlayCapability.kt",
    ["Settings.canDrawOverlays", "false"],
  )
  const overlay = read("apps/mobile/lib/src/overlay/overlay_capability.dart")
  if (/return OverlayStatus\.granted/.test(overlay) && !overlay.includes("canDrawOverlays")) {
    fail("Dart overlay claims granted without an OS check")
  }
  run(flutterBin(), ["test", "test/overlay_capability_test.dart"], join(root, "apps/mobile"))
}

const markers = {
  "flutter-presence": "flutter presence verification passed",
  protocol: "protocol verification passed",
  pairing: "pairing handshake verification passed",
  approval: "approval verification passed",
  overlay: "overlay verification passed",
}

if (!mode || !markers[mode]) {
  process.stderr.write(`usage: verify-remaining-companion.mjs <${Object.keys(markers).join("|")}>\n`)
  process.exit(2)
}

switch (mode) {
  case "flutter-presence":
    verifyFlutterPresence()
    break
  case "protocol":
    verifyProtocol()
    break
  case "pairing":
    verifyPairing()
    break
  case "approval":
    verifyApproval()
    break
  case "overlay":
    verifyOverlay()
    break
  default: {
    const exhaustive = mode
    fail(`unhandled mode ${exhaustive}`)
  }
}

if (failures.length > 0) {
  for (const item of failures) {
    process.stderr.write(`${item}\n`)
  }
  process.exit(1)
}

process.stdout.write(`${markers[mode]}\n`)
