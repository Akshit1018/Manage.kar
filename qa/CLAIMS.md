# Claims vs observed

Check these against a live client. Do not invent traces.

| Claim | Source | How to observe |
| --- | --- | --- |
| Flutter data lives in PostgreSQL | README, Flutter auth copy | Only true for `apps/mobile` + `apps/api`. PWA is localStorage. |
| No backend / one JSON workspace | D002, D004, PRODUCT_VISION | Contradicted by Prisma API. Two sources of truth. |
| Home has no Chat/Task page headings | D014 + Home first-run | Phone Home: Today + briefing; tiles stay; no section h2. |
| Reminders fire at a clock time | Settings labels | Tab-open only. No push. |
| Habit custom days | Habit UI | Confirm whether toggle reads `customDays`. |
| Counts / recommended actions are a model | Counts UI | Heuristics. Flutter copy says so. |
| Hermes is a live model | DECISIONS prime directive | Public preview cannot reach laptop Hermes. Loopback used dummy. |
| Overlay / system ball | DECISIONS | KNOWN_LIMITATIONS: Android overlay is a stub. |
| Feature truth map: 4 tabs, Your workspace | forensic FEATURE_TRUTH_MAP | Current PWA: 5 tabs, Home is Today. |
| Demo account | apps/mobile/README | Must not be used on a shared VPS overnight. |

No latency SLO is documented. Without Sentry there is no p50 to disprove.
