# Feature truth map

Live map for **this HEAD**. The forensic copy at `34ef512` is a dated
inspection, not current classification.

**Classes:** REAL · PARTIAL · STUB · ABSENT

| Module | Class | What is actually true |
| --- | --- | --- |
| PWA workspace | REAL | One `localStorage` document (`managekar.workspace.v1`). |
| Flutter workspace | REAL | Separate Postgres via `apps/api`. **two stores**, not synced. Export is the handoff. |
| Tasks / notes / habits | REAL | Persist in that client's store. |
| Habit schedule | REAL | `isHabitScheduledOn` reads frequency and `customDays`. `toggleHabitOnDate` no-ops off-schedule. |
| Reminders | PARTIAL | Fire while the PWA **tab is open** (`useLocalReminders` effect + 60s interval). Habit `reminderTime` is consulted. No push server. No OS alarm after the browser is killed. |
| Voice notes | PARTIAL | Audio is `idb:voice:` in IndexedDB. Recording stops if you leave the page. |
| Goals | PARTIAL | Persist in the workspace document. `deleteGoal` exists. Not the Home job. |
| Search | REAL | `?view=` `?q=` `?filter=` `?session=` in the URL. |
| Hermes attach | PARTIAL | JSON-RPC to a paired host. Lazy session uses `model: dummy` unless that host has a real model. |
| Android overlay | STUB | `overlay_capability.dart`. Permission may exist. This tree does not verify a live draw over other apps. |
| Sync / Drive / team | ABSENT | No second-device sync. No Google Drive. No collaboration. |

## Do not treat as true

- Habit frequency unused in toggle
- Voice blobs die after refresh because they are only object URLs
- Goals have no delete
- Search is RAM-only and not in the URL
- Reminders have no clock while the tab is open
- The PWA and Flutter clients share one database
