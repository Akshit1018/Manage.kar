# Manage.kar Hermes plugin

MIT-licensed host plugin for [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent).
This folder is the extractable repo: publish it as its own GitHub repository, then:

```bash
hermes plugins install OWNER/managekar-hermes-plugin --enable
# pin a commit in production
hermes plugins install OWNER/managekar-hermes-plugin --ref <40-char-sha> --enable
```

Hermes will ask to enable it (`[y/N]`, default no) unless you pass `--enable`.
User-installed platforms are opt-in via `plugins.enabled`.

## What it is

WhatsApp-style **host pairing**, not a second chat stack.

1. On the VPS or laptop, Hermes (or this package's CLI) mints a single-use `managekar.pair.v1` ticket.
2. A QR appears in the terminal, at `/pair/<id>`, or on the Hermes dashboard **Manage.kar** tab.
3. The phone scans the QR or opens the magic link.
4. One `POST /api/plugins/managekar/claim` returns `{ endpoint, token, install_id }`.
5. Manage.kar attaches with the official MIT contract: `GET /api/status` → `/api/ws?token=` → `session.create`.

This is **not** `hermes pairing approve telegram CODE` (DM pairing).
It is **not** a plugin store. Skills stay read-only on the phone.

## Run without publishing

```bash
# from a hermes-agent checkout
cp -R packages/hermes-managekar-plugin ~/.hermes/plugins/managekar
hermes plugins enable managekar
hermes dashboard
hermes managekar --host http://127.0.0.1:9119 --label "Home VPS"
```

Or standalone (no Hermes install):

```bash
python3 pairing_test.py
python3 serve_test.py
python3 -c "from cli import print_pair; print_pair('http://127.0.0.1:9119', 'stub')"
python3 cli.py --serve --host http://127.0.0.1:9119 --port 9120 --bind 127.0.0.1
```

`--serve` is the phone path. Official Hermes gates `/api/plugins/*` with a
dashboard session token, so a handset cannot claim on `:9119` without one.
The listener on `:9120` mints and claims without that header, then returns
`{ endpoint, token }` for the real dashboard WebSocket. Point `--pair-base`
(or `MANAGEKAR_PAIR_BASE`) at a LAN / Tailscale / tunnel URL the phone can
reach. Pass `--token` / `MANAGEKAR_DASHBOARD_TOKEN` so claim returns a real
dashboard session, not a stub `mk_` token.

On this Manage.kar repo the companion also ships `scripts/hermes-bridge-stub.mjs`,
which implements the same routes plus a tiny `/api/ws` so the bridge can be
proven without API keys.

## Routes

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/plugins/managekar/pair` | Mint ticket + QR URL |
| `POST` | `/api/plugins/managekar/claim` | Single-use claim → dashboard token |
| `GET` | `/pair/<pairId>` | Web page with a scannable QR |

Dashboard plugin routes are unauthenticated on a localhost-bound Hermes dashboard.
Do not bind the dashboard to `0.0.0.0` with untrusted plugins.

## Chat after claim

Inbound/outbound chat uses the dashboard JSON-RPC socket, not a second WhatsApp-like
message loop. The platform adapter is the install/discovery seam.
