# MIT Hermes speak — design

## Direction

Manage.kar attaches to a running MIT [hermes-agent](https://github.com/NousResearch/hermes-agent) dashboard the same way Hermes Desktop does: public `GET /api/status`, then JSON-RPC over `ws://host:9119/api/ws` with a dashboard session token. This is **not** Hermes DM pairing (`hermes pairing approve telegram CODE`). QR stays a placeholder.

## Official contract (from the MIT tree)

- Status: `GET /api/status` returns `version` (string) and `gateway_running` (boolean), plus `auth_required`, optional `install_id`.
- Socket: `/api/ws` on port 9119. Loopback still requires `?token=<dashboard session token>`.
- CORS on the dashboard allows only `http(s)://localhost|127.0.0.1(:port)`.
- RPC methods this companion uses: `session.create`, `prompt.submit`, `session.interrupt`, `approval.respond`, `gateway.ping`.
- `session.create` result: `{ session_id, stored_session_id, ... }`.
- Events: official `method: "event"` frames. Id-bearing frames are RPC results, even if they also carry a method.
- `prompt.submit` uses the **Hermes** `session_id`, not `machine-*`.

## Product behavior

1. Pair sheet: name, kind, **helper URL** (default `http://127.0.0.1:9119`), **dashboard session token**.
2. Poll `/api/status`. Hermes-shaped JSON → stay **waiting** (helper found). Network fail → `helper_not_running`. HTTP/non-Hermes → `unreachable`. Status alone never pairs.
3. **Connect** opens `/api/ws`, calls `session.create`, then registers the machine as paired with `endpoint`, optional token, `installId`, `hermesVersion`, `hermesSessionId`.
4. WS/auth fail while `auth_required` → `needs_token`. Simulate pairing stays behind `#dev` / `?dev=1`.
5. Chats connect only to a stored machine endpoint. Send uses `hermesSessionId` when present.

## Out of this slice

OAuth single-use tickets, real QR, Flutter socket parity, plugin store, 7-column kanban, fake online.
