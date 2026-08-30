# Overnight agent QA

Constraints first. Autonomy second.

## How read-only is enforced (not requested)

1. **Postgres grant** — a human runs `qa/sql/001-create-qa-agent-readonly.sql`. Role `qa_agent` gets `CONNECT` + `SELECT` only. `INSERT` / `UPDATE` / `DELETE` / `TRUNCATE` are revoked.
2. **URL gate** — `node scripts/qa-readonly-guard.mjs url "$DATABASE_URL"` exits 2 if the user is `managekar`, `postgres`, or anything other than `qa_agent`. The attempt is appended to `qa/attempts/attempts.log`.
3. **SQL gate** — `node scripts/qa-readonly-guard.mjs sql "DELETE …"` exits 2 and logs `sql-write`. SELECT is allowed.
4. **Cleanup gate** — `node scripts/qa-cleanup-write.mjs execute` exits 2. Cleanup is a markdown file under `qa/cleanup/`. A human runs it after reading.
5. **Observability gate** — `node scripts/qa-observability.mjs` exits 2 unless `SENTRY_DSN` is set. No guessed p50.

The PWA has no server DB. Overnight QA of the Next.js app uses an isolated browser profile and must not tap Reset workspace. Leftover rows go in `qa/cleanup/`.

## Run

```bash
node scripts/verify-overnight-qa.mjs
node scripts/qa-readonly-guard.mjs url
node scripts/qa-readonly-guard.mjs url 'postgresql://managekar:managekar@127.0.0.1:5432/managekar'
node scripts/qa-observability.mjs
```

Those last two commands should fail and write `qa/attempts/attempts.log`. That is the proof.
