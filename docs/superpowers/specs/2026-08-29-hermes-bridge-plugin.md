# Hermes bridge plugin — 2026-08-29

## Problem

Hermes has no official phone QR for dashboard attach. WhatsApp pairing
(`hermes whatsapp`) prints a **terminal QR** for a Node bridge session.
Dashboard attach is `GET /api/status` + `/api/ws?token=` + `session.create`.
DM pairing (`hermes pairing approve telegram CODE`) is a different product.

Manage.kar needs a WhatsApp-shaped **host ceremony** that still ends on the
official MIT socket.

## Decision

Ship an extractable MIT plugin (`packages/hermes-managekar-plugin/`) that people
install with `hermes plugins install owner/repo`. It registers `kind: platform`
`managekar` and dashboard routes under `/api/plugins/managekar/`.

```
Host: POST /pair  → managekar.pair.v1 ticket (QR page, CLI, dashboard tab)
Phone: POST /claim → { endpoint, token, install_id }  (single use, 10 min)
Phone: GET /api/status → WS /api/ws?token= → session.create
```

Chat after claim is the dashboard JSON-RPC path from the speak slice. The
platform adapter is the install/discovery seam, not a second inbound message
loop.

## Local proof

This cloud VM has no LLM keys and no `uv` Hermes install. `scripts/hermes-bridge-stub.mjs`
implements the same HTTP + WebSocket surface on loopback so pair, claim, and
`session.create` can fail honestly or pass.

## Out of scope

- Creating the public GitHub repo (`gh` is read-only here)
- Plugin store / skill install UI
- Cloning the 7-column kanban UI
- Fake online presence
- Simulate pairing on the happy path
