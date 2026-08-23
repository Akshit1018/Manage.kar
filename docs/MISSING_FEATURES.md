# Missing features

Only items with a user-value story. “Does this matter enough to build?” is answered. Evidence: this audit + 2026 competitor sources in `docs/COMPETITOR_GAPS.md`.

## P0-shaped missing (product cannot be trusted without)

| Feature | Why it matters | Evidence | Build? |
| --- | --- | --- | --- |
| Cross-tab / multi-writer persist | Silent loss | RT-002 confirmed | YES |
| Corrupt-file recovery | Wipe on next save | RT-003 | YES |
| Honest module list | Trust | RT-001, RT-008–013 | YES (mostly by deleting) |
| Confirm + undo delete | Accidents | RT-023 | YES |
| Backup parse that rejects garbage | Import wipe | RT-004 | YES |

## P1 missing (category table stakes)

| Feature | Why | Competitor | Build? |
| --- | --- | --- | --- |
| Real due dates + overdue | “Today” never ends | All four majors | YES |
| Recurrence engine **or** no UI | Stored lie | TickTick/Todoist | YES or hide |
| Reminder scheduler **or** no UI | First-run copy promises it | TickTick free | YES or hide |
| Habit local-date completions | Streaks lie overnight | TickTick habits; Level Up Dexie | YES if habits stay |
| Persist goals/time/focus **or** remove tiles | Modal RAM | Super Productivity timers | YES or hide |
| Named controls / keyboard | Exclusion | Table stakes | YES |
| Working PWA **or** drop tags | 404 icons | Level Up | Small yes |
| Share revoke/expiry **or** file-only | Permanent leak | Todoist sharing | File-only is enough |

## P2 quality of life

| Feature | Why | Build? |
| --- | --- | --- |
| Single capture bar + natural dates | Speed | After dates exist |
| Filters: open / today / overdue | Lists grow | YES |
| Bulk complete / delete (Select exists; only Share) | Select mode is share-only | YES |
| Search habits | Search box lies | YES |
| Formatted note dates | ISO dump | YES |
| Max length + trim | Whitespace titles | YES |
| Empty-field errors | Silent Create | YES |
| Keyboard shortcuts | Power users | Later |
| Import idempotency | RT-007 | YES |
| `storage` event banner | Two windows | YES |

## P3 / do not confuse with need

| Feature | Build now? | Why not |
| --- | --- | --- |
| Encrypted multi-device sync | NO | D004; needs a provider |
| Teams / ERP | NO | No backend |
| Google Sheets/Docs/Drive | NO | Fake today |
| AI categorize / MCP | NO | TickTick owns this; we can’t evaluate |
| Kanban / Eisenhower | NO | No dates yet |
| Calendar two-way sync | NO | External dependency |
| Collaboration presence | NO | Would be another lie |
| i18n | NO | Language switch is already a lie |
| Career-copilot domain | NO | Rejected P4-1 |

## Small missing that create huge friction

- No toast that a task saved.
- No “copied link is public” warning (we generate and smile “Link Copied!”).
- No offline indicator (ironic for local-first — it is always “offline”).
- No last-backup time.
- No “you have unsaved focus session” on close.
- No deep link to `/tasks`. Views are React state; refresh returns Overview.
- No onboarding checklist that is honest: “Add one task. Refresh. Export.”
