# Negative graph

Do not treat the findings as forty unrelated tickets. They hang from a small number of root defects.

```
ROOT DEFECT
     ↓
PRODUCT FAILURE
     ↓
USER FRICTION
     ↓
BUSINESS CONSEQUENCE
```

---

## Cluster 1 — Suite costume on a notebook core

**ROOT:** The UI still presents eight products (Home counts, Habits dash, Goals, Time, Focus, Share, Counts, FAB) around a three-entity workspace (tasks, notes, habits).

**FAILURES:**

- Mobile IA hides Share / Goals / Time / Focus / Counts (`hidden sm:grid`, FAB `hidden sm:block`). **PROVEN.**
- Counts “Weekly Progress” is lifetime completed/total, not a week. “Recommended Actions” are three static strings. Brain icon leftover. **PROVEN.**
- Goals persist but cannot be deleted, completed, or given milestones. Always `status: "active"`. **STRONG.**
- FAB (~944 lines) is a second app: speech, blob audio, a RAM focus timer that is not `activeFocus`. **STRONG.**
- Profile trophies are hardcoded. **STRONG.**

**FRICTION:** Zero-patience user clicks the wrong door. Mobile user never finds export. Skeptic sees “insights” and discounts the honest header.

**BUSINESS:** Positioning is “local notebook.” The chrome says “unfinished suite.” Competitor line 4 and 10 in `COMPETITOR_ATTACK_SCRIPT.md`.

**FIX THE ROOT:** One home (today + capture + habits). Everything else is a settings row or it is gone.

---

## Cluster 2 — Fields that look like a scheduler

**ROOT:** Domain objects store schedule-shaped data. The only mutation that matters is “toggle today / rewrite the JSON blob.”

**FAILURES:**

- `Habit` frequency / custom days unused by `toggleHabitOnDate`. **PROVEN.**
- `habit.reminderTime` unused by `dueReminders`. **PROVEN.**
- Task `reminders` only means “eligible for a Notification if the tab is open and the effect ran.” No clock. **STRONG.**
- `normalizeDueDate` maps unknown text to **today**. `"this week"` is `today + 3`, ignores `weekStartsOn`. **PROVEN.**
- Recurring complete *does* work (`completeRecurringTask`). That makes the dead habit schedule look worse: one engine is real, the other is a form.

**FRICTION:** “Why didn’t it remind me at 9?” “Why can I check this on an off day?”

**BUSINESS:** Trust in every toggle dies. Support cluster A.

**FIX THE ROOT:** Either a real local scheduler (and honest limits: tab must run, or a SW alarm) or delete the fields and the Notifications copy.

---

## Cluster 3 — One blob, last writer wins

**ROOT:** Canonical state is a single `localStorage` string. `saveWorkspace` replaces it. `storage` events reload the loser. Same-tab `persist()` does **not** call `notifyWorkspaceChanged()` (settings / profile / share import do). There is one `useWorkspace()` consumer, so same-tab React state hides the split. **STRONG.**

**FAILURES:**

- Two tabs: last full write wins. No merge, no conflict UI. **STRONG.**
- Dirty profile: raw `"Today"` dates and untrimmed titles stay on disk until the next persist. Memory is normalized. **PROVEN** on this device.
- `setItem` is unguarded. Quota throw has no user path. **SUSPECTED** (not reproduced).
- Voice `blob:` URLs are not in the blob. Refresh = silence. **STRONG.**
- `allocateEntityId` is safe even if `nextEntityId` is missing (`max(next, highest+1)`). Missing counter is **not** an ID-collision bug. Do not file it as one.

**FRICTION:** “My other window ate the task.” “The recording is gone.” “I never got a storage-full message.”

**BUSINESS:** Local-first without a durable media story or a two-tab story. Super Productivity already picked IndexedDB for this class of app ([SP persistence](https://deepwiki.com/johannesjo/super-productivity/5-data-persistence-and-synchronization)).

**FIX THE ROOT:** One write path + notify; warn on `storage` clash; persist bytes or drop voice; IndexedDB when the document or media outgrows `localStorage` — not as a vanity rewrite.

---

## Cluster 4 — PWA promises a product that is not cached

**ROOT:** `public/sw.js` cache-first on a short static list (`/`, icons, manifest). Fetch handler **never writes a fresher `/`**. `/shared/[data]` is not in the list.

**FAILURES:**

- Installed / offline user can get a **frozen first HTML** of `/` until `CACHE_NAME` changes. **STRONG.**
- Share import offline fails. **STRONG.**
- Icons work, so the user thinks the app is installed. **PROVEN** files exist.

**FRICTION:** Ticket 15–16.

**BUSINESS:** “Add to home screen” becomes a support incident, not retention.

**FIX THE ROOT:** Network-first for HTML, or delete the worker.

---

## Cluster 5 — Docs and share copy still describe a previous product

**ROOT:** Remediations changed runtime. Several documents and one live string did not.

**FAILURES:**

| Surface | Claim | Runtime | Confidence |
| --- | --- | --- | --- |
| `README.md` | Goals / time / focus not persisted | They persist | **PROVEN** |
| `docs/SECURITY_MODEL.md` | Share payload visible to anyone with the URL | New links are `enc1.` + password | **PROVEN** |
| `docs/PRODUCT_GRAPH.md` | Goals/time/focus not on the graph | Workspace fields | **PROVEN** |
| Unlocked `/shared/[data]` | “Anyone with this URL can read these tasks.” | After `enc1` unlock they needed a password | **PROVEN** in `app/shared/[data]/page.tsx` |
| WhatsApp share | Looks like “share via Manage.kar” | **Plaintext** task dump, not the encrypted URL | **PROVEN** in `share-modal.tsx` |

**FRICTION:** Security reviewers and users are gaslit in opposite directions (docs say too open; share page says too open *after* encryption).

**BUSINESS:** Honesty was the intended moat. The leftover sentences spend it.

**FIX THE ROOT:** One security paragraph, reused in README, SECURITY_MODEL, and the share page. WhatsApp labeled “sends titles in the chat,” not a backup.

---

## Cluster 6 — Capture and research are beginner-only forever

**ROOT:** Every create is a modal. Search/filter live in component state. No bulk except “select for share.” No keyboard map.

**FAILURES:**

- Extra click to add. **PROVEN.**
- Search lost on refresh. **STRONG.**
- Checklist saved, hidden on cards. **STRONG.**
- Power-user ceiling is the same as minute one.

**FRICTION:** Todoist/Things salesperson lines 5 and 7.

**BUSINESS:** Nobody “graduates” into the product. They graduate *out*.

---

## Feature-chain poison

```
Dirty / slogan due dates (upstream)
        ↓
isDueOnOrBefore / reminders / display normalize
        ↓
User thinks due is “today” while disk still says "Today"
        ↓
Export / share emit whatever is in memory after normalize
        ↓
Second device or file may not match what they thought they stored
```

```
Habit frequency UI (upstream)
        ↓
Streak treats every completed date as valid
        ↓
Counts “habit consistency” = done-today / count
        ↓
User stops believing numbers
```

```
Desktop-only Share (upstream)
        ↓
Mobile user never exports
        ↓
Clears site data
        ↓
Workspace gone
        ↓
Churn with no recovery
```

---

## Leverage order (fix these, not the tickets)

1. **Stop lying in fields and docs** (Cluster 2 + 5) — cheapest trust repair.  
2. **One product on phone and desktop** (Cluster 1) — stops the TickTick conversation.  
3. **PWA honesty** (Cluster 4) — stops install tickets.  
4. **Two-tab + voice + quota** (Cluster 3) — stops “data disappeared.”  
5. **Capture/search ceiling** (Cluster 6) — only after the product is one product.

Do not start with IndexedDB, calendar, or AI. Those are how Cluster 1 got here.
