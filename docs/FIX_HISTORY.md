# Fix history

## Workspace split-brain / data loss

- **Symptom:** Refresh restored seed tasks. Export downloaded empty arrays.
- **Root cause:** Dashboard used React state; FAB/settings used other localStorage keys; nothing hydrated the dashboard.
- **Fix:** `managekar.workspace.v1` + migrate-once from legacy keys + UI writes only through the store.
- **Verification:** Vitest round-trip, migrate, backup parse; browser add-task-then-reload.
- **Regression:** `lib/store/workspace.test.ts`

## Voice task ghost write

- **Symptom:** Notification said task saved; list unchanged.
- **Root cause:** `saveAsTask` wrote `manageKarTasks` only.
- **Fix:** `onCreateTaskFromVoice` persists into the workspace.
- **Verification:** Handler wired in `app/page.tsx`.
- **Related:** Voice note path also stopped dual-writing.

## Share unicode / size

- **Symptom:** `btoa` throws or URLs silently fail.
- **Root cause:** Byte API + unbounded JSON in the path.
- **Fix:** UTF-8 base64url codec with a token cap.
- **Verification:** `lib/share/codec.test.ts`

## Double permission wall

- **Symptom:** First visit stacked two full-screen permission modals.
- **Root cause:** Page modal plus FAB auto-prompt whenever the app was not installed as a PWA.
- **Fix:** FAB only asks when recording is denied. Page copy is optional.
- **Verification:** Browser session no longer opens the FAB prompt on load.

## FAB SSR crash

- **Symptom:** `window is not defined` on first render.
- **Root cause:** `useState({ x: window.innerWidth })`.
- **Fix:** Default `{0,0}`, set position in `useEffect`.

## Cross-tab overwrite / fake Google / dead modules

- **Symptom:** Second tab wiped work. Google “Connected” was theater. Goals/time/focus died on close.
- **Root cause:** Stale React persist; fake adapters; session-only modules.
- **Fix:** Storage-first `mutateWorkspace`, honest backup copy, persist goals/time/focus.
- **Regression:** `lib/store/workspace.test.ts`

## Remaining red-team leftovers

- **Symptom:** Share links were readable Base64. IDs collided across modules. Unused dependency pile. No local activity log. Avatar used `prompt()`.
- **Fix:** Password AES-GCM share tokens, workspace-wide `allocateEntityId`, pruned unused packages, device-only event log, https URL field, static service worker.
- **Regression:** `lib/share/secret.test.ts`, `lib/analytics/local-events.test.ts`, `lib/dates/week.test.ts`
