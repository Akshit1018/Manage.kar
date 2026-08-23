# Product mental model

Built from **routes, schema, persist paths, and a live session**, not from the README.

## What this product is actually trying to become

A **single-person, local-first capture surface** for work that must survive refresh: tasks, notes, habits, plus optional focus/time/goals, with export as the only backup.

It is not trying to become a team OS, a Google Workspace client, a recruiting copilot, or an AI coach. Those nouns appear in leftover storage (`manageKarGoogleIntegration`) and in stale docs. They are not in the current UI.

## Who it is targeting

One person on one browser profile who does not want an account.

Implied secondary: someone who already lost data in a cloud task app and wants honesty more than sync. That is **HYPOTHESIS**. The code does not encode a persona.

## Primary job-to-be-done

**Capture a task and still see it tomorrow on this device.**

Secondary jobs the UI also offers: jot a note, mark a habit today, run a timer, export JSON, send a passworded task list.

## Expected aha

Add one task → refresh → it is still there. The header already says this: “Local workspace on this device. Export if you want a backup.”

## Primary recurring value

Daily habit toggles + leftover open tasks. There is no server-side streak social graph, no weekly digest, no email. Recurring value is whatever the user left in `localStorage`.

## Where the user should spend time

Overview + Tasks. That is the only surface that exists on a phone (390px). Desktop adds six more doors (Habits dash, Goals, Time, Focus, Share, Counts) that the mental model does not need.

## What the moat is supposed to be

`docs/PRODUCT_VISION.md` implies **trust**: no fake sync, no fake AI, data you can export. That is a positioning moat, not a technical one. Anyone can ship a JSON document in `localStorage`.

## What the architecture says the founders intended

A v0 “suite” (glass cards, Google, teams, analytics Brain, FAB voice+focus) **collapsed into one workspace document**. The store (`lib/store/workspace.ts`, 661 lines) is the intended core. The leftover suite chrome is the drift.

## Where implementation drifted

| Intended (vision / remediations) | Drift |
| --- | --- |
| Honest local-first list | Desktop still looks like an 8-product dashboard |
| One focus service | FAB timer + Focus modal |
| Habits with schedules | Frequency fields that do nothing |
| Reminders | Load-time notifications if the tab is open |
| PWA | Icons + a static SW, not an offline product |
| Export is backup | Encrypted links still cannot expire |
| Clean first run | This device still holds red-team XSS titles, slogan due dates, and a fake Google blob |

## Unrelated features glued on

- Counts “Recommended Actions” (9–11 AM, 45-minute focus, reduce to 3 habits) — not computed from the workspace
- Profile trophy row
- Clipboard polling
- WhatsApp composer
- Goal ERP tiles with zero milestones
- `TextToSpeech` component unused while the note modal already speaks

## 5-minute test (this browser, 2026-08-23)

This profile was a **returning** device, not a virgin install.

- Value was understandable from the header in under 5 seconds.
- A stranger would still hit leftover `<script>` titles and two identical pending cards. Trust **decreases** until they realize it is old test data.
- Empty-title create failed honestly.
- Goals empty, Backup honest, Share defaults to export.
- A brand-new user on a clean profile would see the empty state instead. That path was **not** the state of this browser. Marked **UNVERIFIED** for true first-run on a wiped origin.

## 30-day simulation

**STRONG from architecture, not from a 30-day user:**

- The product does not get smarter. Recommendations do not change.
- Habit history accumulates and is useful.
- Voice audio from week 1 is gone.
- `localStorage` quota + quarantine copies + 200-event log become the scale limit.
- Two phones = two workspaces unless the user remembers to export.
- Lock-in is inconvenience (no import from TickTick), not accumulated intelligence.

## Investor dismissal (product weakness, not fundraising advice)

- Why isn’t this a feature? It **is** a feature: a local list. [Super Productivity](https://super-productivity.com/) already ships local-first tasks + time + focus as a mature open-source product.
- What grows stronger with usage? Habit history only.
- What is defensible? Almost nothing technical. Honesty is copy, not a moat.
- Why will users pay? There is no paid surface and no scarce backend.

## Founder dismissal (six months of runway)

Wasted effort: FAB (944 lines), Counts theater, Habit Dashboard duplicate, Goals without delete, dead TTS/theme-provider, leftover Google key migration theater, PWA claim without offline shell.

Keep: workspace document, task/note/habit CRUD, export/import, encrypted share, honest backup copy, quarantine.

## Delete-the-docs test

A user who never reads README can add a task. They cannot discover Share, Goals, Time, Focus, or Counts on a phone. They will believe reminders fire at a clock time because the switch is labeled that way. They will believe habit “Custom Days” means something. Those labels require docs to unlearn. That is a product failure, not a documentation failure.
