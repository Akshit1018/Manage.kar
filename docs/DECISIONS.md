# Manage.kar — Product Decision Record

Locked decisions from the founder grilling sessions (August 2026). Every feature PR
should be consistent with this document; if a decision changes, update it here first.

## Engineering locks still in force

These predate the Hermes companion direction and are not reversed by it.

### D001 — This product is a personal productivity workspace

- **Why:** Forcing a recruiting architecture would be a rewrite of a different product.
- **Reversal:** Owner writes a new vision and we start a separate app or a new major version.

### D002 — One workspace document is the source of truth

- **Why:** Data loss is P0. A single versioned JSON document is reversible and testable.
- **Satellite:** Chat outbox lives in `managekar.dialer.v1` until pairing lands; wipe and backup must include it.
- **Reversal:** Move the same schema to IndexedDB when voice blobs or size require it.

### D003 — First run is empty, not fake seed data

- **Why:** Trust. Empty states tell the user what to do next.
- **Chats exception:** Demo Hermes machines are shown in memory so the dialer is usable before pairing. They are labeled Demo, their status word is **not paired** (never online/reachable), never marked sent, and are not written on first load.
- **Reversal:** Add an explicit “Load sample workspace” action if testers need it.

### D004 — No CRDT / no backend in this slice

- **Why:** Sync without a product need creates cost and conflict UI we cannot staff.
- **Reversal:** When a second device is a real requirement, add an adapter behind the workspace interface.

### D005 — Clipboard monitor off by default

- **Why:** Privacy is a product feature.
- **Reversal:** User enables it in Settings → Privacy.

## Prime directive

**Build only what Hermes doesn't already have.** Manage.kar is a companion client for
[NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent). We consume:

- Chat/sessions/streaming: JSON-RPC WebSocket (`/api/ws`, port 9119) via `@hermes/shared`.
- Tasks: the Hermes **kanban** board (statuses
  `triage → todo → scheduled → ready → running → blocked → review → done`,
  plus `archived` as a sink). Boards are project containers. We render
  those statuses; we do not clone the dashboard SPA.
- Reminders/recurring work: Hermes **cron** (natural-language schedules, multi-platform delivery).
- Transcription (fast tier): `POST /api/audio/transcribe` on the paired machine.
- Agent identity: Hermes **profiles**; per-bot canonical chat follows the desktop "Bot Chat" title contract.
- Distribution: the Manage.kar plugin ships as its **own repo** (`hermes plugins install`),
  registering a `managekar` gateway platform adapter + dashboard API under `/api/plugins/managekar/`.

## Theme

- Default skin = **Hermes**: light mode is Nous Blue (`#E8F2FD` canvas, `#0053FD` accent),
  dark mode is Hermes Teal (`#041c1c` canvas, `#ffe6cb` cream, blue lifted to `#4a86ff`).
  Surfaces derive via `color-mix` ratios (4/6/8/10/15%), matching the Hermes dashboard system.
- Live marketing site ([hermes-agent.nousresearch.com](https://hermes-agent.nousresearch.com/)) brand
  quartet is recorded as `--mk-site-*`: electric blue `#0000f2`, paper `#ffffff`,
  foreground `#f5f5f5`, accent `#edff45`. Those tokens mark the wordmark, hydrate
  preloader, and approval rail only — they are **not** a third product skin and do
  not replace dashboard canvases.
- Type matches the MIT dashboard default: 15px / 1.55 / 0.5rem radius, Inter +
  JetBrains Mono (open fonts from the dashboard catalog). Proprietary Nous
  marketing faces (Sigurd, Rules) are not loaded.
- Original look preserved as the **Classic** skin (Settings → Appearance → Skin).

## The assistive ball (Android native) and the in-app orb

- The ball is a **system-wide overlay** (like AssistiveTouch / Xiaomi's ball): floats over all
  apps, semi-transparent idle, solid when active. Android-only (`SYSTEM_ALERT_WINDOW` +
  `specialUse` foreground service + separate `microphone` service via trampoline).
  iOS gets Action Button / Control Center / widgets / Live Activities instead.
- **Tap → radial menu: Record / Task / Note / Open chats.** Long-press → record immediately
  (WhatsApp-style: hold, lock after threshold, tap to stop).
- Transcript popup appears **next to the ball over the current app** (5-second auto-file to
  Notes, tap Task/Habit to convert). A push notification always fires as fallback.
- The permanent "Manage.kar is running" notification is an accepted cost.
- The in-app orb mirrors the same icon set for one muscle memory.

## Notes

- **Flat stream + labels + pins.** Labels carry **user-chosen colors** and can act as
  folder-like groups (directory-style views) without becoming exclusive folders.
- Diarized notes render as **chat-style bubbles per speaker**; renaming "Speaker 1" to a
  saved @person retroactively relabels the whole note and links it for later queries.
- **Ask my notes ships in phase 1**: a floating pill on the Notes page answers questions
  across all notes using the paired Hermes agent, with guardrails scoping context to notes
  only. Requires the pairing + a dedicated backend module.

## Tasks

- Hermes kanban is the backend; boards = kanban boards ("@marketing-board" tags a board).
- Every task: human **owner** + optional **worker** (agent or teammate) — Linear model.
- **Agent completion behavior is per-task configurable** at tagging time: auto-complete
  ("completed by your agent") or hold in **review**; a Hermes cron follow-up (~10–15 min)
  verifies outcomes.
- Task detail = control panel: single activity timeline mixing human comments, status
  changes, and agent progress events (expandable into the underlying session).

## Habits

- Reminders: **both** native exact alarms and VPS push (PWA). `SCHEDULE_EXACT_ALARM`
  with graceful inexact fallback; never `USE_EXACT_ALARM`.
- **Voice habit logging**: the transcript popup offers a Habit destination when the text
  matches a habit name (local string match).
- Forgiving streaks: one-miss grace + rolling 7/30-day consistency percentage.

## Chats

- **Fourth tab.** Full Hermes power: streaming replies, approvals as tappable cards,
  steering, stop, attachments, model switching. Filterable by machine/configuration.
- Canonical bot identity follows the desktop **Bot Chat** title contract (exact title
  `Bot Chat`). Other sessions stay machine names. Demo rows stay labeled Demo.
  The leftover demo bot is titled `Bot Chat`, not a marketplace name like
  “Research bot”. Unnamed Home copy is **Today**, not “Your workspace”.
- Skills on a paired machine are **read-only**. No Plugins tab, no install store.
- The chat dialer (bottom composer + session wheel, "New chat" first, presence dots
  green/yellow/red, offline outbox) is the quick-fire surface; the tab is the full surface.
- The app maintains its **own self-evolving Hermes session pinned at top** of Home.

## Pairing & connectivity

- Pair with **as many machines as the user wants** (VPS 1..n, local 1..n). Each session
  remembers its machine; presence dots reflect per-machine liveness.
- Pairing = QR code **and shareable magic link** (tap → authenticate → paired), Claude
  Code style. Long-lived token in secure storage. No third-party middleman.
- Relay (reaching a sleeping local machine via the VPS): explored early alongside the
  Hermes experimental relay contract — not deferred to a distant phase.
- Offline sends queue in the per-chat outbox and flush when the machine returns.

## People & multi-user

- Agents = Hermes profiles. Humans = **Manage.kar accounts** on the self-hosted VPS sync
  service (phase 2). 5–10 teammates can tag each other, see assigned tasks, update status.
- Task schema (owner/worker/labels/timeline) is designed multi-user-ready from day one.

## Finance

- **Global product**, not India-only. Capture via **notification reading** (Android
  Notification Listener), not `READ_SMS`. Gmail ingestion is phase 2 — decision pending
  between direct Gmail API (needs ~$540/yr CASA audit) and a free forwarding ingest address.
- Full scope: monthly spend, AI category labeling (bills, food, …), budgets, alerts,
  recurring-subscription detection. **Financial data stays on-device, always.**

## Voice pipeline

- **Two tiers:** quick captures → Hermes `POST /api/audio/transcribe` (instant); long or
  multi-speaker recordings → self-hosted diarization stack (WhisperX + pyannote) on the
  user's VPS; the note upgrades in place when deep processing lands. The user never
  chooses manually.
- Hinglish renders **romanized (Latin script)** by default.
- Audio persists locally the instant recording stops; upload is strictly background.

## App language

- **Full i18n toggle**: dropdown in Settings; Hindi and English native, extensible to
  French, German, Polish, etc. Transliterates/translates the whole UI live.

## Home

- **Today feed**: today's tasks, active agent sessions with live status, habit checkmark
  row, recent notes — in that order. Stats live in Analytics, not on Home.

## Workspace sections slice (August 2026)

New decisions from the notes/tasks/pairing sections. These extend, and do not reverse,
D001–D005.

### D006 — Label colors come from a fixed 8-color palette with stable defaults

- Labels get an optional `color`; unassigned labels derive a stable color from a name
  hash so old data is colored without a migration. Users recolor by tapping the color
  dot next to a label filter chip (cycles the palette — one tap, no popover).
- **Reversal:** Introduce a full color picker if the palette proves too small.

### D007 — Kanban status derives done-ness from `completed`

- Tasks carry `status?: todo | doing | done`, but `completed` stays the source of truth:
  a completed task is always `done`, and an incomplete one is only `doing` when marked.
  Old data (no status field) maps completed→done, otherwise→todo, with no migration.
  Owner (default "me") and worker are free-text metadata for the future Hermes kanban;
  no agent is assigned anything yet and the UI says so.
- **Reversal:** When the Hermes kanban lands, map these three statuses into its
  seven-state pipeline and let the backend own transitions.

### D008 — Follow-ups are local nudges, not push notifications

- A task may follow up `daily` or `weekly` until done. Due follow-ups surface on the
  Home tab while the app is open; "Checked in" stamps `lastNudgedAt`. Copy must never
  imply delivery or scheduling outside the open app.
- **Reversal:** Route through Hermes cron once pairing is real.

### D009 — Pairing is an honest local scaffold until Hermes connects

- Machines live in `managekar.pairing.v1` (backed up and wiped with everything else).
  A host-minted `managekar.pair.v1` ticket (QR, magic link, or dashboard tab) is the
  real pair. The local MK- code is still labeled **Not a real QR yet**. The client
  handshake is `waiting` with expiry, then named failures
  (`helper_not_running`, `code_expired`, `unreachable`, `needs_token`, `claim_failed`).
  Showing a placeholder QR does not complete a pair. Claiming a host ticket returns
  `{ endpoint, token }` once; then the MIT dashboard contract runs: `GET /api/status`,
  `/api/ws?token=`, `session.create`. Status alone never pairs. Plugin routes live at
  `/api/plugins/managekar/`. "Simulate pairing (dev)" stays behind `#dev` / `?dev=1`
  only. Attached or simulated sessions use `source: "paired"`, `presence: "active"` —
  the only sessions whose sends may read "Sent". Hermes DM pairing
  (`hermes pairing approve <platform> <code>`) is not machine pairing.
- **Reversal:** If Hermes ships an official companion QR, replace `managekar.pair.v1`
  with that ticket shape and keep the same storage.

### D010 — Home is Today; chrome is per-tab

- Overview main order is Today, then follow-ups, then counts. The seven-tile tool
  launcher is hidden below 640px. Chats has no global Add-task row and no permanent
  search field. Paired presence words are reachable / asleep / unreachable.
- **Reversal:** Restore a counts-first Home only if Today is empty *and* testers need
  the dashboard tiles as the first lesson.

### D011 — Site brand marks sit on dashboard surfaces

- `--mk-site-*` (live site `#0000f2` / `#f5f5f5` / `#edff45` / `#ffffff`) decorate
  wordmark, preloader, and approval chrome. App canvases stay Nous Blue / Hermes Teal.
  Desktop left nav appears from 1024px and lists the same five destinations as the
  phone pill. The hydrate preloader never blocks the workspace.
- **Reversal:** Only if Nous publishes a single official companion token sheet that
  replaces both the marketing site and the dashboard palettes.

### D012 — Phone claim uses a dedicated pair listener

- Official Hermes auth-gates `/api/plugins/*` with a dashboard session token. A
  phone cannot send that header, so `hermes managekar --serve` binds a small
  stdlib listener (default `:9120`) for mint / claim / QR only. Claim still
  returns the dashboard `{ endpoint, token }` so the companion attaches to
  `/api/ws` on `:9119`. `--pair-base` / `MANAGEKAR_PUBLIC_BASE` must be a
  LAN, Tailscale, or tunnel URL for a real phone. Loopback is not a public host.
  The in-app ball parks on an edge, keeps its tray off the disk, and hides on
  the Chats tab.
- **Reversal:** If Hermes ships an unauthenticated companion claim route on the
  dashboard, retire `--serve` and keep the same ticket shape.

### D013 — Official loopback attach is the host contract

- Proven on this cloud box against NousResearch/hermes-agent **0.20.6**
  (`4209d37`): `uv pip install -e ".[web]"`, then `hermes serve` on
  `127.0.0.1:9119` with `HERMES_DASHBOARD_SESSION_TOKEN`. Extra name is
  `[web]`, not `[dashboard]`. No LLM key is required for `session.create`
  (lazy session, `model: dummy`).
- `GET /api/status` is public. `POST /api/plugins/managekar/pair` is **401**
  without the session header, even on loopback. Official claim without
  `MANAGEKAR_DASHBOARD_TOKEN` returns an `mk_` stub; `/api/ws?token=` then
  **403**s. `--serve` claim with `--token` returns `{ endpoint: :9119, token }`
  and `/api/ws` accepts `session.create`.
- `hermes serve` is headless: `/pair/<id>` on `:9119` is 404. The host QR
  lives on `--serve` (`:9120/pair/<id>` SVG) or the dashboard tab (`qr_svg`).
- A separate public plugin GitHub repo is not claimed from this environment
  (`gh` cannot create repositories). The extractable folder stays
  `packages/hermes-managekar-plugin/`.
- **Reversal:** If Hermes publishes a first-party companion QR that returns
  the dashboard socket, delete `--serve` and keep `managekar.pair.v1` only
  as a fallback parser.

### D014 — Home is greeting + agent feed; White and Black are extra skins

- Overview heading is a small **Today** kicker plus a short honest PA briefing
  (`agentDayBriefing`) from live doing/today/thinking/approval and the
  demo/paired agent. Home actions are Add a task, Pair a machine (existing
  PairingSheet, not Simulate), and Ask the first agent. Empty Chat / Task /
  Notes / Habits previews stay hidden. Export and the composer dock stay off
  Home. No **Hello** on Home. Circles are the user's Bot Chat agents
  (or all visible sessions if none). Tap opens that chat. Four square jumps
  go to Task / Notes / Chat / Habit. Home list previews and the other
  tabs do not repeat Chat / Task / Notes / Habits as a page heading —
  the tab bar already names the section. The spotlight is the busy or last
  chat/task with real thinking or checklist progress — not a fake weekly
  percent.
- Skins: `hermes` | `classic` | `white` | `black`. White is paper + ink.
  Black is `#000` + light ink. Both keep `--radius: 0.5rem` and apply even
  if the light/dark toggle is the other way. Site tokens stay chrome-only.
  Do not invent a beige third product face.
- **Reversal:** Only if the founder replaces Home with a different first
  screen and retires White/Black.

### D015 — Home stages the ball

- Below 1024px, Home reserves a hole (`mk-home-ball-stage`, 168px) and parks a
  **120px ball** in its center. Other tabs keep the 56px edge-parked ball.
  Chats still hides it. The disk is a ball, not a plus FAB. Idle has no Plus
  glyph. Tap still opens Record / Task / Note / Open chats. Long-press still
  records. Home keeps Today, briefing actions, Bot Chat circles, and jump
  tiles. A Home-stage park is not written over the saved edge position.
- **Reversal:** Only if the founder wants the ball only as an edge
  AssistiveTouch and retires the Home stage.

### D016 — Tasks tab is task-only chrome

- Tasks hides the global Add-task / Note / Habit row (the list already has
  Add task), hides the composer dock, and hides the support kicker. Search
  stays and is labeled **Search tasks**. Export stays. Filters, list/board,
  and Select stay. The edge ball stays.
- **Reversal:** Only if the founder wants Note/Habit create or the chat
  composer back on Tasks.

### D017 — Notes tab is note-only chrome

- Notes hides the composer dock, the support kicker, and the generic
  workspace search. Ask my notes is the search. Record, Add note, label
  filters, and Export stay. The edge ball stays.
- **Reversal:** Only if the founder wants a second search field or the
  chat composer back on Notes.
