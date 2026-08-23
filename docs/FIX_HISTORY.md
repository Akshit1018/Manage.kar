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

## FAB SSR crash

- **Symptom:** `window is not defined` on first render.
- **Root cause:** `useState({ x: window.innerWidth })`.
- **Fix:** Default `{0,0}`, set position in `useEffect`.
