# Competitor attack script

A salesperson for a real alternative talking to a Manage.kar user. Every line below is something they can say **without lying**, given the 2026-08-23 source + live session and public competitor facts.

If a line cannot be said truthfully, it is not here.

**How to use this file:** each line is a gap. Classification is for *this* local-first product, not a demand to clone a suite.

---

## TickTick salesperson

**Target user:** someone who wanted “tasks + habits + a timer” and opened Manage.kar because the homepage *looks* like a suite.

1. “Your habit days and reminder clock are stored, but they do not control anything. You can complete a Monday-only habit on Tuesday. We actually schedule habits.”  
   **Us:** `toggleHabitOnDate` ignores frequency. `habit.reminderTime` is unread. **PROVEN** in source.  
   **Them:** TickTick ships tasks, habits, Pomodoro, and a calendar in one product, including on cheaper plans ([StackCompare 2026](https://stackcompare.net/todoist-vs-ticktick-vs-things-3-2026-personal-task-manager-pricing-compared/), [Calmevo TickTick review](https://calmevo.com/ticktick-review/)).  
   **Class:** MUST HAVE if the fields stay; otherwise REMOVE the fields.

2. “Reminders on your phone fire when you are not staring at the tab. Yours only notify if that browser tab is open and the workspace document just changed.”  
   **Us:** `useLocalReminders` is a React effect. No Service Worker notification trigger. **STRONG.**  
   **Them:** Free-tier reminders are a stated TickTick / Things advantage; some Todoist reminders sit behind Pro ([StackCompare 2026](https://stackcompare.net/todoist-vs-ticktick-vs-things-3-2026-personal-task-manager-pricing-compared/)).  
   **Class:** MUST HAVE if the Notifications switch stays labeled as reminders.

3. “On a phone you cannot share, run focus, log time, or open Counts. Those doors are `hidden sm:grid`. We did not ship a second, smaller product.”  
   **Us:** live 390×844 snapshot. **PROVEN.**  
   **Class:** MUST HAVE or HIDE the desktop chrome.

4. “Home is four count tiles, not today. People switch to us for a calendar / today view, not another score.”  
   **Us:** overview is counts + tools. No agenda. **PROVEN.**  
   **Them:** calendar / time-block is a documented reason people pick TickTick over Things/Todoist ([Pikvue 2026](https://pikvue.com/todoist-vs-things-3-vs-ticktick-which-task-manager-actually-works/)).  
   **Class:** EXPECTED (today list). Calendar is NICE, not the first hole.

5. “Capture is a modal. Power users live in quick-add and natural language. You have neither.”  
   **Us:** Add task → `TaskModal`. No keyboard capture. **PROVEN.**  
   **Them:** capture speed is how these apps compete ([The Tool Chief 2026](https://thetoolchief.com/best-of/best-task-management-apps/)).  
   **Class:** EXPECTED.

## Todoist salesperson

6. “Due dates you type as slogans become today. `normalizeDueDate` maps unknown strings to `localDateKey(now)`. We parse language into a real date.”  
   **Us:** `lib/dates/due-date.ts` default branch. **PROVEN** in source. Dirty profile still has raw `"Today"` bytes.  
   **Class:** EXPECTED if free-text dates exist; new UI uses `<input type="date">` so this is mostly **legacy + import**.

7. “Search dies when you refresh. Filters are React state, not the URL. Comparing two tasks means retyping.”  
   **Us:** `searchQuery` in `app/page.tsx`. **STRONG.**  
   **Class:** EXPECTED.

8. “There is no project, label, filter, or integration. If your work already lives in Gmail or a calendar, we meet you there.”  
   **Us:** no integrations. Honest. **PROVEN.**  
   **Class:** IRRELEVANT for a one-browser notebook; EXPECTED the moment the user has more than a grocery list.

## Things 3 salesperson (Apple-only user)

9. “We sold you a one-time app whose job is capture and today. You got a web dashboard that still asks you to find Share on desktop.”  
   **Them:** Things 3 is Apple, paid once, judged on capture polish ([The Tool Chief 2026](https://thetoolchief.com/best-of/best-task-management-apps/)).  
   **Us:** web + PWA icons; mobile IA incomplete. **STRONG.**  
   **Class:** NICE to copy *priority*, not the HIG costume.

## Super Productivity salesperson (the fatal one)

This is the conversation that should scare a founder more than TickTick.

10. “You built a local-first tasks + notes + time + focus app in 2026. We have been MIT, local-first, IndexedDB, with *optional* encrypted Dropbox/WebDAV, since 2016.”  
    **Them:** [Super Productivity GitHub](https://github.com/johannesjo/super-productivity), [site](https://super-productivity.com/), [about](https://super-productivity.com/about/), [persistence write-up](https://deepwiki.com/johannesjo/super-productivity/5-data-persistence-and-synchronization), [their own compare](https://super-productivity.com/blog/todoist-vs-ticktick-vs-super-productivity/).  
    **Us:** one `localStorage` JSON document; export file; passworded URL. **PROVEN.**  
    **Class:** FOUNDATION later (IndexedDB) — **not** “rewrite in Angular this week.” See third pass.

11. “Your time tracker and focus timer are hidden on a phone. Ours are first-class. You also have a second focus timer in the FAB that does not write the same records.”  
    **Us:** `hidden sm:grid`; FAB timer is RAM. **PROVEN / STRONG.**  
    **Class:** MERGE or HIDE.

12. “Install to home screen. Go offline. `/` may be a **frozen first cache** (`sw.js` is cache-first and never writes a new `/`). `/shared/...` is not in the cache list at all.”  
    **Us:** `public/sw.js`. **STRONG.**  
    **Class:** MUST HAVE if PWA stays; otherwise delete the worker.

## Cairn / other local-first

13. “If you wanted zero-cloud life OS, Cairn already uses Dexie/IndexedDB and ULID. You used incrementing integers in one blob.”  
    **Them:** [Artaeon/cairn](https://github.com/Artaeon/cairn). Do not confuse with the unrelated Electron `ddutchie/cairn`.  
    **Us:** `allocateEntityId`. **PROVEN.**  
    **Class:** NICE until voice blobs or tens of thousands of rows exist.

## Lines a competitor must **not** say (they would be false)

- “They fake Google Connect.” — **False after remediations.** Backup copy is “No cloud backup yet.” Leftover `manageKarGoogleIntegration` is unread by current UI.  
- “Goals / time / focus are fake and vanish on refresh.” — **False.** They persist. README still *claims* they do not; that is our docs lying, not the runtime.  
- “Share links are world-readable plaintext.” — **False for new links** (`enc1.` + password). Old plaintext tokens still decode. `SECURITY_MODEL.md` is the document that is stale.  
- “The product has no export.” — **False.** Export is the default Share action.  
- “Titles execute as HTML.” — **False in the live session.** XSS-looking titles rendered as text.

## Investor dismissal (same facts, different mouth)

Not fundraising advice. What a skeptic can say and be right:

- “Why isn’t this a Super Productivity skin or a Things clone?” — because the remaining chrome (Counts recommendations, FAB, Goals without delete) is **not** a moat. **STRONG.**  
- “What accumulates?” — habit history and a JSON file. Not a network, not a model, not a second-device graph. **PROVEN.**  
- “Why will they pay?” — there is no paywall and no server cost. There is also **no lock-in except inconvenience** (export exists; sync does not). **STRONG.**  
- “What is technically defensible?” — honesty about local-first. Honesty is copy, not a barrier. **HYPOTHESIS** that honesty retains a niche.

## Ranked persuasion (what actually moves a user)

| Rank | Line | How often it hits | Our honest reply today |
| --- | ---: | --- | --- |
| 1 | Phone is a different, smaller product | Every mobile session | Hide desktop tools or ship them |
| 2 | Reminder switch does not keep time | Anyone who trusts the switch | Remove the switch or add a clock |
| 3 | Habit days are costume | Anyone who set custom days | Enforce or remove |
| 4 | SP already is the local-first suite | Engineer / privacy buyer | Stop suite theater; be a notebook |
| 5 | No today / calendar | Anyone from TickTick | Today list first |
| 6 | Two tabs last-write-wins | Power users with two windows | Merge or warn |
| 7 | Voice audio dies | Anyone who recorded | Remove or persist bytes |

Sources:
- [Todoist vs TickTick vs Things 3 2026 pricing compared](https://stackcompare.net/todoist-vs-ticktick-vs-things-3-2026-personal-task-manager-pricing-compared/) (2026)
- [Which task manager actually works](https://pikvue.com/todoist-vs-things-3-vs-ticktick-which-task-manager-actually-works/) (2026)
- [Best task management apps](https://thetoolchief.com/best-of/best-task-management-apps/) (2026)
- [TickTick review](https://calmevo.com/ticktick-review/) (2026)
- [Super Productivity](https://github.com/johannesjo/super-productivity)
- [Super Productivity site](https://super-productivity.com/)
- [Super Productivity about](https://super-productivity.com/about/)
- [SP persistence](https://deepwiki.com/johannesjo/super-productivity/5-data-persistence-and-synchronization)
- [Todoist vs TickTick vs Super Productivity](https://super-productivity.com/blog/todoist-vs-ticktick-vs-super-productivity/)
- [Cairn (Artaeon)](https://github.com/Artaeon/cairn)
