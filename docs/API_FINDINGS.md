# API findings

There is no versioned HTTP API. The “API” is three ad-hoc contracts.

## 1. Workspace document

- **Name:** `managekar.workspace.v1`
- **Auth:** origin isolation only
- **Validation:** Zod + passthrough; invalid rows dropped (RT-005)
- **Pagination / filter / sort:** none
- **Idempotency:** none
- **Rate limit:** none
- **Timeout:** none
- **Compatibility:** `schemaVersion` forced to 1 on save; extras kept via passthrough
- **Error codes:** none — functions return empty or `{ ok: false, error: string }`

Inconsistencies:

- Backup wrapper adds `appName`, `appVersion: "2.0.0"`.
- Share export uses `version: "1.0.0"`.
- Settings footer: “Version 1.0.0.”

## 2. Share token

```
GET /shared/:data
```

- `:data` is the resource **and** the authorization.
- Status: always 200 HTML. Invalid token → in-page error, not 404.
- Copy mentions **expiry**; codec has none (RT-006).
- Size cap 6000 chars on encode; decode allows `MAX * 2`.
- Dual decode: utf8-base64url then raw `atob` (legacy).
- Import is POST-less: a click writes localStorage (RT-007).
- No rate limit on import clones.

This exposes implementation (Base64 JSON) instead of a domain “share id.”

## 3. Fake Google RPC

`connectToGoogle` / `syncToGoogle` look like APIs:

- 2000ms latency
- 20% “timeout”
- success Notification
- no request on the network tab

Contract vs similar buttons: Export (real file) vs Sync Now (alert). Same settings surface, different honesty (RT-001).

## Client chaos behavior

| Condition | Client |
| --- | --- |
| 400 | n/a |
| 401/403 | n/a |
| 404 icons | console + broken PWA (RT-025) |
| 500 RSC `?_rsc=` | seen once (UA-13) |
| 429 | n/a |
| timeout | fake Google only |
| duplicate request | persist last-write-wins |
| retry | user clicks again; share import duplicates |

## Versioning

None. `schemaVersion: 1` is a comment the writer always stamps.

## What a better contract looks like

If they ever expose HTTP: `POST /v1/workspace/import` with checksum, `POST /v1/shares` returning an opaque id with TTL, `401` without a session. Until then, **stop painting Connect/Sync as HTTP.**
