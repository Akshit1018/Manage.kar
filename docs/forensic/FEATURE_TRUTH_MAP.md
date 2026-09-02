# Feature truth map

> **Dated inspection at `34ef512`.** Not HEAD. Live map:
> [`docs/FEATURE_TRUTH_MAP.md`](../FEATURE_TRUTH_MAP.md).

Inspected **after** remediations (`34ef512`). Do not trust README, screenshots, or modal titles.

**Classes:** REAL · PARTIAL · COSMETIC · MOCKED · BROKEN · HIDDEN · DEAD · DUPLICATE · MISLEADING · UNVERIFIED

**Confidence:** PROVEN (browser or unit) · STRONG (code path) · SUSPECTED · HYPOTHESIS

---

| Feature | Class | Confidence | What is actually true |
| --- | --- | --- | --- |
| Task create/edit/complete/delete | REAL | PROVEN | Persist + refresh. Empty title: “Add a title before saving.” Undo 8s. |
| Task due date | PARTIAL | PROVEN | New tasks use `YYYY-MM-DD`. This device’s **raw** `localStorage` still stores `"Today"` on three older rows; UI displays `2026-08-23` after `normalizeDueDate`. Dirty bytes stay until the next persist. |
| Task title trim | PARTIAL | PROVEN | New saves trim. Older rows still contain `"whitespace   "` in storage. |
| Task checklist | PARTIAL | STRONG | Saved in modal. Not shown on cards. |
| Recurring complete | REAL | STRONG | `completeRecurringTask` creates the next due date. Unit-tested. |
| Reminders | PARTIAL / MISLEADING | STRONG | Switch persists. `useLocalReminders` re-runs on **workspace changes** while the tab is open (`workspace` is a hook dependency). There is no clock, no midnight rollover, no `reminderTime`. A due task created in this tab can notify immediately; a due task that becomes due while the document is idle will not. |
| Notes | REAL | STRONG | Persist. Listen uses `speechSynthesis` in the modal. |
| Voice note audio | BROKEN | STRONG | `audioUrl = URL.createObjectURL(blob)` dies after refresh. Text can remain. |
| Speech-to-text | PARTIAL / HIDDEN | STRONG | Desktop FAB only (`hidden sm:block`). Browser Speech API. |
| Habits today + streak | REAL | STRONG | History keyed by local date; streak derived. |
| Habit frequency / custom days | MISLEADING | STRONG | UI collects days. `toggleHabitOnDate` never reads them. |
| Habit goal/unit | COSMETIC | STRONG | Stored, not measured. |
| Goals | PARTIAL | PROVEN | Live empty state: “No goals yet. Create one and it will stay on this device.” No 2024 seed. No delete. No milestone create. Always `status: "active"`. |
| Time tracker | REAL | STRONG | Entries in workspace. README still says not persisted — **doc is false**. |
| Focus modal | REAL | STRONG | `activeFocus` persisted. |
| Focus in FAB | DUPLICATE / COSMETIC | STRONG | Separate RAM timer. |
| Search | REAL | PROVEN | Filters tasks/notes/habits. Not in URL. Lost on refresh. |
| Share export JSON | REAL | PROVEN | Default primary action **Export Tasks**. |
| Share encrypted link | REAL | PROVEN | Copy: password-protected, no expiry. AES-GCM `enc1.`. |
| WhatsApp / email share | REAL | STRONG | `window.open` handoff. Not an integration. |
| Share import | REAL | STRONG | Confirm + hash idempotency + `router.push("/")`. |
| Theme / font / animations / date format | REAL | STRONG | `applyAppearance`. |
| Week starts on | PARTIAL | STRONG | Reorders habit weekday chips only. |
| Notifications settings | PARTIAL | STRONG | Toggles persist. Delivery is tab-open + workspace-effect, not a scheduler. |
| Clipboard monitor | REAL | STRONG | Default off. 2s poll when on. |
| Profile + https avatar field | REAL | PROVEN | Heading is **Your workspace** until name ≠ User. No `prompt()`. |
| Profile achievements | COSMETIC | STRONG | Three hardcoded badges. |
| Counts dashboard | MISLEADING | STRONG | Honest subtitle. “Weekly Progress” is not a week. “Recommended Actions” are three static strings (`analytics-dashboard.tsx` 233–244). Productivity score is a ratio. |
| Google backup | REAL (honest stub) | PROVEN | Settings → Backup: **No cloud backup yet.** No Connect. Leftover key `manageKarGoogleIntegration` still on this device from an older build; **current UI does not read it**. |
| PWA icons | REAL | STRONG | Files present. |
| Service worker | PARTIAL | STRONG | Caches `/` + icons + manifest. Not a full offline shell. |
| Local activity log | REAL | PROVEN | Privacy → Device activity. This session: “No local events yet.” |
| Mobile bottom nav | REAL | PROVEN | Home / Tasks / Notes / Habits at 390×844. |
| Desktop tools (Goals, Time, Focus, Share, Counts, Habits dash) | HIDDEN (mobile) | PROVEN | Absent from 390 snapshot. `hidden sm:grid`. |
| FAB | HIDDEN (mobile) / DUPLICATE (desktop) | PROVEN | Present at 1280; gone at 390. |
| First-run empty state | REAL | STRONG | Honest “no cloud backup” copy. This browser was not first-run (3 leftover tasks). |
| Collaboration / team preview | DEAD | STRONG | File deleted. |
| `text-to-speech.tsx` | DEAD | STRONG | No imports. |
| `theme-provider.tsx` | DEAD | STRONG | Not in `layout.tsx`. |
| `styles/globals.css` | DEAD | STRONG | Unused. |
| Marketing “Smart 1.0 team OS” | DEAD in current JS | PROVEN | Current tab title is local-first. Stale Playwright tabs from earlier in the same browser still showed “Smart Task & Life Management” until reload — old bundle, not current code. |
| Product analytics (remote) | ABSENT | STRONG | Device log is not a product funnel. |
| Auth / sync / AI | ABSENT | STRONG | No code. |

## README / docs vs code (contradiction hunter)

| Document | Claim | Code / browser |
| --- | --- | --- |
| `README.md` | Goals / time / focus “not persisted yet” | They persist. |
| `docs/SECURITY_MODEL.md` | Share payload visible to anyone with the URL | New links are ciphertext + password. Old plaintext tokens still decode. |
| `docs/PRODUCT_GRAPH.md` | Goals/time/focus “not on the graph” | They are workspace fields. |
| `docs/ARCHITECTURE.md` | Mock Google/team must be labeled preview | Google is a stub. Team UI is gone. |
| `docs/RED_TEAM_*` | Frozen inspection of `6432bf8` | Still useful as history. Do not treat as current UI. |

## We have this — why?

| Module | Verdict | Reason |
| --- | --- | --- |
| Workspace store | KEEP | The product. |
| Tasks / notes / habits | KEEP | Primary job. |
| Encrypted share + export | KEEP | Only backup/handoff story. |
| Honest Google stub | KEEP | Stops a worse lie. |
| Theme / date format | KEEP | Visible, works. |
| Local events | KEEP | Answers “did export run?” on-device. |
| Goals | SIMPLIFY or HIDE | Half a module. |
| Time tracker | KEEP or HIDE | Works; competes with Focus. |
| Focus modal | KEEP | One focus surface. |
| FAB | REDESIGN or REMOVE | Second app; desktop-only; blob voice; duplicate focus. |
| Habit dashboard | MERGE | Duplicates Habits tab. |
| Counts | SIMPLIFY | Cut score / weekly / recommendations. |
| Profile achievements | REMOVE | Theater. |
| Dead TTS / theme-provider / unused CSS | REMOVE | Cost with no path. |
