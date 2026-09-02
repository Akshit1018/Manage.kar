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

function runNodeTests(files) {
  const result = spawnSync("pnpm", ["test", ...files], {
    cwd: root,
    encoding: "utf8",
  })
  if (result.status !== 0) {
    fail(`pnpm test ${files.join(" ")} exited ${result.status}`)
    if (result.stdout) {
      process.stderr.write(result.stdout)
    }
    if (result.stderr) {
      process.stderr.write(result.stderr)
    }
  }
}

function runPython(file) {
  const result = spawnSync("python3", [file], {
    cwd: join(root, "packages/hermes-managekar-plugin"),
    encoding: "utf8",
  })
  if (result.status !== 0) {
    fail(`python3 ${file} exited ${result.status}`)
    if (result.stderr) {
      process.stderr.write(result.stderr)
    }
    if (result.stdout) {
      process.stderr.write(result.stdout)
    }
  }
}

function verifyGeometry() {
  requireIncludes("lib/ui/orb-gesture.ts", [
    "export const LONG_PRESS_MS = 500",
    "export function defaultOrbPosition",
    "snapOrbToEdge",
    "orb.x + size + inset",
    "orb.x - barWidth - inset",
    "export function rectsOverlap",
  ])
  requireIncludes("lib/ui/orb-gesture.test.ts", [
    "parks the ball on the snapped right edge",
    "never covers the ball disk with the tray",
    "toBe(500)",
  ])
  const gesture = read("lib/ui/orb-gesture.ts")
  if (gesture.includes("width - 100")) {
    fail("default orb still parks at width-100")
  }
  if (gesture.includes("orb.x + 60") || gesture.includes("orb.x - 60")) {
    fail("icon bar still uses the overlapping ±60 offset")
  }
  runNodeTests(["lib/ui/orb-gesture.test.ts"])
}

function verifyGesture() {
  requireIncludes("lib/ui/orb-gesture.ts", [
    "export function orbHoverOpensTray",
    "export function orbLostPointerPolicy",
    'return "handoff"',
  ])
  requireIncludes("components/floating-toggle.tsx", [
    '"(hover: hover)"',
    '"(pointer: fine)"',
    "orbLostPointerPolicy",
    "attachOrbPointerFallback",
    "finishGestureRef.current(false)",
    "rounded-lg",
  ])
  const toggle = read("components/floating-toggle.tsx")
  if (toggle.includes("finishGesture(true)") && toggle.includes("onLostPointerCapture")) {
    const lost = toggle.slice(toggle.indexOf("onLostPointerCapture"))
    if (lost.includes("finishGesture(true)") && !lost.includes('!== "handoff"')) {
      fail("lost pointer capture still cancels the tap")
    }
  }
  if (toggle.includes("onMouseEnter={() => {\n          if (!recorderOpen) {\n            revealIconBar()")) {
    fail("mouseenter still opens the tray without a hover/fine pointer check")
  }
  runNodeTests(["lib/ui/orb-gesture.test.ts"])
}

function verifyUi() {
  requireIncludes("components/pairing-sheet.tsx", [
    "Not a real QR yet",
    "Simulate pairing (dev)",
  ])
  requireIncludes("apps/mobile/lib/src/screens/shell_screen.dart", [
    "visible: orbVisibleOnTab(index)",
  ])
  requireIncludes("apps/mobile/lib/src/widgets/assist_orb.dart", [
    "snapOrbToEdge",
    "kOrbPositionKey",
    "onPanUpdate",
  ])
  requireIncludes("apps/mobile/lib/src/widgets/assist_orb_geometry.dart", [
    "bool orbVisibleOnTab(int index) => index != 3",
    "kOrbLongPressMs = 500",
    "kHomeOrbSize = 120.0",
    "shouldStageHomeBall",
  ])
  requireIncludes("apps/mobile/test/widget_test.dart", [
    "hidden orb is gone on Chats and a drag parks on the left edge",
  ])
  const flutter = spawnSync("flutter", ["test", "test/assist_orb_geometry_test.dart", "test/widget_test.dart"], {
    cwd: join(root, "apps/mobile"),
    encoding: "utf8",
  })
  if (flutter.error && flutter.error.code === "ENOENT") {
    process.stderr.write("flutter not installed; geometry and widget sources were still checked\n")
  } else if (flutter.status !== 0) {
    fail(`flutter test exited ${flutter.status}`)
    if (flutter.stdout) {
      process.stderr.write(flutter.stdout)
    }
    if (flutter.stderr) {
      process.stderr.write(flutter.stderr)
    }
  }
}

function verifyServe() {
  requireIncludes("packages/hermes-managekar-plugin/cli.py", [
    "--serve",
    "serve_forever",
    "pair_base",
  ])
  requireIncludes("packages/hermes-managekar-plugin/serve.py", [
    "ThreadingHTTPServer",
    "endpoint=dashboard",
    '"already claimed"',
  ])
  requireIncludes("packages/hermes-managekar-plugin/pairing.py", [
    "pair_base: str | None = None",
    "claim_base = pair_base or base",
  ])
  requireIncludes("docs/DECISIONS.md", ["hermes managekar --serve", ":9120"])
  runPython("pairing_test.py")
  runPython("serve_test.py")
}

const markers = {
  geometry: "ball geometry verification passed",
  gesture: "ball gesture verification passed",
  ui: "ball ui verification passed",
  serve: "ball serve verification passed",
}

if (!mode || !markers[mode]) {
  process.stderr.write(`usage: verify-ball-bugs.mjs <${Object.keys(markers).join("|")}>\n`)
  process.exit(2)
}

switch (mode) {
  case "geometry":
    verifyGeometry()
    break
  case "gesture":
    verifyGesture()
    break
  case "ui":
    verifyUi()
    break
  case "serve":
    verifyServe()
    break
  default:
    fail(`unhandled mode ${mode}`)
}

if (failures.length > 0) {
  for (const item of failures) {
    process.stderr.write(`${item}\n`)
  }
  process.exit(1)
}

process.stdout.write(`${markers[mode]}\n`)
