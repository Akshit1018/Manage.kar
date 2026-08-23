# Red-team findings (master ledger)

**Audit date:** 2026-08-23  
**Branch inspected:** `cursor/product-foundation-e2f4` @ `6432bf8`  
**Remediation branch:** `cursor/fix-red-team-findings-e2f4`  
**Status key:** OPEN | RESOLVED | PARTIALLY RESOLVED | FALSE POSITIVE | NOT REPRODUCIBLE  
**Do not delete rows. Mark status when something is later fixed.**

Evidence screenshots live in `docs/red-team/evidence/`.

If a previous owner doc (`docs/KNOWN_ISSUES.md`, `docs/PRODUCT_BACKLOG.md`) already named a problem, this ledger still records it with **current** severity against the product a stranger sees.

---

## How to fail this product first

**Sell Google backup, teams, reminders, and a 1.0 suite. Ship a local task list that will overwrite itself in a second tab and tell the user their Drive sync succeeded.**

That is RT-001 + RT-002 + RT-011 + RT-013. Everything else is downstream.

---

## CRITICAL

### RT-001

- **STATUS:** RESOLVED
- **RESOLUTION:** Google Connect/Sync UI removed. Settings Backup says there is no cloud adapter and points at Export. Regression: no `manageKarGoogleIntegration` write path remains.
- **AREA:** Security / Trust / Integrations
- **TITLE:** “Connect Google Sheets” fakes OAuth and can claim a successful backup
- **WHAT IS WRONG:** `connectToGoogle` waits 2s, fails 20% of the time at random, otherwise sets `connected: true` and writes spreadsheet ID `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms` (Google’s public sample sheet). `syncToGoogle` reads **legacy empty keys** (`manageKarTasks`, not `managekar.workspace.v1`), logs to console, then `alert("Successfully synced to Google Sheets! Your data is now backed up.")`.
- **EVIDENCE:** `components/google-integration.tsx` lines 99–204. Browser: Settings → Integrations → Connect Google Sheets → badge **Connected**, Enable Sync on, sample ID filled. Screenshots: `rt-settings-google-preview.png`, `rt-google-fake-connected.png`. Parent copy says “preview”; child copy says “Automatically sync… secure cloud storage.”
- **REAL USER IMPACT:** Users stop exporting. Device wipe / browser clear = total loss while they believe Drive has a copy.
- **REAL-WORLD SCENARIO:** A student enables “auto backup,” clicks Sync Now, sees the success alert, then reinstalls Chrome.
- **ROOT CAUSE:** v0 integration theater left wired to real buttons. A one-line preview label was added above a 650-line fake client.
- **SEVERITY:** CRITICAL
- **CONFIDENCE:** CONFIRMED
- **COMPETITOR COMPARISON:** [Super Productivity](https://super-productivity.com/) documents optional WebDAV/Dropbox sync as optional and real. TickTick’s calendar sync is an actual Google OAuth product ([TickTick](https://www.ticktick.com/?language=en_Us)).
- **EXPECTED BEHAVIOR:** No Connect button until a real adapter exists. If preview remains, disable the button and do not persist a “connected” flag.
- **AFFECTED LAYERS:** UI, Frontend, (claimed) API, Security
- **REPRODUCTION:** Open Settings → Integrations → Connect Google Sheets. Wait 2s. Observe Connected + sample ID. Click Sync Now. Read alert vs Network tab (no Google requests).
- **TEST THAT SHOULD EXIST:** E2E: Connect must not set `connected` without an OAuth token; Sync must not alert success; no write to `manageKarGoogleIntegration` pretending live.

### RT-002

- **STATUS:** RESOLVED
- **RESOLUTION:** `mutateWorkspace` always loads storage before patching. Hook listens to `storage`. Browser: injected `TAB1-ONLY-SHOULD-SURVIVE` then toggled the other task → `lost: false`. Test: “patches storage instead of replacing it with a stale tab snapshot.”
- **AREA:** Database / Frontend / Reliability
- **TITLE:** Second tab + any save silently deletes the other tab’s work
- **WHAT IS WRONG:** `persist(partial)` does `saveWorkspace({ ...currentFromStorage, ...partial })` but callers pass **React `tasks`/`notes`/`habits`**, which overwrite storage. `useWorkspace` does not listen to `window.storage`. Two tabs diverge; the next toggle wins and drops the other tab’s rows.
- **EVIDENCE:** `lib/store/use-workspace.ts` 36–42; `app/page.tsx` `handleTaskToggle` / `handleSaveTask`. Browser: wrote `TAB1-ONLY-SHOULD-SURVIVE` (id 99) in storage from tab B; toggled “Persist after refresh” in tab A; evaluate returned `lost: true`. Only two tasks remained.
- **REAL USER IMPACT:** Silent data loss. No toast. No conflict UI.
- **REAL-WORLD SCENARIO:** Phone-as-PWA + desktop tab; or two laptop windows.
- **ROOT CAUSE:** “Load-merge-save” uses stale in-memory collections as the merge payload.
- **SEVERITY:** CRITICAL
- **CONFIDENCE:** CONFIRMED
- **COMPETITOR COMPARISON:** Serious local-first apps use IndexedDB + a single writer or CRDT/sync ([Cairn](https://github.com/Artaeon/cairn) uses IndexedDB; Super Productivity uses a local DB with optional sync).
- **EXPECTED BEHAVIOR:** Persist patches by id against **storage**, or listen to `storage` and refuse stale writes. Show a reload banner on foreign writes.
- **AFFECTED LAYERS:** Frontend, Database
- **REPRODUCTION:** Two tabs. In B, `localStorage` push a unique task. In A, toggle any task. Unique task is gone.
- **TEST THAT SHOULD EXIST:** Two simulated `KeyValueStore` clients; write from A then B using the same `persist` helper as the page.

### RT-003

- **STATUS:** RESOLVED
- **RESOLUTION:** Corrupt JSON is copied to `managekar.workspace.v1.corrupt.<ts>` and is not overwritten by `mutateWorkspace` until `resetCorruptWorkspace`. Test: “quarantines corrupt workspace JSON and refuses to overwrite it.”
- **AREA:** Database
- **TITLE:** Corrupt workspace JSON becomes an empty workspace; the next save can wipe the key
- **WHAT IS WRONG:** `loadWorkspace` returns `createEmptyWorkspace()` on parse failure. UI then looks empty. The next `persist` writes that empty document over the corrupt (or recoverable) value.
- **EVIDENCE:** `lib/store/workspace.ts` 269–271; test “recovers from corrupt workspace JSON” **asserts empty arrays**, i.e. the wipe is specified.
- **REAL USER IMPACT:** One bad write (quota, extension, full disk) can delete the user’s life list.
- **REAL-WORLD SCENARIO:** Chrome kills a tab mid-`setItem`. Next visit: empty dashboard. User adds a task. Corrupt backup is gone.
- **ROOT CAUSE:** No quarantine key, no backup rotation, no “your data looks damaged” screen.
- **SEVERITY:** CRITICAL
- **CONFIDENCE:** HIGH CONFIDENCE (unit-tested behavior; not browser-injected)
- **EXPECTED BEHAVIOR:** Keep `managekar.workspace.v1.corrupt.<timestamp>`; show recovery UI; do not save empty over damaged bytes.
- **AFFECTED LAYERS:** Database, Frontend, UX
- **REPRODUCTION:** Set key to `{not-json`, load, then toggle a task.
- **TEST THAT SHOULD EXIST:** Corrupt load must not `setItem` until the user confirms reset.

---

## HIGH

### RT-004

- **STATUS:** RESOLVED
- **RESOLUTION:** `parseBackup` requires `schemaVersion === 1` or `appName === "Manage.kar"`. Test: `parseBackup("{}").ok === false`.
- **AREA:** Database / Settings
- **TITLE:** Almost any JSON object is a “valid backup”
- **WHAT IS WRONG:** `normalizeWorkspace` accepts any record. `parseBackup("{}")` and `{"hello":"world"}` succeed as empty workspaces. Import then **replaces** all data after `confirm`.
- **EVIDENCE:** `lib/store/workspace.ts` 249–266, 314–331.
- **REAL USER IMPACT:** Accidental import of a random download wipes the workspace.
- **REAL-WORLD SCENARIO:** User picks `package.json` or an empty `{}`.
- **ROOT CAUSE:** Parser optimized for migration, not safety.
- **SEVERITY:** HIGH
- **CONFIDENCE:** HIGH CONFIDENCE
- **EXPECTED BEHAVIOR:** Require `schemaVersion` or `appName === "Manage.kar"` and refuse empty replacements unless explicitly “reset.”
- **AFFECTED LAYERS:** Database, Settings
- **REPRODUCTION:** Settings → Import → `{}`.
- **TEST THAT SHOULD EXIST:** `parseBackup("{}").ok === false`.

### RT-005

- **STATUS:** RESOLVED
- **RESOLUTION:** Invalid rows are counted, stored under `managekar.workspace.v1.dropped`, and shown in a dashboard banner. Valid rows stay. Test: “keeps valid rows and reports dropped invalid ones.”
- **AREA:** Database
- **TITLE:** Invalid task/note/habit rows are dropped with no log
- **WHAT IS WRONG:** `asTaskArray` / `asNoteArray` / `asHabitArray` `flatMap` away failed Zod parses.
- **EVIDENCE:** `lib/store/workspace.ts` 160–187.
- **REAL USER IMPACT:** Partial file corruption looks like “some tasks vanished.”
- **SEVERITY:** HIGH
- **CONFIDENCE:** HIGH CONFIDENCE
- **EXPECTED BEHAVIOR:** Quarantine invalid rows; show count.
- **AFFECTED LAYERS:** Database
- **TEST THAT SHOULD EXIST:** One valid + one invalid task → both preserved or invalid reported.

### RT-006

- **STATUS:** PARTIALLY RESOLVED
- **RESOLUTION:** Default share method is JSON export. New links are AES-GCM password-protected (`enc1.` tokens). Plaintext tokens still decode for old URLs. Links still do not expire and cannot be revoked without a server.
- **AREA:** Security / API
- **TITLE:** Share “links” are public, unauthenticated, non-expiring Base64 of the payload
- **WHAT IS WRONG:** Token is `utf8ToBase64Url(JSON.stringify(payload))` in `/shared/[data]`. Anyone with history, Slack, referrer, or a proxy log can read titles, descriptions, checklist, name.
- **EVIDENCE:** `lib/share/codec.ts`; generated URL in `rt-share-public-url.png` decodes to the full task including `<script>alert(1)</script>` title. Error UI mentions expiry (`app/shared/[data]/page.tsx` 65) but **no expiry exists**.
- **REAL USER IMPACT:** Private work leaked via a “link.” Cannot revoke.
- **REAL-WORLD SCENARIO:** Paste into WhatsApp group; it sits in chat backup forever.
- **ROOT CAUSE:** Share-without-a-server shortcut.
- **SEVERITY:** HIGH
- **CONFIDENCE:** CONFIRMED
- **COMPETITOR COMPARISON:** Todoist/TickTick share lists behind accounts and permissions ([StackCompare 2026](https://stackcompare.net/todoist-vs-ticktick-vs-things-3-2026-personal-task-manager-pricing-compared/)).
- **EXPECTED BEHAVIOR:** Default to file export. If URL share remains, encrypt + expire + warn “anyone with the link can read this, forever.”
- **AFFECTED LAYERS:** API, Security, UX
- **REPRODUCTION:** Share → Share Link → Generate & Copy. Decode path.
- **TEST THAT SHOULD EXIST:** Payload must not be readable without a secret; expired tokens fail.

### RT-007

- **STATUS:** RESOLVED
- **RESOLUTION:** Import confirms, hashes the payload, skips repeats, toasts, then `router.push("/")`. Test: `import-tasks.test.ts`.
- **AREA:** UX / Logic
- **TITLE:** Import Tasks has no confirm, allows duplicates, and failed to navigate home
- **WHAT IS WRONG:** `handleImportTasks` appends copies with new ids and `router.push("/")`. Browser: click Import → workspace gained a **duplicate** emoji task; URL **stayed** on `/shared/...`; no toast.
- **EVIDENCE:** `app/shared/[data]/page.tsx` 30–45; `rt-shared-import-no-confirm.png`; evaluate titles length 3 with two identical unicode titles.
- **REAL USER IMPACT:** Repeated clicks clone lists. User is unsure import worked.
- **SEVERITY:** HIGH
- **CONFIDENCE:** CONFIRMED
- **EXPECTED BEHAVIOR:** Confirm, dedupe, toast, then navigate.
- **AFFECTED LAYERS:** Frontend, UX
- **REPRODUCTION:** Open a generated share URL, click Import Tasks twice.
- **TEST THAT SHOULD EXIST:** Import is idempotent per payload hash.

### RT-008

- **STATUS:** RESOLVED
- **RESOLUTION:** Goals persist in the workspace. First open is empty, no 2024 demo seed. Browser: “No goals yet.”
- **AREA:** Product / UX / Logic
- **TITLE:** Goals are a 2024 demo that vanishes when the modal unmounts
- **WHAT IS WRONG:** `GoalManager` `useState` seeds “Learn React Development” (65%, due 2024-06-30) and “Run a Marathon.” Not in `Workspace`. Close = gone. Contradicts D003 “first run is empty, not fake seed data.”
- **EVIDENCE:** `components/goal-manager.tsx` 33–67; screenshot `rt-goals-fake-seed.png`. README already admits preview-only.
- **REAL USER IMPACT:** User thinks they have goals; refresh steals them. Or they think the product is a React tutorial demo.
- **SEVERITY:** HIGH
- **CONFIDENCE:** CONFIRMED
- **EXPECTED BEHAVIOR:** Empty persisted goals, or remove the module from the home grid.
- **AFFECTED LAYERS:** UI, Frontend, Database
- **REPRODUCTION:** Goals → see 2 active / 48% → close → reopen → same demo, not user data.
- **TEST THAT SHOULD EXIST:** After create + remount, goal title still present **or** module absent.

### RT-009

- **STATUS:** RESOLVED
- **RESOLUTION:** Time entries persist as ISO strings in the workspace. Running timers survive remount.
- **AREA:** Logic
- **TITLE:** Time tracker state dies with the modal
- **WHAT IS WRONG:** `TimeTracker` holds entries in `useState`. Close loses running timers.
- **EVIDENCE:** `components/time-tracker.tsx` 28–33, 91–102.
- **SEVERITY:** HIGH
- **CONFIDENCE:** HIGH CONFIDENCE
- **EXPECTED BEHAVIOR:** Persist sessions in the workspace or don’t offer Time on the home grid.
- **AFFECTED LAYERS:** Frontend, Database
- **TEST THAT SHOULD EXIST:** Start timer, unmount, remount, still running.

### RT-010

- **STATUS:** RESOLVED
- **RESOLUTION:** Active focus persists (`startedAt` + remaining). Pause/Stop are visible. Five-tap lock removed. FAB no longer starts a second focus timer.
- **AREA:** UX / Logic
- **TITLE:** Focus sessions are ephemeral and lock behind a 5-tap gesture
- **WHAT IS WRONG:** Sessions live in component state. After start, UI locks until five taps (`handleTap`). Timeout reads stale `tapCount`. Completing a session is lost on close. Second timer exists in `FloatingToggle`.
- **EVIDENCE:** `components/focus-modal.tsx` 25–91, 134–156; `docs/PRODUCT_BACKLOG.md` P2-2.
- **SEVERITY:** HIGH
- **CONFIDENCE:** HIGH CONFIDENCE
- **EXPECTED BEHAVIOR:** One persisted focus service; visible pause/stop; no secret tap code.
- **AFFECTED LAYERS:** UX, Frontend
- **TEST THAT SHOULD EXIST:** Start 25:00, close modal, reopen, time still counting.

### RT-011

- **STATUS:** RESOLVED
- **RESOLUTION:** Completing a recurring task spawns the next due date. `useLocalReminders` fires device notifications for due reminded tasks/habits when permission is granted. Test: `lib/reminders/due.test.ts`.
- **AREA:** Product logic
- **TITLE:** Recurring + Reminders are stored switches that never fire
- **WHAT IS WRONG:** Task modal and habit modal persist `recurring` / `reminders`. No scheduler, no `Notification` for due tasks. First-run copy still says notifications are “For task reminders and confirmations.”
- **EVIDENCE:** `components/task-modal.tsx` 391–423; `app/page.tsx` 1087–1091; created task with `reminders: true` in localStorage; zero notifications. Screenshot `rt-task-modal-advanced-mentions.png`.
- **REAL USER IMPACT:** Missed bills. Users paid (or trusted) a reminder product.
- **SEVERITY:** HIGH
- **CONFIDENCE:** CONFIRMED
- **COMPETITOR COMPARISON:** TickTick includes reminders on free; Todoist gates some reminders behind Pro ([StackCompare 2026](https://stackcompare.net/todoist-vs-ticktick-vs-things-3-2026-personal-task-manager-pricing-compared/)). Both actually fire.
- **EXPECTED BEHAVIOR:** Hide the switch until a scheduler exists, or implement a deterministic local alarm.
- **AFFECTED LAYERS:** UX, Frontend
- **TEST THAT SHOULD EXIST:** `reminders: true` + due now → notification or explicit “not implemented.”

### RT-012

- **STATUS:** RESOLVED
- **RESOLUTION:** Completions keyed by local date; streak derived from history. Test: `lib/habits/streak.test.ts`.
- **AREA:** Logic / Database
- **TITLE:** Habit “today” and streak are not date-safe
- **WHAT IS WRONG:** `completedToday` is a boolean with no midnight reset. Toggle does `streak + 1` / `streak - 1` without checking yesterday. History is rewritten for today but streak is not derived from history.
- **EVIDENCE:** `app/page.tsx` 207–225.
- **SEVERITY:** HIGH
- **CONFIDENCE:** HIGH CONFIDENCE
- **EXPECTED BEHAVIOR:** Completions keyed by local date; streak computed from history.
- **AFFECTED LAYERS:** Logic, Database
- **TEST THAT SHOULD EXIST:** Clock at 23:59 complete; 00:01 next day → not still complete; streak unchanged until a new day complete.

### RT-013

- **STATUS:** RESOLVED
- **RESOLUTION:** Collaboration/Preview dashboard removed from the home grid and deleted.
- **AREA:** Product / UX / Trust
- **TITLE:** “Preview” is a fake ERP with 156 shares and dead primary actions
- **WHAT IS WRONG:** `CollaborationDashboard` hardcodes stats and people (Sarah Johnson, Emma Davis, Mike Chen). Footer **Export Report / Invite Member / Share Tasks** has **no `onClick`**. Overlay is a `fixed inset-0` div: **Escape does not close** (Playwright click on Settings was intercepted). Label was renamed “Preview” but the surface still looks live.
- **EVIDENCE:** `components/collaboration-dashboard.tsx` 78–88, 700–707; `rt-preview-fake-team.png`.
- **SEVERITY:** HIGH
- **CONFIDENCE:** CONFIRMED
- **EXPECTED BEHAVIOR:** Remove from the home grid. If kept, static wireframe, no numbers, working Close, Escape.
- **AFFECTED LAYERS:** UX, UI, Product
- **REPRODUCTION:** Preview → see 156 / 12 users → Escape → still trapped → Export Report → nothing.

### RT-014

- **STATUS:** RESOLVED
- **RESOLUTION:** Dead language/auto-backup/sound/geo controls removed. Theme, font size, animations, date format, clipboard, and local notification subtypes apply. Week-start is stored and shown; habit weekday chips still list Monday first.
- **AREA:** UX / Logic
- **TITLE:** Settings persist values that change nothing
- **WHAT IS WRONG:** Stored and unused: `fontSize`, `animations`, `accentColor`, `autoBackup` + frequency, `language` (English/Español/Français/Deutsch), `weekStartsOn`, `dateFormat`, `timezone` (in schema, **not even in the General UI**), notification subtypes, sound/volume, `dataCollection` / crash / analytics / location leftovers.
- **EVIDENCE:** `lib/domain/types.ts` 67–99; `components/settings-modal.tsx` 221–502; greps show consumers only for `theme` and `clipboardMonitor`.
- **REAL USER IMPACT:** “I set Español / large type / daily backup” and the app stays English / default / unbacked-up.
- **SEVERITY:** HIGH
- **CONFIDENCE:** CONFIRMED (theme **does** apply — that one is honest)
- **EXPECTED BEHAVIOR:** Remove or implement. Dead controls are defects.
- **AFFECTED LAYERS:** UX, Frontend
- **TEST THAT SHOULD EXIST:** Changing `language` changes a visible string **or** the control is absent.

### RT-015

- **STATUS:** RESOLVED
- **RESOLUTION:** First-visit permission wall removed. Mic is requested only when the user starts a voice note. Browser cold load: dashboard usable, no Grant Permissions modal.
- **AREA:** UX / Privacy
- **TITLE:** First visit blocks the app behind mic + notification permission
- **WHAT IS WRONG:** Custom modal (not a dialog) asks for microphone and notifications before a task exists. Grant calls `getUserMedia({ audio: true })` immediately. Copy still sells “task reminders.” Skip writes `manage-kar-permissions`. FAB can prompt again (`floating-toggle.tsx` `requestPermissions`).
- **EVIDENCE:** `app/page.tsx` 104–109, 747–788, 1037–1113; `rt-first-visit-permissions.png`.
- **SEVERITY:** HIGH
- **CONFIDENCE:** CONFIRMED
- **EXPECTED BEHAVIOR:** Ask at the moment of voice record or first reminder, not at boot.
- **AFFECTED LAYERS:** UX, Security
- **TEST THAT SHOULD EXIST:** Cold load with empty storage → dashboard usable without permission prompt.

### RT-016

- **STATUS:** RESOLVED
- **RESOLUTION:** Title/manifest/settings say local-first. Package name `manage-kar`. Backup `appVersion` is `0.2.0`. Fake Google verification removed.
- **AREA:** Product contradiction
- **TITLE:** Marketing and chrome still describe a “Smart” collaborative 1.0 OS
- **WHAT IS WRONG:** `document.title` / OG: “Smart Task & Life Management.” Manifest: “team collaboration features.” Settings footer: “Version 1.0.0” / “Built for productivity enthusiasts.” Backup serializer says `appVersion: "2.0.0"`. `package.json` name: `my-v0-project`. `metadata.verification.google` is `"google-site-verification-code"`. `generator: v0.app`.
- **EVIDENCE:** `app/layout.tsx` 19–61; `public/manifest.json`; `lib/store/workspace.ts` 304; `package.json` 2; `components/settings-modal.tsx` 515–517.
- **SEVERITY:** HIGH
- **CONFIDENCE:** CONFIRMED
- **EXPECTED BEHAVIOR:** Title/manifest/settings match README: local-first tasks/notes/habits, preview modules named.
- **AFFECTED LAYERS:** Growth, Trust
- **TEST THAT SHOULD EXIST:** Manifest description must not contain “team collaboration” until a team exists.

### RT-017

- **STATUS:** RESOLVED
- **RESOLUTION:** `next.config.mjs` no longer ignores TS/ESLint. `tsc --noEmit` is clean.
- **AREA:** Reliability / PWA
- **TITLE:** Production builds ignore TypeScript and ESLint errors
- **WHAT IS WRONG:** `next.config.mjs` sets `typescript.ignoreBuildErrors` and `eslint.ignoreDuringBuilds`.
- **EVIDENCE:** `next.config.mjs` 3–7.
- **SEVERITY:** HIGH
- **CONFIDENCE:** CONFIRMED
- **EXPECTED BEHAVIOR:** Fail the build on type/lint errors.
- **AFFECTED LAYERS:** Architecture, Reliability
- **TEST THAT SHOULD EXIST:** CI `tsc --noEmit` + lint required; config flags off.

### RT-018

- **STATUS:** RESOLVED
- **RESOLUTION:** Primary CTA is Add task. Preview gone. Tools sit on a secondary desktop row.
- **AREA:** UX / Frontend
- **TITLE:** Home grid presents eight equal actions; the real job is buried
- **WHAT IS WRONG:** Analytics, Time, Goals, Habits, Focus, Share, Preview, Workspace all same visual weight. Primary work (add a task) is a FAB or a third-row empty-state button. Search sits above empty views. First-time user must think.
- **EVIDENCE:** `app/page.tsx` 834–898; `rt-first-visit-permissions.png`; mobile `rt-mobile-390.png`.
- **SEVERITY:** HIGH
- **CONFIDENCE:** CONFIRMED
- **EXPECTED BEHAVIOR:** One primary CTA (Add task). Secondary: Notes, Habits. Preview/Time/Goals not on the home row until they work.
- **AFFECTED LAYERS:** UX, UI
- **TEST THAT SHOULD EXIST:** First-run screenshot review: a stranger can name the next click in <2s.

### RT-019

- **STATUS:** RESOLVED
- **RESOLUTION:** Profile, settings, FAB, complete/edit, and overview cards have accessible names. Snapshot: `button "Open settings"`, `button "Complete Persist after remediations"`.
- **AREA:** Accessibility / Frontend
- **TITLE:** Icon buttons have no accessible name; overview cards are not buttons
- **WHAT IS WRONG:** Profile, Settings, FAB, complete-toggle, edit, preview-close are `<Button>` with icons only and **no `aria-label`**. Overview stat cards are `<Card onClick>`.
- **EVIDENCE:** Playwright snapshot: `button [ref=f7e8]`, `button [ref=f7e12]`, `button [ref=f7e92]` with empty name; evaluate `aria: null`.
- **SEVERITY:** HIGH
- **CONFIDENCE:** CONFIRMED
- **EXPECTED BEHAVIOR:** Named controls; cards as `button` or `a`.
- **AFFECTED LAYERS:** Accessibility, Frontend
- **TEST THAT SHOULD EXIST:** axe / role snapshot: every button has a name.

### RT-020

- **STATUS:** RESOLVED
- **RESOLUTION:** Mobile 390 has a bottom nav (Home / Tasks / Notes / Habits). FAB is desktop-only. Add task stays in the header.
- **AREA:** UX / Mobile
- **TITLE:** Mobile 390px: chrome wins, FAB eats the last task, no bottom nav
- **WHAT IS WRONG:** Eight tiles wrap into a noisy grid. `pb-32` + fixed FAB overlaps content. Search + three nav pills + eight tiles before the list.
- **EVIDENCE:** `rt-mobile-390.png`.
- **SEVERITY:** HIGH
- **CONFIDENCE:** CONFIRMED
- **COMPETITOR COMPARISON:** Things 3 / TickTick mobile put Today + capture first ([Pikvue 2026](https://pikvue.com/todoist-vs-things-3-vs-ticktick-which-task-manager-actually-works/)).
- **EXPECTED BEHAVIOR:** Bottom nav (Home / Tasks / Notes / Habits); one FAB; hide Preview.
- **AFFECTED LAYERS:** UX, UI
- **REPRODUCTION:** 390×844 viewport.
- **TEST THAT SHOULD EXIST:** Visual/mobile snapshot; last list row not covered by FAB.

### RT-021

- **STATUS:** PARTIALLY RESOLVED
- **RESOLUTION:** Dashboard rewritten (~700 lines), Google/collab surfaces removed, domain types shared. FAB is still a large leftover file.
- **AREA:** Architecture / Frontend
- **TITLE:** Giant untestable surfaces
- **WHAT IS WRONG:** `app/page.tsx` 1117 lines; `floating-toggle.tsx` 1053; `collaboration-dashboard.tsx` 713; `google-integration.tsx` 651; `settings-modal.tsx` 526; `task-modal.tsx` 520. Duplicate `Task` interfaces instead of `lib/domain/types`.
- **EVIDENCE:** `wc -l`; local `interface Task` in share-modal, task-modal, floating-toggle.
- **SEVERITY:** HIGH
- **CONFIDENCE:** CONFIRMED
- **EXPECTED BEHAVIOR:** One domain type; journeys extractable; FAB not a second app.
- **AFFECTED LAYERS:** Architecture, Frontend
- **TEST THAT SHOULD EXIST:** Line-count budget in CI; no duplicate Task types.

### RT-022

- **STATUS:** RESOLVED
- **RESOLUTION:** Clipboard monitor default `enabled = false`. Clipboard text is not logged.
- **AREA:** Security / Privacy
- **TITLE:** Clipboard monitor polls every 2s and logs clipboard text
- **WHAT IS WRONG:** Default on the component is `enabled = true` (page passes settings, default off — footgun). When on: `setInterval(checkClipboard, 2000)`, `console.log` of first 50 chars.
- **EVIDENCE:** `components/clipboard-monitor.tsx` 23, 66–102.
- **SEVERITY:** HIGH
- **CONFIDENCE:** HIGH CONFIDENCE
- **EXPECTED BEHAVIOR:** User-gesture read; never log clipboard; default prop `false`.
- **AFFECTED LAYERS:** Security, Frontend
- **TEST THAT SHOULD EXIST:** `enabled` default false; no `console.log` of clipboard.

### RT-023

- **STATUS:** RESOLVED
- **RESOLUTION:** Delete confirms. Undo toast lasts 8 seconds via sonner.
- **AREA:** Logic / Frontend
- **TITLE:** Delete task/note/habit has no confirm; no undo
- **WHAT IS WRONG:** `handleDelete` calls `onDelete` immediately.
- **EVIDENCE:** `components/task-modal.tsx` 171–176; note-modal 63–64; habit-modal 108–109.
- **SEVERITY:** HIGH
- **CONFIDENCE:** CONFIRMED
- **EXPECTED BEHAVIOR:** Confirm + undo toast (5–10s).
- **AFFECTED LAYERS:** UX, Frontend
- **TEST THAT SHOULD EXIST:** Delete requires confirm; undo restores.

### RT-024

- **STATUS:** PARTIALLY RESOLVED
- **RESOLUTION:** Honest first-run empty state + Add task. No separate marketing site.
- **AREA:** Product / Growth
- **TITLE:** There is no landing, no activation story, no reason to return
- **WHAT IS WRONG:** `/` is the dashboard. No why-this, no sample (except fake goals), no retention loop (reminders don’t fire), no share-to-signup, no SEO page. Title still claims “Smart.”
- **EVIDENCE:** Only `app/page.tsx` + `app/shared/[data]/page.tsx`.
- **SEVERITY:** HIGH
- **CONFIDENCE:** CONFIRMED
- **COMPETITOR COMPARISON:** Every serious competitor has a marketing site and a 30-second capture loop ([TickTick](https://www.ticktick.com/?language=en_Us), [Super Productivity](https://super-productivity.com/)).
- **EXPECTED BEHAVIOR:** Honest landing **or** a ruthless in-app first-run: add one task that survives refresh. Hide the rest.
- **AFFECTED LAYERS:** Growth, UX
- **TEST THAT SHOULD EXIST:** First-run funnel metric (none exist today — RT-040).

---

## MEDIUM

### RT-025

- **STATUS:** RESOLVED
- **RESOLUTION:** `/icon.png`, `/icon-192.png`, `/icon-512.png`, `/apple-touch-icon.png`, `/favicon.ico` are present. `public/sw.js` caches those static assets. No stale JS/HTML cache.
- **AREA:** PWA
- **TITLE:** Manifest and layout advertise installable PWA assets that 404
- **EVIDENCE:** `curl` 404: `/icon-192.png`, `/icon-512.png`, `/apple-touch-icon.png`, `/favicon.ico`, `/screenshot-mobile.png`, `/screenshot-desktop.png`. Console: apple-touch-icon + deprecated `apple-mobile-web-app-capable`. `/icon.png` 200. No service worker.
- **SEVERITY:** MEDIUM
- **CONFIDENCE:** CONFIRMED
- **EXPECTED BEHAVIOR:** Real icons + SW, or drop PWA tags.
- **TEST THAT SHOULD EXIST:** `GET` icons 200 in CI.

### RT-026

- **STATUS:** RESOLVED
- **RESOLUTION:** Due dates are `YYYY-MM-DD`. Display uses settings date format. Test: `lib/dates/due-date.test.ts`.
- **AREA:** Logic
- **TITLE:** `dueDate` is a slogan (“Today”), not a date
- **EVIDENCE:** Default `"Today"` in `task-modal.tsx` 51; stored as string; never compared to `Date`. Overdue cannot exist.
- **SEVERITY:** MEDIUM
- **CONFIDENCE:** CONFIRMED
- **EXPECTED BEHAVIOR:** ISO date + display format from settings (once those settings work).

### RT-027

- **STATUS:** RESOLVED
- **RESOLUTION:** Fake `TEAM_MEMBERS` roster removed from the task modal.
- **AREA:** Product
- **TITLE:** @mention is a static fake roster
- **EVIDENCE:** `TEAM_MEMBERS` John/Sarah/Mike/Emily/David in `task-modal.tsx` 38–44. Description label: “Use @ to mention team members.” Typing `@john` did **not** populate `mentions`/`assignedTo` unless the dropdown is used.
- **SEVERITY:** MEDIUM
- **CONFIDENCE:** CONFIRMED
- **EXPECTED BEHAVIOR:** Remove mentions until there are people.

### RT-028

- **STATUS:** RESOLVED
- **RESOLUTION:** Empty title/name shows an inline error. Browser: “Add a title before saving.”
- **AREA:** UX
- **TITLE:** Empty required fields fail silently
- **EVIDENCE:** Create Task with empty title: modal stayed, no error (`handleSave` `if (!formData.title.trim()) return`). Same pattern on goals (`createGoal`).
- **SEVERITY:** MEDIUM
- **CONFIDENCE:** CONFIRMED
- **EXPECTED BEHAVIOR:** Inline error; disable submit.

### RT-029

- **STATUS:** RESOLVED
- **RESOLUTION:** Surface renamed to Counts. Types are `Task[]` / `Habit[]`.
- **AREA:** AI / Analytics
- **TITLE:** Analytics is a ratio wearing a Brain icon
- **EVIDENCE:** `components/analytics-dashboard.tsx` 19–55. Score = 50% task complete + 50% habits done today. Copy is more honest than the title “Analytics & Insights.”
- **SEVERITY:** MEDIUM
- **CONFIDENCE:** CONFIRMED
- **EXPECTED BEHAVIOR:** Call it “Counts” or add real history.

### RT-030

- **STATUS:** RESOLVED
- **RESOLUTION:** Profile no longer writes `manageKarUserProfile`.
- **AREA:** Architecture
- **TITLE:** Profile still dual-writes `manageKarUserProfile`
- **EVIDENCE:** `components/profile-modal.tsx` 47. Violates `docs/ARCHITECTURE.md` “UI may not write manageKar* as a second source of truth” (that doc named tasks/notes; profile still does it).
- **SEVERITY:** MEDIUM
- **CONFIDENCE:** CONFIRMED

### RT-031

- **STATUS:** RESOLVED
- **RESOLUTION:** `WORKSPACE_CHANGED_EVENT` lives only in `lib/store/workspace.ts`.
- **AREA:** Architecture
- **TITLE:** `WORKSPACE_CHANGED_EVENT` is defined twice
- **EVIDENCE:** `lib/domain/types.ts` 112; `lib/store/workspace.ts` 5. Same string, two modules.
- **SEVERITY:** MEDIUM
- **CONFIDENCE:** CONFIRMED

### RT-032

- **STATUS:** RESOLVED
- **RESOLUTION:** WhatsApp/email use `window.open` once. No `location.href` or delayed fallbacks.
- **AREA:** API / Share
- **TITLE:** WhatsApp share can navigate the app away and double-open fallbacks
- **EVIDENCE:** `components/share-modal.tsx` 120–171: `window.location.href` + 500ms + 2000ms fallbacks.
- **SEVERITY:** MEDIUM
- **CONFIDENCE:** HIGH CONFIDENCE

### RT-033

- **STATUS:** RESOLVED
- **RESOLUTION:** Focus interval depends on `isRunning`, remaining is derived from `startedAt`.
- **AREA:** Performance
- **TITLE:** Focus `useEffect` depends on `timeRemaining`, resetting the interval every second
- **EVIDENCE:** `components/focus-modal.tsx` 45–68.
- **SEVERITY:** MEDIUM
- **CONFIDENCE:** HIGH CONFIDENCE

### RT-034

- **STATUS:** RESOLVED
- **RESOLUTION:** Titles/names are trimmed on save.
- **AREA:** Frontend
- **TITLE:** Titles keep trailing whitespace; no max length
- **EVIDENCE:** Stored `"...whitespace   "` after create.
- **SEVERITY:** MEDIUM
- **CONFIDENCE:** CONFIRMED

### RT-035

- **STATUS:** RESOLVED
- **RESOLUTION:** Search covers tasks, notes, and habits. Habits have their own view.
- **AREA:** UX
- **TITLE:** Search does not search habits or goals; unused on Overview
- **EVIDENCE:** `app/page.tsx` 383–393, 929–937.
- **SEVERITY:** MEDIUM
- **CONFIDENCE:** CONFIRMED

### RT-036

- **STATUS:** RESOLVED
- **RESOLUTION:** Device-only event log (`managekar.events.v1`) records export/import/share/create/delete/errors. Settings → Privacy shows recent events. Nothing is sent off-device. No remote feature flags.
- **AREA:** Data / Analytics
- **TITLE:** No product analytics, no error reporting, no feature flags
- **EVIDENCE:** Settings has analytics/crash toggles that write booleans only. No events. Cannot answer “does export get used?”
- **SEVERITY:** MEDIUM
- **CONFIDENCE:** CONFIRMED

### RT-037

- **STATUS:** RESOLVED
- **RESOLUTION:** Unused Radix/cmdk/recharts/vaul/carousel/otp/day-picker/hook-form packages removed. Remaining UI primitives are the ones the app imports.
- **AREA:** Frontend
- **TITLE:** Dependency bloat vs used UI
- **EVIDENCE:** `package.json` includes accordion, menubar, carousel, cmdk, input-otp, recharts, vaul, etc. App uses a handful of Radix primitives + custom cards.
- **SEVERITY:** MEDIUM
- **CONFIDENCE:** HIGH CONFIDENCE

### RT-038

- **STATUS:** RESOLVED
- **RESOLUTION:** `allocateEntityId` uses a workspace-wide `nextEntityId` so tasks/notes/habits/goals/time/focus cannot reuse the same next id. Numeric IDs remain; they no longer collide across modules.
- **AREA:** Database
- **TITLE:** Numeric IDs + `Date.now()` IDs collide across modules
- **EVIDENCE:** Workspace uses `nextNumericId`; goals/time/focus use `Date.now()`. Two-tab create can reuse id 2 (we created id 2 then imported another id 2-shaped row as id 3 — lucky). Race on `nextNumericId(tasks)` from stale lists.
- **SEVERITY:** MEDIUM
- **CONFIDENCE:** HIGH CONFIDENCE

### RT-039

- **STATUS:** RESOLVED
- **RESOLUTION:** Avatar is an https URL field in the profile form. `javascript:` and `data:` are rejected. No `window.prompt`.
- **AREA:** Security
- **TITLE:** Avatar is a `prompt("Enter avatar URL")`
- **EVIDENCE:** `components/profile-modal.tsx` 58–63. Tracking pixels / `javascript:` depending on `AvatarImage`.
- **SEVERITY:** MEDIUM
- **CONFIDENCE:** HIGH CONFIDENCE

### RT-040

- **STATUS:** RESOLVED
- **RESOLUTION:** Settings no longer queries geolocation permission.
- **AREA:** UX
- **TITLE:** Settings queries geolocation permission for a product that does not use location
- **EVIDENCE:** `components/settings-modal.tsx` 54–57.
- **SEVERITY:** MEDIUM
- **CONFIDENCE:** CONFIRMED

### RT-041

- **STATUS:** RESOLVED
- **RESOLUTION:** Notes use `formatTimestamp` with the workspace date format.
- **AREA:** UX
- **TITLE:** Notes show raw ISO timestamps
- **EVIDENCE:** `app/page.tsx` 712 `{note.createdAt}`.
- **SEVERITY:** MEDIUM
- **CONFIDENCE:** HIGH CONFIDENCE

### RT-042

- **STATUS:** PARTIALLY RESOLVED
- **RESOLUTION:** Voice notes store recording seconds when the FAB records audio. Speech-to-text notes no longer invent a voice blob.
- **AREA:** Logic
- **TITLE:** Voice notes store `duration: 0` and empty `audioUrl` for speech-to-text
- **EVIDENCE:** `app/page.tsx` 323–359.
- **SEVERITY:** MEDIUM
- **CONFIDENCE:** HIGH CONFIDENCE

---

## LOW

### RT-043 — Greeting is always “Hello, User!” until profile edit (`defaultProfile`). **RESOLVED:** unnamed profiles see “Your workspace”.
### RT-044 — Console still prefixed `[v0]` across Google, share, permissions, clipboard. **RESOLVED:** `[v0]` logs removed.
### RT-045 — Share modal and page duplicate Task types instead of domain types.
### RT-046 — `styles/globals.css` unused (`docs/KNOWN_ISSUES.md`).
### RT-047 — Deprecated apple-mobile-web-app-capable meta (console warning).
### RT-048 — `metadataBase` and Twitter `@managekar` unverified.
### RT-049 — Select-mode checkboxes lack labels.
### RT-050 — Productivity score uses `any[]` in analytics props.
### RT-051 — Next.js Dev overlay present in the “product” (dev only; still what testers see).

---

## POLISH

### RT-052 — Gradient + scale-105 on every tile feels like a 2024 AI dashboard template.
### RT-053 — Mix of `modern-card`, `glass-card`, `glass-modal` class languages.
### RT-054 — Settings “Version 1.0.0” vs backup “2.0.0.”
### RT-055 — Share default method is WhatsApp, not the safer JSON export.

---

## Cross-agent challenge notes

| Finding | Challenger | Result |
| --- | --- | --- |
| RT-001 CRITICAL | Backend: “it’s labeled preview” | **Rejected.** Child UI + success alert + persisted `connected: true` outweigh the parent sentence. |
| RT-002 CRITICAL | PM: “single-user local app, two tabs rare” | **Kept CRITICAL.** Same-origin second window is normal. Loss is silent. |
| RT-006 HIGH not CRITICAL | Security: “user chose to share” | **Agreed HIGH.** Not auth bypass; it is a permanent public dump. |
| RT-008 HIGH | UX: “README says preview” | **Kept HIGH.** Home grid does not. Seed data contradicts D003. |
| Analytics as CRITICAL “fake AI” | AI critic | **Downgraded to MEDIUM.** Copy now says heuristics. Title still overclaims. |

---

## Historical owner items (not deleted)

`docs/PRODUCT_BACKLOG.md` P0 persist/export items are **RESOLVED** for tasks/notes/habits (verified leftover task “Persist after refresh” survived prior sessions). This audit does **not** remove that credit. It says the **product around that slice** is still unsafe to launch.
