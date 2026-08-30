# Overnight QA findings — 2026-08-30

Target: Next.js PWA at `http://127.0.0.1:3062/` (390×844 Playwright).
Not targeted: Flutter API (`127.0.0.1:4000` down), Postgres (down), production (none).

Guards proven this run (see `qa/attempts/attempts.log`):
- owner `DATABASE_URL` blocked
- `DELETE FROM "Task"` blocked
- `qa-cleanup-write.mjs execute` blocked
- Sentry query blocked (`SENTRY_DSN` missing)

Cleanup written, not executed: `qa/cleanup/cleanup-2026-08-30.md`

## Findings by severity

### 1. High — No production telemetry, so no real p50 or failure rate

**Claimed / assumed:** An overnight agent can read p50 / p95 / error rate from Sentry.
**Observed:** `node scripts/qa-observability.mjs` exits 2. Fastify `logger: false`. No `@sentry` in the repo. This cloud run has no Sentry MCP.
**Evidence:** `qa/attempts/attempts.log` line `query-sentry-without-dsn`. Repo grep for `Sentry` in `*.ts`/`*.tsx` is empty.
**Do not invent:** There is no measured p50. Guessing 4.4s would be a new lie.

### 2. High — Docs describe two different products as one

**Claimed:** README — Flutter is the native product; rows live in PostgreSQL. `D002`/`D004` — one JSON workspace, no backend in this slice.
**Observed:** This PWA store is `managekar.workspace.v1` in localStorage (2 tasks after the marker). `apps/api` + Prisma exist but were not running. Flutter empty copy still says “stored in PostgreSQL.”
**Evidence:** `page.evaluate` localStorage dump; `curl 127.0.0.1:4000` connection refused; `pg_isready` failed.

### 3. Medium — Feature truth map no longer matches Home

**Claimed:** `docs/forensic/FEATURE_TRUTH_MAP.md` — four-tab mobile nav, greeting “Your workspace”, FAB hidden at 390.
**Observed:** Five tabs (Home / Tasks / Notes / Chats / Habits). Home h1 is **Today**. FAB present (`Record, add a task or note, or open chats`). No Hello.
**Evidence:** Playwright snapshot `page-2026-08-30T19-24-48` / `19-25-22`.

### 4. Medium — This browser is not an isolated overnight profile

**Claimed / required:** Isolated test profile so cleanup is only `qa-*` rows.
**Observed:** Skin was already White. Task id 5 “Buy milk” was already present from an earlier session. Agent-created row is only id 6 `qa-2026-08-30-marker`.
**Evidence:** localStorage task list at 19:25:08Z.

### 5. Low — Home first-run chrome matches the latest lock (this client)

**Claimed:** D014 — Today + short briefing, no Chat/Task page headings, Export/composer off Home, Pair is real PairingSheet.
**Observed:** Home: Today, “2 due today.”, Add a task / Pair a machine / Ask Bot Chat. No Export, no “Message an agent”, no Chat/Task h2. PairingSheet title “Paired machines”; copy says Simulate stays behind `#dev`; no Simulate button. Ask → `?view=chats&session=demo-research`. Tasks tab still has Export.
**Evidence:** snapshots 19:24:48, 19:25:08, 19:25:26, 19:25:39.

### 6. Low — Demo Bot Chat is honest, not a live model

**Claimed (prime directive):** Consume Hermes live chat / model switching.
**Observed:** Circle caption Demo. Thread URL `demo-research`. `docs/KNOWN_LIMITATIONS.md` still says loopback used `model: dummy` and public HTTPS cannot reach a laptop Hermes.
**Evidence:** Home circle “Demo”; Ask URL; KNOWN_LIMITATIONS.

## Claimed vs observed (checklist)

| Claim | Result |
| --- | --- |
| PWA data in PostgreSQL | **False** on this client — localStorage only |
| One workspace doc, no backend | **True** for this PWA; **false** as a repo-wide claim |
| Home headings Chat/Task gone | **True** on this build |
| Export off Home | **True** |
| Pair opens real sheet, not Simulate | **True** on happy path |
| Ask opens Bot Chat | **True** (`demo-research`) |
| Reminders are a clock | **Not exercised** (tab-open scheduler; no Sentry) |
| Sentry p50 | **Impossible** — no DSN |
| Three devices overnight | **Not run** — one Playwright profile |

## What was not done (on purpose)

- Did not Reset workspace
- Did not delete tasks
- Did not run `cleanup-2026-08-30.md`
- Did not apply `qa/sql/001-create-qa-agent-readonly.sql` (Postgres down)
- Did not pair a real host
- Did not guess a latency number
