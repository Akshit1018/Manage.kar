# Fix history

## 2026-08-23 Leftovers (`cursor/finish-remaining-e2f4`)

Closed the client-side leftovers Green Team left: share TTL, two-tab entity merge, voice IndexedDB, SW reminder snapshot, task filters, quota warning, milestone create, page split, dead TTS/theme-provider, mobile FAB.

Still impossible without a server: remote revoke, second-device sync, Google Drive, guaranteed OS alarms.

## 2026-08-23 Green Team (`cursor/green-team-repair-e2f4`)

Raised the post-remediation baseline from “honest notebook with suite costume” to “today + enforced schedules + honest share.”

Critic (assume insufficient): reminders still die when the tab closes; two tabs still last-write-wins; FAB is still a 900-line desktop extra; voice data URLs can blow quota. Those are documented in `KNOWN_LIMITATIONS.md`, not pretended closed.
