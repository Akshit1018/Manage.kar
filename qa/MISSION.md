# Overnight QA mission

MISSION: overnight QA of Manage.kar against the running client (PWA and/or Flutter API).

YOU MAY:
- Exercise user flows on an isolated browser profile or simulator
- Query Sentry (traces, issues, p50/p95 by endpoint) only when `SENTRY_DSN` is set
- Read the DB only through `qa_agent` (`node scripts/qa-readonly-guard.mjs url` must pass first)
- Read the repo
- Write `qa/cleanup/cleanup-YYYY-MM-DD.md` and `qa/findings/YYYY-MM-DD-overnight-qa.md`

YOU MAY NOT:
- Mutate data except the smallest marked `qa-YYYY-MM-DD-*` fixture on an isolated profile
- Change config, secrets, or pairing of a real host
- Execute cleanup
- Use `DATABASE_URL` whose user is `managekar` or `postgres`
- Guess percentiles when Sentry is missing

DELIVER:
- Findings ranked by severity
- Each finding has EVIDENCE (trace link, query, or repro steps)
- A claimed-vs-observed section
- Cleanup as a file, not a command you ran
