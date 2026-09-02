#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const mode = process.argv[2] ?? "all"
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

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: "utf8" })
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

function verifyLogic() {
  requireIncludes("lib/ui/home-feed.ts", [
    "homeAgents",
    "agentDaySumUp",
    "agentDayBriefing",
    "pickHomeSpotlight",
    "homeJumpTiles",
    "showHomeListPreview",
    "chatHasHomePreview",
    'label: "Task"',
    'label: "Notes"',
    'label: "Chat"',
    'label: "Habit"',
  ])
  requireAbsent("lib/ui/home-feed.ts", ["89%", "weekly plan"])
  run("./node_modules/.bin/vitest", ["run", "lib/ui/home-feed.test.ts", "lib/ui/home-chrome.test.ts"])
}

function verifyUi() {
  const dashboard = requireIncludes("components/workspace/dashboard.tsx", [
    "<HomeFeed",
    "homeGreeting",
    "agentDayBriefing",
    "openChat",
    "LayoutGrid",
    'aria-label="More"',
    "showWorkspaceExport",
    "showComposerDock",
    "showHeaderWordmark",
    "workspaceHeaderMode",
    "data-mk-header",
    "mk-home-briefing-actions",
    "<PairingSheet",
  ])
  requireAbsent("components/workspace/dashboard.tsx", [
    "<TodaySection",
    '"Your workspace"',
    "showToolLauncher",
    "aria-label=\"Goals\"",
    'currentView === "overview" ? greeting',
    "mk-workspace-heading",
    "showGlobalCreateRow",
  ])
  if (dashboard.includes("pending tasks") && dashboard.includes("mk-featured-numeral")) {
    fail("dashboard still shows overview count tiles")
  }
  requireIncludes("components/workspace/home-feed.tsx", [
    "mk-home-ball-stage",
    "mk-home-circle",
    "mk-home-jump",
    "mk-home-fade",
    "View all",
    "homeJumpTiles",
    "showHomeListPreview",
    "chatHasHomePreview",
  ])
  requireAbsent("components/workspace/home-feed.tsx", [
    "No other chats yet.",
    "No open tasks.",
    "No notes yet.",
    "No habits yet.",
    "mk-home-heading",
  ])
  requireIncludes("lib/ui/home-chrome.ts", [
    "overviewUsesHomeFeed",
    "showWorkspaceExport",
    "showComposerDock",
    "showViewSupport",
    "workspaceSearchPlaceholder",
    "showHeaderWordmark",
    "workspaceHeaderMode",
  ])
  requireIncludes("app/globals.css", [
    ".mk-home-ball-stage",
    ".mk-ball",
    ".mk-home-circle",
    ".mk-home-jump",
    ".mk-home-fade",
    ".mk-home-kicker",
    ".mk-home-briefing",
    ".mk-home-briefing-actions",
    ".mk-home-spotlight.mk-featured-surface",
    'html[data-skin="white"] .mk-home-briefing',
    'html[data-skin="black"] .mk-home-briefing',
    '.mk-workspace-header[data-mk-header="module"]',
  ])
  requireIncludes("apps/mobile/lib/src/ui/home_feed.dart", [
    "homeGreeting",
    "homeAgents",
    "agentDayBriefing",
    "showHomeListPreview",
    "chatHasHomePreview",
  ])
  requireIncludes("apps/mobile/lib/src/screens/shell_screen.dart", [
    "_JumpTile",
    "grid_view_outlined",
    "Add a task",
    "Pair a machine",
  ])
  requireAbsent("apps/mobile/lib/src/screens/shell_screen.dart", [
    "No other chats yet.",
    "No open tasks.",
    "No notes yet.",
    "No habits yet.",
    'Text("Chat"',
    'Text("Task"',
    "AppBar(title:",
  ])
  requireAbsent("apps/mobile/lib/src/screens/chats_screen.dart", ['title: const Text("Chats")'])
}

function verifyTheme() {
  requireIncludes("lib/domain/types.ts", ['"hermes" | "classic" | "white" | "black"'])
  requireIncludes("lib/theme/apply-theme.ts", ['case "white":', 'case "black":'])
  requireIncludes("app/globals.css", [
    'html[data-skin="white"]',
    'html[data-skin="black"]',
    "--mk-canvas: #ffffff",
    "--mk-canvas: #000000",
  ])
  requireIncludes("components/settings-modal.tsx", [
    '<SelectItem value="white">White</SelectItem>',
    '<SelectItem value="black">Black</SelectItem>',
  ])
  requireIncludes("apps/mobile/lib/src/theme/app_theme.dart", ['case "white":', 'case "black":'])
  requireIncludes("apps/mobile/lib/src/screens/settings_screen.dart", ['"white", "black"'])
  requireIncludes("apps/api/src/app.ts", ['z.enum(["hermes", "classic", "white", "black"])'])
  requireIncludes("docs/DECISIONS.md", ["D014", "D015", "D016", "D017", "D018", "D019", "D020"])
  requireIncludes("lib/ui/orb-gesture.ts", ["shouldStageHomeBall", "HOME_ORB_SIZE", "HOME_BALL_STAGE_MIN_PX"])
  requireIncludes("components/floating-toggle.tsx", ['data-mk-ball=""', "mk-ball-core"])
  requireAbsent("components/floating-toggle.tsx", ["<Plus"])
  run("./node_modules/.bin/vitest", ["run", "lib/theme/apply-theme.test.ts"])
}

if (mode === "logic" || mode === "all") {
  verifyLogic()
}
if (mode === "ui" || mode === "all") {
  verifyUi()
}
if (mode === "theme" || mode === "all") {
  verifyTheme()
}

if (failures.length > 0) {
  for (const item of failures) {
    process.stderr.write(`${item}\n`)
  }
  process.exit(1)
}

const labels = {
  logic: "home feed logic verification passed",
  ui: "home feed ui verification passed",
  theme: "home feed theme verification passed",
  all: "home feed verification passed",
}
process.stdout.write(`${labels[mode] ?? labels.all}\n`)
