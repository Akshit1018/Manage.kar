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
- Tasks: the Hermes **kanban** board (statuses `triage → todo → ready → running → blocked → review → done`),
  boards as project containers. We render it; we do not reinvent it.
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
  Pairing codes/links are generated on-device; the QR is labeled **Not a real QR yet**.
  The only completion path is still "Simulate pairing (dev)", but that control renders
  only with `#dev` or `?dev=1`. Simulated pairing creates a dialer session with
  `source: "paired"`, `presence: "active"` — the only sessions whose sends may read "Sent".
- **Reversal:** Replace the simulate action with the real QR/magic-link handshake when
  the Hermes backend module ships; the storage shape is designed to survive that swap.

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
