# Red-team scorecard

**Product:** Manage.kar (`Akshit1018/Manage.kar`)  
**Inspected revision:** `cursor/product-foundation-e2f4` @ `6432bf8` plus this audit branch  
**Date:** 2026-08-23  
**Method:** Code inspection + live browser torture at `http://127.0.0.1:3000` + current-web competitor research  
**Inspection scores below are frozen.** Remediations landed on `cursor/fix-red-team-findings-e2f4` (PR #3). Re-score after merge; do not rewrite the original numbers.

Scores are against a shippable 2026 personal productivity product, not against “a nicer v0 demo.”

| Dimension | Score | Why this low |
| --- | ---: | --- |
| PRODUCT QUALITY | **3/10** | Only tasks/notes/habits persist. Half the chrome is theater. |
| USER EXPERIENCE | **3/10** | Eight equal CTAs, first-visit permission wall, fake modules, no undo. |
| UI QUALITY | **4/10** | Glass cards look finished; hierarchy, density, and mobile are not. |
| PRODUCT LOGIC | **2/10** | Reminders, recurring, streaks, due dates, goals, time, backup do not do what they say. |
| FRONTEND | **3/10** | God page + 1k-line FAB; stale React persist; unlabeled controls. |
| BACKEND | **2/10** | Correctly none — but the UI still sells Google/team backends. |
| DATABASE | **3/10** | One JSON blob, numeric IDs, silent drop, last-write-wins, no audit. |
| API DESIGN | **1/10** | No HTTP API. Share is a raw Base64 URL. |
| ARCHITECTURE | **3/10** | Local document was the right call; fake modules and dual writes undo it. |
| AI QUALITY | **1/10** | No model. Mentions, analytics “insights,” and Google “AI-looking” copy are fake. |
| SECURITY | **3/10** | Local-only helps. Fake OAuth, public share tokens, clipboard polling, build-error ignore do not. |
| PERFORMANCE | **5/10** | Fine at 2 tasks. Unmeasured at 10k. Focus timer resets interval every second. |
| RELIABILITY | **2/10** | Confirmed cross-tab data loss. Fake backup. `tsc`/`eslint` ignored in production builds. |
| MARKET COMPETITIVENESS | **2/10** | TickTick free and Super Productivity already ship this surface for real. |
| PRODUCTION READINESS | **2/10** | Not a product. A local list wearing a suite costume. |

**Weighted ship verdict: 2.5/10. Do not market this as 1.0.**

Previous internal scorecard in `docs/QUALITY_SCORECARD.md` scored the persist slice 7–8. That scorecard is honest about *the slice*. This scorecard is honest about *the product a first-time user actually sees*.

## What we actually tested (not speculated)

- First-visit permissions overlay (screenshot).
- Goals modal still seeds “Learn React Development” / “Run a Marathon” (2024 dates).
- Preview overlay shows 156 shares / Sarah Johnson / Export Report with no handler; Escape does not close it.
- Google Sheets “Connect” becomes Connected in ~2s, writes Google’s public sample spreadsheet ID, no OAuth.
- Empty task title: Create does nothing, no error.
- Unicode / XSS-looking title stored and rendered as text (not executed).
- Reminders toggle persists `true`; nothing is scheduled.
- Two-tab write: injecting `TAB1-ONLY-SHOULD-SURVIVE` then toggling a task in the stale tab **deleted** it (`lost: true`).
- Share link is Base64 JSON in the path; import duplicates without confirm; `router.push('/')` did not navigate.
- PWA icons 404: `/icon-192.png`, `/icon-512.png`, `/apple-touch-icon.png`, `/favicon.ico`, screenshots.
- Mobile 390×844: eight equal tiles + FAB overlapping the last task.

## What we did not test

See `docs/UNVERIFIED_ASSUMPTIONS.md`.

## Post-remediation browser checks (2026-08-23)

- Cold load: no permission wall; title is local-first; Add task is the primary CTA.
- Empty title: inline “Add a title before saving.”
- Created “Persist after remediations” with ISO due date; survived refresh.
- Injected `TAB1-ONLY-SHOULD-SURVIVE` then toggled the other task: `lost: false`.
- Settings Backup: “No cloud backup yet.” No Connect button.
- Goals: empty, no React/Marathon seed.
- Share default action: Export Tasks; copy says links do not expire.
- Mobile 390: bottom nav Home / Tasks / Notes / Habits.
- Icons `/icon-192.png` and `/apple-touch-icon.png` return 200.
- `pnpm test` 28/28; `tsc --noEmit` clean.
