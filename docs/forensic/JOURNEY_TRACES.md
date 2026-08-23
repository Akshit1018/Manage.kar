# Journey traces (reconstruction)

No criticism in this file except where a hop in the chain is **absent**. Absence is a fact, not a roast.

Runtime: Next.js 15 App Router, one client page (`app/page.tsx`), one share page (`app/shared/[data]/page.tsx`). No `app/api`. No auth. No server database. Canonical store: `localStorage` key `managekar.workspace.v1`.

```
USER → SCREEN → ACTION → FRONTEND STATE → API → DOMAIN → STORAGE → RESULT → UI → NEXT
```

API is **none** on every journey unless noted.

---

## 1. Cold load / returning device

**USER** opens `/`  
**SCREEN** `app/loading.tsx` then `Dashboard` in `app/page.tsx`  
**ACTION** mount  
**FRONTEND** `useWorkspace().reload()` (`hydrated` starts false)  
**DOMAIN** `migrateLegacyWorkspace` → `inspectWorkspace` → `applyAppearance`  
**STORAGE** read `managekar.workspace.v1`; optional one-way read of leftover `manageKar*` keys  
**RESULT** in-memory `Workspace`; status `empty` / `ok` / `corrupt`  
**UI** “Loading your workspace…” then header. Live 2026-08-23: title `Manage.kar — local tasks, notes, and habits`; heading **Your workspace**.  
**NEXT** create / search / settings  

**Absent hops:** server session, account, cloud hydrate.

---

## 2. Create / edit / complete / delete a task

**USER** Add task → `TaskModal`  
**ACTION** save / toggle / delete  
**FRONTEND** `handleSaveTask` / `handleTaskToggle` / `handleDeleteTask`  
**DOMAIN** `allocateEntityId`, `normalizeDueDate`, `completeRecurringTask`  
**STORAGE** `mutateWorkspace` → rewrite the whole JSON document  
**RESULT** list updates; delete shows an 8s undo toast; create records `task_created` in `managekar.events.v1`  
**NEXT** complete, edit, share  

Live: empty title stays on **Create Task** with “Add a title before saving.” Due date control is `type=date` defaulting to `2026-08-23`.

**Absent hops:** push scheduler, server id, per-task reminder clock.

---

## 3. Notes (typed and voice)

**USER** Note button or desktop FAB  
**ACTION** save text, or long-press FAB for speech / `MediaRecorder`  
**DOMAIN** `handleSaveNote` / `handleVoiceNote` / `handleSpeechToText`  
**STORAGE** note row; voice stores `URL.createObjectURL(blob)` as `audioUrl`  
**NEXT** edit / Listen (`speechSynthesis` in `note-modal.tsx`, not `text-to-speech.tsx`)

**Absent hops:** durable audio bytes, cloud STT. FAB path is `hidden sm:block`.

---

## 4. Habits

**USER** Habit button or Habits tab or desktop Habit Dashboard  
**ACTION** save / toggle today  
**DOMAIN** `toggleHabitOnDate` + `hydrateHabit` + `computeStreak` (`lib/habits/streak.ts`)  
**STORAGE** `habits[].history[{date, completed}]`  
**NEXT** streak display  

**Absent hops:** `frequency` / `customDays` / `goal` / `reminderTime` are stored and **not** consulted by `toggleHabitOnDate`.

---

## 5. Goals / time / focus

**USER** desktop tool row (not on 390px)  
**ACTION** create goal, start timer, start focus  
**DOMAIN** `GoalManager` / `TimeTracker` / `FocusModal` call `persist`  
**STORAGE** `goals`, `timeEntries`, `focusSessions`, `activeFocus`  
**NEXT** close modal, reopen — data is still in the workspace document  

**Absent hops:** goal delete UI, milestone create UI, status change. FAB has a **second** focus timer in component state only.

---

## 6. Settings (theme, backup, privacy, clear)

**USER** Open settings  
**ACTION** change theme / export / import / clear / clipboard toggle  
**DOMAIN** `updateSettings` → `replaceWorkspace` + `notifyWorkspaceChanged`; export `serializeBackup`; import `parseBackup`  
**STORAGE** same workspace key; events key for activity  
**UI** Backup copy live: **No cloud backup yet.** Privacy: **Device activity** / “No local events yet.” on this returning profile.

**Absent hops:** remote backup adapter.

---

## 7. Share and import

**USER** Share (desktop) or Select on Tasks  
**ACTION** Export JSON (default) or password-protected link or WhatsApp/email handoff  
**DOMAIN** `encodeEncryptedSharePayload` (AES-GCM, `enc1.`) or `exportTasksAsJSON`  
**API** none; `wa.me` / `mailto:` are user-triggered navigations  
**STORAGE** none for the link (ciphertext is the URL); import writes tasks + `importedShareHashes`  
**UI** live: “Link sharing is password-protected… does not expire.” Primary button **Export Tasks**.

**Absent hops:** revoke, expiry, hosted file.

---

## 8. Profile

**USER** Open profile  
**ACTION** edit name / https avatar URL  
**DOMAIN** `sanitizeAvatarUrl`  
**STORAGE** `workspace.profile` via `replaceWorkspace`  
**UI** greeting becomes `Hello, {name}` only after name ≠ `"User"`  

---

## 9. Clipboard suggestions

**USER** enables Settings → Privacy → Clipboard suggestions  
**ACTION** 2s poll of `navigator.clipboard.readText()`  
**DOMAIN** `handleClipboardTask` / `handleClipboardNote`  
**STORAGE** new task/note rows  

Default is off.

---

## 10. Search + navigation

**USER** types in search; taps Home/Tasks/Notes/Habits or desktop tiles  
**FRONTEND** `searchQuery`, `currentView` React state  
**STORAGE** none for view/search  
**RESULT** filter current lists  

**Absent hops:** URL, saved views.

---

## 11. Corrupt workspace

**USER** damaged JSON in the canonical key  
**DOMAIN** `inspectWorkspace` copies bytes to `managekar.workspace.v1.corrupt.<ts>`  
**STORAGE** canonical key **not** overwritten by `mutateWorkspace` until Reset  
**UI** banner + Reset workspace  

---

## 12. Second tab

**TAB A** `persist` writes the full document  
**TAB B** `window` `storage` event on `managekar.workspace.v1` → `reload()`  
**RESULT** Tab B shows Tab A’s document  

**Absent hops:** field-level merge, conflict UI. Two simultaneous persists are last-write-wins.

---

## Systems that do not exist in this repository

| System | Status |
| --- | --- |
| HTTP API / controllers | Absent |
| Auth / authorization | Absent |
| Server DB / migrations | Absent |
| Queues / workers / cron | Absent |
| AI / prompts / agents | Absent (`Brain` icon is CSS) |
| MCP inside the product | Absent |
| Feature flags | Absent |
| Remote analytics | Absent (device log only) |
| Deploy / CI config | Absent in repo |
| `collaboration-dashboard.tsx` | Deleted |
