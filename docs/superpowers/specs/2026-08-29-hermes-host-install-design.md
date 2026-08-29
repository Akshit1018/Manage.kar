# Hermes host install — 2026-08-29

## Problem

People already pair WhatsApp to Hermes by scanning a **host** QR. Manage.kar
needs the same ceremony for a phone: prompt the host, mint a ticket, show a
QR (terminal / web link / Hermes tab), scan, stay bridged while the VPS or
laptop stays up. Official Hermes still has **no phone app** and **no
companion QR**. Last-30-days MIT code (HEAD `4209d37`, package `0.20.6`,
merged 2026-08-29) did not add one.

## Facts (clone + GitHub, not guesses)

- License is MIT. Install path: `hermes plugins install owner/repo --ref <40-char-sha> --enable`.
  Also `hermes://plugin/install?repo=owner/repo`. User platforms opt-in via
  `plugins.enabled`. Dashboard tabs come from `dashboard/manifest.json`.
- Three orthogonal pairings: WhatsApp Web QR (Node Baileys/web.js), DM
  pairing (`hermes pairing approve <platform> CODE`), dashboard
  `GET /api/status` + `/api/ws?token=` + `session.create`.
- `/api/plugins/*` is **not** in `PUBLIC_API_PATHS`. Loopback still 401s
  without `X-Hermes-Session-Token`. `--insecure` is documented no-op.
- Extra for the dashboard is `[web]`, not `[dashboard]`. `hermes serve` is
  the headless backend (no SPA). `hermes dashboard` is the browser UI.
- Canonical bot title is exactly `Bot Chat` (`CANONICAL_BOT_CHAT_TITLE`).
  Last-30-days: Bot Mode design system `#96726`; grill-me kept its name
  `#97872`.
- Kanban columns now include `scheduled`:
  `triage | todo | scheduled | ready | running | blocked | review | done`
  plus `archived`. Do not clone the SPA.
- Dashboard `--radius: 0.5rem`. Desktop uses `--radius-scalar: 0.2`.
- Official grill-me skill lives at
  `optional-skills/software-development/grill-me` (frontier rounds).

## Decision

1. Install official Hermes on the host (`uv pip install -e ".[web]"`).
2. Enable `packages/hermes-managekar-plugin/` as `~/.hermes/plugins/managekar`.
3. Mint/claim on `hermes managekar --serve` (`:9120`) so the phone never
   needs the dashboard header. Claim returns the `:9119` `{ endpoint, token }`.
4. Host QR is an SVG (web page + dashboard tab) and ASCII in the terminal.
5. Keep the extractable MIT folder. Do not claim a public plugin repo from
   an environment where `gh` cannot create repositories.

## Proven on this VM

```
hermes serve 127.0.0.1:9119   → /api/status 200, version 0.20.6
POST /api/plugins/managekar/pair without token → 401
POST /api/plugins/managekar/pair with session  → managekar.pair.v1
official claim without MANAGEKAR_DASHBOARD_TOKEN → mk_ … /api/ws 403
--serve mint + claim --token → { endpoint: :9119, token: session }
second claim → 409
GET :9120/pair/<id> → SVG QR
/api/ws?token= session.create → session_id (lazy, model dummy)
```

No LLM keys were present. `gateway_running: false` does not block dashboard
attach. A Cloudflare URL pointed at this PWA cannot pair a real phone to
`127.0.0.1`.

## Out of scope

- Public plugin GitHub repo
- Plugin store / skill install UI
- Cloning the kanban SPA or desktop TUI
- Fake online presence
- Simulate pairing on the happy path
- A third product skin (site tokens stay wordmark/preloader/approval only)
