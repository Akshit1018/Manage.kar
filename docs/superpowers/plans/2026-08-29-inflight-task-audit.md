# In-flight Manage.kar task audit

Measured on 2026-08-29 against workspace HEAD `cursor/unlazy-skill-e2f4` (branched from `cursor/hermes-site-theme-e2f4` `5411a88`). Unlazy bar: no completion claim without a command, file, or live process.

OPEN_PR_COUNT=20

LAZIEST GAPS FIRST — see [Laziest gaps](#laziest-gaps).

## Laziest gaps

These are the highest-cost incompletenesses. Everything else is stacked on top of them.

1. **`main` has never received product work.** `origin/main` is `4ad6170` — “Initial commit from local archive” (2026-08-16). OPEN_PR_COUNT=20 and **zero merges**. The whole stack is unshipped theater until #1 lands.

2. **No CI on any PR.** `gh pr list` returned `statusCheckRollup: []` for every open PR. Reviews: PR #19 and #20 have 0 reviews and 0 comments. “Looks merged / looks reviewed” is false.

3. **18 of 20 PRs are drafts.** Only PR #7 (mobile-first modals) and PR #8 (Flutter + API) are non-draft. The latest companion/theme work (#18–#20) is still draft.

4. **Public preview is not the latest branch.** Live tunnels:
   - `https://compliance-remove-favour-brother.trycloudflare.com` → `127.0.0.1:3005` hashed CSS has **no** `--mk-site` / `#0000f2` / `#edff45`. That production bundle is **NOT on latest branch** (`hermes-site-theme` tokens exist in current `app/globals.css`).
   - `https://symptoms-band-explanation-vincent.trycloudflare.com` → `127.0.0.1:3007` `next dev` **does** serve `--mk-site` (workspace files). Started 2026-08-29 04:21 for honest-companion, before `5411a88` (10:20). Dev HMR may have picked up theme files; it is not a sealed latest-branch preview.
   - `https://cancellation-this-puzzle-irrigation.trycloudflare.com` → `127.0.0.1:3010` `.next-prod` from 2026-08-27, **NOT on latest branch**.
   - `https://distinguished-columns-brand-insured.trycloudflare.com` → `127.0.0.1:4000` Flutter-web-on-API, not the Next companion.

5. **Docs lie about current code.** `docs/forensic/FEATURE_TRUTH_MAP.md` is frozen at `34ef512` (red-team fix). It still calls habit frequency unused, voice audio broken, goals undeletable, search not in URL. Current HEAD contradicts those four: `toggleHabitOnDate` calls `isHabitScheduledOn`, voice uses `idb:voice:`, `goal-manager.tsx` has `deleteGoal`, `lib/navigation/workspace-url.ts` parses `?view=`. `docs/QUALITY_SCORECARD.md` still says “14 unit tests” and “goals/time not in [the document]” — this HEAD just ran **47 files / 327 tests**. `.superpowers/sdd/progress.md` still says honest-companion Task 6 “in progress” after PR #19 exists. Plan checkboxes in `docs/superpowers/plans/2026-08-29-honest-companion.md` are all unchecked.

6. **Flutter presence still says `online`.** Web companion maps demo → “not paired” and paired → reachable/asleep/unreachable (`lib/dialer`). Flutter `apps/mobile/lib/src/screens/chats_screen.dart` still returns `"online"` for `active` and paints emerald. Honest-companion spec explicitly left Flutter out. That is a live product lie on the native client.

7. **Product spine is still local-only theater for Hermes.** No `@hermes/shared` package. Zero `WebSocket` / `:9119` / `/api/ws` in `*.ts`/`*.tsx`. Pairing completion is still `Simulate pairing (dev)` behind `#dev`/`?dev=1`. Android `MainActivity` is a bare `FlutterActivity`; manifest has `RECORD_AUDIO` but **no** `SYSTEM_ALERT_WINDOW`. Skills UI is read-only; no Plugins tab. Task status is `todo|doing|done`, not the 7-column Hermes kanban.

8. **Zombie servers.** At least eleven Next processes (`3000–3003, 3005–3007, 3010, 3021–3023`) plus API `:4000` and a Python `:5173` static server. Task-8 isolated builds (`.next-task8`, `.next-task8-fix`) are leftover. Easy to demo the wrong port.

9. **Stacked-PR risk is unmeasured.** 20-deep first-parent stack, 74 first-parent commits `main..HEAD`. No merge queue, no rebase check this session. `mergeable: MERGEABLE` from GitHub is not a conflict-free stack proof.

10. **Green-team / forensic “TESTED” labels are dated.** G020 reminders still PARTIAL (no push). Forensic maps were not re-run after editorial, companion, or site-theme slices.

## Skill install

| Item | Value |
| --- | --- |
| Canonical GitHub | https://github.com/Leonxlnx/unlazy |
| Documented install | `npx skills add Leonxlnx/unlazy` ([README](https://github.com/Leonxlnx/unlazy)) |
| Upstream pin | `da0b00a3a6b706b471797cd4ef579ae1001ff6d7` |
| Committed path | `.cursor/skills/unlazy/SKILL.md` |
| User path this VM | `/home/ubuntu/.cursor/skills/unlazy/SKILL.md` |
| CLI extra copies | `.agents/skills/unlazy`, `~/.agents/skills/unlazy` (gitignored) |
| Not used | Claude Stop hook (requires explicit consent) |

This audit followed unlazy solo mode: ledger first (`GATES.md`), then evidence, then report.

## Stacked pull requests

Status key: **slice** = did the branch implement its own claim; **shipped** = on `main`. None are shipped.

### PR #1 `cursor/product-foundation-e2f4` → `main` — slice **done**, shipped **no**

Local-first workspace, one JSON document. Draft. Tip `6432bf8`. Evidence: persist tests still in tree; backlog P0-1..P0-5 marked DONE. Lazy gap: nothing above this PR can ship until this draft merges.

### PR #2 `cursor/red-team-inspection-e2f4` — slice **done**, shipped **no**

Docs-only adversarial inspection. Tip `fcc6653`. Evidence: `docs/RED_TEAM_FINDINGS.md`, `docs/red-team/`. Lazy gap: frozen snapshot of `6432bf8`; later agents still treat it as current UI if they do not read the date.

### PR #3 `cursor/fix-red-team-findings-e2f4` — slice **done**, shipped **no**

Storage-first remediations. Tip `34ef512`. Evidence: workspace store + honest stubs. Lazy gap: forensic pack immediately after this commit is now the stale “truth map.”

### PR #4 `cursor/forensic-intelligence-e2f4` — slice **done** (as of 2026-08-23), shipped **no**

Tip `3b8d3b2`. Evidence: `docs/forensic/*`. **Stale relative to HEAD.** Do not use FEATURE_TRUTH as current classification.

### PR #5 `cursor/green-team-repair-e2f4` — slice **partial**, shipped **no**

Tip `af82f0e`. `docs/GREEN_TEAM_TASKS.md` marks G001–G019/G021–G024 VERIFIED; G020 PARTIAL (SW periodicsync, no push). Rejected: remote revoke, second-device sync, Google OAuth, TickTick clone. Evidence: file itself; `docs/KNOWN_LIMITATIONS.md` still lists reminder/push/share-revoke limits. Lazy gap: G010–G024 “IMPLEMENTED” rows do not all say TESTED.

### PR #6 `cursor/finish-remaining-e2f4` — slice **done** for client leftovers, shipped **no**

Tip `e9346e7`. Draft. Tightened merge/voice migrate. Did not invent a backend (correct).

### PR #7 `cursor/mobile-first-modals-e2f4` — slice **done**, shipped **no**

**Non-draft.** Tip `87886b7`. Keyboard-safe sheets, voice bowl, Escape vs select. Evidence: later editorial task reports reuse these overlay contracts.

### PR #8 `cursor/flutter-native-backend-e2f4` — slice **partial**, shipped **no**

**Non-draft.** Tip `90cf2fc`. Flutter client + `apps/api` PostgreSQL. Evidence: `apps/mobile/README.md`, API on `:4000` returned Flutter `index.html` (200). Lazy gaps: second product (account + Postgres) beside the localStorage PWA; no Android overlay; Flutter chats still say “online”; parity with web companion not claimed and not true.

### PR #9 `cursor/pwa-stop-loading-e2f4` — slice **done**, shipped **no**

Tip `a6816b8`. Stop blocking workspace behind Loading. D011 later restates the preloader must not hide the workspace. `preloaderBlocksWorkspace()` in current `lib/theme/hermes-tokens.ts` returns `false`.

### PR #10 `cursor/at-labels-e2f4` — slice **done**, shipped **no**

Tip `9d44d21`. @ place/tag/person labels. D006 records the 8-color palette.

### PR #11 `cursor/floating-orb-e2f4` — slice **done**, shipped **no**

Tip `9273de9`. In-app orb, long-press record. Not the Android system overlay.

### PR #12 `cursor/chat-dialer-e2f4` — slice **done** (UI), shipped **no**

Tip `006f128`. Composer dock, wheel, outbox. No socket. Outbox is local (`managekar.dialer.v1`).

### PR #13 `cursor/hermes-theme-e2f4` — slice **done**, shipped **no**

Tip `b244fdb`. Nous Blue / Hermes Teal default. Later #20 adds site brand marks on top.

### PR #14 `cursor/orb-radial-chats-e2f4` — slice **done**, shipped **no**

Tip `d4bbe49`. Record/Task/Note/Chats icons + decision record.

### PR #15 `cursor/chats-tab-e2f4` — slice **done**, shipped **no**

Tip `d62ce6f`. Fourth tab, URL hydrate, demo relabel. Still demo machines, no WS.

### PR #16 `cursor/ios-hermes-chats-e2f4` — slice **partial**, shipped **no**

Tip `b00c138`. Flutter Chats tab + skin picker + wipe clears outbox. Evidence: `apps/mobile/lib/src/screens/chats_screen.dart`, `test/widget_test.dart`. Lazy gap: presence word `online`; no pairing sheet parity with web D009.

### PR #17 `cursor/workspace-sections-e2f4` — slice **done** for local scaffold, shipped **no**

Tip `b50c14e`. Labels/pins/Ask chrome, 3-col board, pairing store, overview signals. D007–D009. Ask-my-notes still requires pairing + backend (DECISIONS Notes). Pairing QR labeled not real.

### PR #18 `cursor/editorial-mobile-ui-e2f4` — slice **done with recorded concerns**, shipped **no**

Tip `d3f6e77`. Draft. `.superpowers/sdd/progress.md` Tasks 1–8 complete; Task 8 `DONE_WITH_CONCERNS` (harness overlay false fail on left-snap while tray open). Evidence: `task-8-report.md` — 287 tests / 41 files at `b49dd0e`; isolated prod on 3021. Later HEAD has more tests (327). Plan checkboxes still empty.

### PR #19 `cursor/honest-companion-e2f4` — slice **done**, shipped **no**

Draft. 2 commits, 19 files, 0 reviews. Tip `76b8090`. Presence words, simulate pairing gated, Today-first Home, approval card contract with `approval={null}`. Spec: no socket, no plugins, no 7-col, no Flutter, no overlay. Lazy gaps: progress.md Task 6 still “in progress”; plan unchecked; Flutter not updated (intentional slice, leftover product).

### PR #20 `cursor/hermes-site-theme-e2f4` — slice **done** in git, preview **partial**, shipped **no**

Draft. 2 commits, 21 files, 0 reviews. Tip `5411a88`. `--mk-site-*` in `app/globals.css`; unit contract `lib/theme/hermes-tokens.test.ts`. Desktop nav from 1024px (D011). Lazy gap: production tunnel `:3005` CSS lacks site tokens — do not send that URL as “latest theme.”

### This branch `cursor/unlazy-skill-e2f4` — **in progress** (skill + audit only)

No product rewrite. Parent: #20.

## Docs ledger

| Doc | Role | Current honesty |
| --- | --- | --- |
| `docs/DECISIONS.md` | Locks D001–D011 | **Best current contract.** D004 no backend; D009 simulate pairing; D007 3 statuses until Hermes kanban; skills read-only; overlay is Android-future. |
| `docs/PRODUCT_BACKLOG.md` | P0–P4 | P0–P2 marked DONE; P3 IndexedDB/sync DISCOVERED; P4 career REJECTED. Does not list Hermes socket / overlay / Flutter parity. |
| `docs/GREEN_TEAM_TASKS.md` | G001–G024 | Useful history. G020 PARTIAL remains true. “TESTED” not re-run on HEAD. |
| `docs/KNOWN_LIMITATIONS.md` | Honest leftovers | Still accurate for SW reminders, share revoke, no sync, browser-only voice. |
| `docs/ABSENT_CAPABILITIES.md` | Pointer | Delegates to forensic copy — **stale**. |
| `docs/FEATURE_TRUTH_MAP.md` | Pointer | Delegates to forensic — **stale**. |
| `docs/forensic/FEATURE_TRUTH_MAP.md` | Inspection at `34ef512` | **Do not treat as HEAD.** Four contradictions listed in lazy gap 5. |
| `docs/QUALITY_SCORECARD.md` | Scores | **Stale numbers** (14 tests; goals/time “not in document”). |
| `docs/superpowers/plans/*` | Implementation plans | Editorial + honest-companion plans exist; checkboxes never ticked. |
| `docs/superpowers/specs/*` | Designs | Honest-companion spec is the clearest “what we refused.” |
| `.superpowers/sdd/progress.md` | SDD ledger | Editorial tasks complete; companion Task 6 line was stale. This session updated the file locally, but `.superpowers/sdd/.gitignore` is `*` so that edit is **not** in git. Treat the audit as the durable ledger. |

## Product leftovers

| Item | Status | Evidence |
| --- | --- | --- |
| Hermes socket (`/api/ws` :9119, `@hermes/shared`) | **not started** | `ls node_modules/@hermes` → none; ripgrep `WebSocket`/`9119` in ts/tsx → DECISIONS only |
| real pairing (QR/magic-link handshake) | **not started** (scaffold only) | `lib/pairing/developer.ts`; D009; simulate hidden unless `#dev`/`?dev=1` |
| Flutter parity | **partial** | Chats/theme/orb exist; presence `online`; no pairing gate; different store (Postgres vs localStorage) |
| Android overlay (`SYSTEM_ALERT_WINDOW`) | **not started** | `MainActivity.kt` is `FlutterActivity`; manifest has no overlay permission |
| Plugins tab | **rejected** (this product) | `components/skills-on-machine.tsx` “no plugin store”; `home-chrome.test.ts` asserts no plugin nav; DECISIONS: plugin is a **separate repo** later |
| 7-column kanban | **rejected** (this slice) | D007 `todo\|doing\|done`; honest-companion spec reject list; `task-modal.tsx` “no agent is assigned anything yet” |

Other leftovers still true: no push server, no remote share revoke, no second-device PWA sync, no Google Drive, no i18n toggle, no finance notification listener, no diarization VPS, no Live Activities.

## Live servers and previews

Measured with `ss`/`ps`/`curl` this session.

| Port | Process | Fingerprint | Latest branch? |
| --- | --- | --- | --- |
| 3000 | `next-server` dev | CSS contains `mk-site` / `#0000f2` | Source-current if HMR; unnamed tunnel |
| 3005 | hashed prod CSS | **no** site tokens | **NOT on latest branch** |
| 3007 | `next dev` + honest-companion tunnel | site tokens present | Maybe current files; tunnel started pre-`5411a88` |
| 3010 | `.next-prod` + pwa tunnel | no site tokens in HTML | **NOT on latest branch** |
| 3021/3023 | Task-8 isolated prod | editorial-era | **NOT on latest branch** |
| 4000 | `apps/api` + Flutter web | Flutter bootstrap HTML | Different app |
| 5173 | `python3 -m http.server` | static | not `flutter run` |

Do not tell a reviewer “the preview is latest” without naming **3007/3000** and rebuilding **3005**.

Vitest on this workspace (2026-08-29 10:35Z):

```text
Test Files  47 passed (47)
Tests       327 passed (327)
```

No Playwright re-run of the full editorial 216-surface suite this session. Task-8 report remains the last full viewport audit, on `b49dd0e`, not `5411a88`.

## Cloud agents

`cursor-cloud-list-cloud-agents` (first page): this run `Install unlazy, audit tasks` is RUNNING. `Hermes theme and features` is IDLE. Dozens of earlier review/fix agents are IDLE. No other RUNNING sibling on page 1. Message queue tool returned “legacy workflow” — no queued follow-ups readable.

## What later agents should do next (not done here)

Unlazy does not require a product rewrite for this request. Highest-leverage honest follow-ups:

1. Merge or rebase the stack onto `main` in order, or squash to a shippable trunk — otherwise every new slice is unreviewable.
2. Rebuild the public tunnel from `cursor/hermes-site-theme-e2f4` (or this branch) and kill stale `:3005`/`:3010`/Task-8 servers.
3. Refresh FEATURE_TRUTH / QUALITY_SCORECARD / progress.md against HEAD (this audit already names the contradictions).
4. Either bring Flutter presence words in line with web, or document native as a separate product with its own lies list.
5. Hermes socket + real pairing are new workstreams; do not mark chats “live.”

## Unlazy report

| Gate | Result |
| --- | --- |
| G1–G3 | Met only after `node scripts/verify-inflight-audit.mjs` prints `inflight audit verification passed` |
| Abandoned | none |

This document is an audit, not a ship certificate. The product is a deep unmerged stack with a local-first PWA that is honest about pairing in the latest web slice, a second Flutter/API app that is not, and no Hermes connection.
