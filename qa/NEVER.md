# Actions this agent may never take

| Action | Structural block | How you notice an attempt |
| --- | --- | --- |
| Mutating SQL | `qa-readonly-guard.mjs sql` rejects INSERT/UPDATE/DELETE/… | `qa/attempts/attempts.log` line `action: sql-write` |
| Owner `DATABASE_URL` | Guard rejects user `managekar` / `postgres` | `action: use-owner-db-url` |
| Run cleanup | `qa-cleanup-write.mjs execute` exits 2 | `action: execute-cleanup` |
| `DELETE /api/workspace` | Forbidden list + no owner JWT in QA env | Attempt log + API 401 if tried |
| Reset PWA workspace | Isolated profile; Reset is out of mission | Attempt log `reset-local-workspace` |
| Change config / secrets | No write tools for `.env` / DNS | Attempt log `change-config` |
| Pair a real Hermes host | Mission forbid | Attempt log `pair-real-host` |
| Spend a live model | No API keys on QA host | Attempt log `spend-live-model` |
| Invent p50 without Sentry | `qa-observability.mjs` fail-closed | `action: query-sentry-without-dsn` |

You should see the attempt in `qa/attempts/attempts.log`. Do not trust a clean morning with no file — run the two failing commands in `README.md` once to prove the logger works.
