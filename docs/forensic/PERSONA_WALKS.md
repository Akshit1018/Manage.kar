# Hostile persona walks

Each persona walks the **same** journeys: first 30 seconds, add task, habit, remind, backup, share, phone, return later. Zero praise.

---

### ZERO-PATIENCE (10–30s)

**Desktop 1280:** Header explains local-first. Add task is visible. Survives.  
**Hesitation:** Six equal tool tiles under the primary CTA. Counts / Goals / Time look like the product.  
**Phone 390:** Cleaner. Add task still there.  
**Failure:** If they tap Counts they get a score and “9–11 AM” advice. That is not capture.  
**Trust:** Neutral if they add a task. Down if they open Counts first.

### NON-TECHNICAL

**Confusion:** “Workspace,” “ciphertext,” “JSON,” “Device activity.”  
**Failure:** Settings Backup says use Data → Export — they must find another tab.  
**Share password:** They will reuse an email password or forget it. No recovery.  
**Habit “Custom Days”:** They will believe Monday-only. Code will not.

### POWER USER

**Missing:** `c` to capture, `q` search, `/today`, bulk snooze, NLP “tomorrow 2pm,” filters in the URL.  
**Unnecessary:** Modal for every create. FAB long-press for voice.  
**Duplicate:** Two focus UIs, two habit UIs.  
**Would leave for:** Todoist capture or Super Productivity timeboxing ([SP vs Todoist vs TickTick](https://super-productivity.com/blog/todoist-vs-ticktick-vs-super-productivity/)).

### MOBILE-ONLY

**Proven 390×844:** Bottom nav Home/Tasks/Notes/Habits. No Share, Goals, Time, Focus, Counts, FAB.  
**Can do:** Add task/note/habit from header. Settings.  
**Cannot do:** Encrypted link, export-from-Share, timers, counts. Backup only via Settings → Data (three steps, easy to miss).  
**Trust:** The product **looks** smaller on a phone than it is. They will think Share does not exist.

### SKEPTICAL

**Helps:** Honest Backup stub. No Connect button. Title no longer “Smart.” Clipboard off.  
**Hurts:** Counts Brain + recommended actions. Leftover `manageKarGoogleIntegration` JSON still on this profile (`connected: true`, Google sample sheet id) even though the UI ignores it — a forensic leftover from the fake client. If any future code reads it, theater returns.  
**Share:** “does not expire” is the honest sentence they needed.

### CHAOTIC

**Mistakes:** Empty title — now blocked. Delete — confirm + undo. Import — confirm. Clear — double confirm.  
**Still chaotic:** Search and view reset. Two-tab last-write-wins. Selecting the wrong JSON on import still replaces everything (after confirm). Lost share password.  
**Change mind:** Undo is 8s only, and not on goals/time/focus.

### LARGE-DATA

**Not browser-tested at 10k rows.** **SUSPECTED:** one JSON blob, full rewrite on every toggle, search is `Array.filter`, no virtualization.  
**Voice + backups + quarantine copies** compete for `localStorage` quota.  
**Would break:** Share URL size cap (6000). Encrypted tokens are larger than plaintext.

### RETURNING (this exact browser)

**Proven:** Three leftover tasks, including two copies of a red-team XSS title and slogan `dueDate: "Today"` in raw storage. Greeting “Your workspace.” No first-run empty state.  
**Forgotten context:** Counts will invent “weekly” progress from those three rows.  
**Failure:** They may think the app is a demo because of `<script>` titles still rendered (as text, not executed).

### ACCESSIBILITY

**Better than pre-remediation:** Profile/settings/FAB/complete/edit have names. Overview cards are buttons.  
**Still:** Custom share overlay (not Dialog). Select-mode exists. No skip link. Search is a placeholder-only field. Home nav icon is a bar chart. Focus order through glass modals **UNVERIFIED** with a screen reader. Font-size setting exists.

### BAD-NETWORK

**Helps:** After first JS load, CRUD is local.  
**Hurts:** First visit needs the Next bundle. SW does not make `/` a reliable offline app if chunks 404. Shared page needs the app JS to decrypt. WhatsApp/email need the OS.  
**Intermittent:** Sync is not a feature; they will not lose server writes. They can lose the tab mid-`setItem` — quarantine exists for corrupt JSON.

---

## Friction events per core journey (desktop)

| Journey | Minimum actions | Extra / lost |
| --- | ---: | --- |
| Add task | 2 clicks + type + save | Modal; no inline add |
| Complete task (overview) | 1 | |
| Export backup | 3 (Settings → Data → Export) | Backup tab does not export |
| Encrypted share | 4 + password | Hidden on mobile |
| Habit today (cold, mobile) | 2 (Habits → toggle) | Overview card does not toggle |
| Change theme | 3 | Works |

**Estimate:** ~3 extra friction events per backup; ~unlimited if the user hunts Share on a phone.
