# Backend findings

## There is no backend. The UI keeps implying one.

**OBSERVED FACT:** No `app/api`, no auth, no queue, no worker, no cron, no email, no Google client secret.

**INFERRED PROBLEM:** Users will treat Connect / Sync / Invite / Reminders / Auto Backup as server features (RT-001, RT-011, RT-013, RT-014).

Score this layer as **missing**, not as “elegantly serverless.” Local-first is a valid product. Fake RPC is not.

## Where business logic lives

| Rule | Location | Problem |
| --- | --- | --- |
| Toggle complete | `app/page.tsx` | Stale array persist |
| Habit streak | `app/page.tsx` | Not derived from history |
| Next id | `nextNumericId` | Race across tabs |
| Share encode | `lib/share/codec.ts` | Public payload |
| Backup parse | `lib/store/workspace.ts` | Too permissive |
| Google “API” | `google-integration.tsx` | `setTimeout` + `Math.random` |
| Notifications | nowhere | Switches write booleans |

No service layer. No idempotency keys. No transactions (one `setItem` is atomic per key, not per domain action across tabs).

## Side effects that should not exist

- `alert` / `confirm` as the API error bus.
- `console.log("[v0] ...")` of clipboard and “sync” payloads.
- `Notification` after fake Google connect.
- `window.location.href` to WhatsApp (leaves the app).
- Dual write profile → `manageKarUserProfile`.

## Sync vs async

Everything is sync `localStorage` except:

- Fake 1.5–2s Google delays (theater latency).
- Clipboard polling.
- Focus/time `setInterval`.
- `getUserMedia` / `Notification.requestPermission`.

There is no queue, so there is no retry, backoff, or poison-message handling. The closest analog is “user clicks Sync again.”

## N+1 / blocking

Not applicable at server scale. On the client, `JSON.parse` of the whole workspace on every persist is O(document). Fine until voice blobs (UA-1, UA-7).

## Dead server-shaped code

- Google spreadsheet/folder IDs.
- `manageKarGoogleIntegration`.
- Collaboration stats types.
- Settings `dataCollection` / `crashReports` / `analytics`.
- Manifest screenshots and team copy.

## What a real backend would have to own (if they ever add one)

Do not add a backend to paper over RT-001. If sync is required later (owner D004 reversal):

- The workspace document is the unit.
- Server is an async replica, not the UI source of truth (`docs/ARCHITECTURE.md` already says this).
- Auth, E2E, conflict UI — none exist. Do not ship “Supabase” because the README once dreamed it.

## Tests

Vitest covers store round-trip and share codec (14 tests in the suite; workspace file 9). No test for persist races, Google, or import idempotency. `next.config` will ship type errors anyway (RT-017).
