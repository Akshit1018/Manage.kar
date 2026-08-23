# Competitor gaps

Research date: 2026-08-23.  
CLIs: `parallel-cli` missing; Firecrawl unauthenticated.  
Sources: official sites and 2026 comparison articles cited inline.  
Do not invent capabilities.

## Who we compared

| Competitor | Why they matter |
| --- | --- |
| [TickTick](https://www.ticktick.com/?language=en_Us) | Same *shape*: tasks + habits + Pomo + calendar. Generous free tier. |
| [Todoist](https://www.todoist.com) | Default “serious list” users already have. Natural language, sync. |
| [Things 3](https://culturedcode.com/things/) | Quality bar for personal tasks (Apple-only, paid). |
| [Super Productivity](https://super-productivity.com/) | Honest local-first alternative; no account. |
| Open-source / GitHub | [Cairn](https://github.com/Artaeon/cairn), [Baajit](https://github.com/kaafihai/baajit), [DayCraft](https://github.com/1saptarshi/DayCraft), [Level Up](https://github.com/yokutech/level-up), [TaskFlow](https://github.com/MS33834/taskflow); plus offlog/aven from owner `RESEARCH_LOG.md`. |

## Capability matrix

States: MISSING / WEAK / PARTIAL / COMPARABLE / BETTER.

| Capability | Manage.kar | TickTick | Todoist | Super Productivity | Gap | User impact | Build? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Capture a task that survives refresh | PARTIAL (works) | COMPARABLE | COMPARABLE | COMPARABLE | Quality, not existence | Low if they find Add Task | Already the one win |
| Real dates / overdue | MISSING | BETTER | BETTER | BETTER | “Today” string | Missed work | YES |
| Recurring that instantiates | MISSING (stored only) | BETTER | BETTER | BETTER | Trust | Bills don’t repeat | YES or hide |
| Reminders that fire | MISSING | BETTER (free, 2/task) | BETTER (often Pro) | BETTER (local) | Trust | “Why didn’t it ping?” | YES or hide |
| Habits with day boundary + heatmap | WEAK | BETTER (5 free / 299 premium) | MISSING | PARTIAL (habits mentioned on GH topics) | Streak lies | Give up habits | YES if habits stay |
| Calendar / time-block | MISSING | BETTER | PARTIAL (Pro) | BETTER | Can’t plan a day | High vs TickTick | Only if focus is planning |
| Pomodoro that persists | WEAK (ephemeral + 5-tap lock) | BETTER | MISSING | BETTER | Session lost | High for “Focus” tile | Persist or hide |
| Time tracking | WEAK (RAM only) | WEAK/PARTIAL (Pomo stats) | MISSING | BETTER (native) | SP wins local-first | High vs SP | Persist or hide |
| Notes | PARTIAL | PARTIAL | PARTIAL | PARTIAL | Ours die voice blobs | Medium | IndexedDB later |
| Cross-device sync | MISSING | BETTER | BETTER | PARTIAL (optional WebDAV/Dropbox) | We are one browser | Deal-breaker for many | Optional later (D004) |
| Cross-tab safety | MISSING | BETTER | BETTER | BETTER | Data loss | CRITICAL | YES |
| Collaboration | MISSING (fake UI) | PARTIAL | BETTER | WEAK | Fake numbers | Trust | Do not fake |
| Natural language add | MISSING | PARTIAL | BETTER | PARTIAL | “tomorrow 5pm p1” | Capture speed | After dates exist |
| AI voice split / MCP | MISSING | BETTER (2026) | PARTIAL | PARTIAL (MCP plugins claimed on SP site) | Marketing | Don’t copy yet | NO |
| Offline / local-first | PARTIAL | WEAK (cloud SoT) | WEAK | BETTER | SP/Obsidian win honesty | Privacy users | Lean into honesty |
| Export | PARTIAL (real JSON) | BETTER | BETTER | BETTER | Ours is fine | Low | Keep |
| Undo | MISSING | BETTER | BETTER | BETTER | Accidental delete | High | YES |
| Mobile app / PWA | WEAK (404 icons, no SW) | BETTER | BETTER | BETTER | Install broken | Medium | Fix or drop claim |
| Keyboard / a11y | WEAK | COMPARABLE+ | COMPARABLE+ | COMPARABLE | Unnamed buttons | Exclusion | YES |
| No account | BETTER | WEAK | WEAK | COMPARABLE | Our rare win | Privacy | Keep |
| Honest backup | WEAK (fake Google) | BETTER | BETTER | BETTER | Will cause horror stories | CRITICAL | Kill fake Connect |

TickTick free-tier specifics (reminders, habits cap 5, Pomo, calendar) from [StackCompare 2026](https://stackcompare.net/todoist-vs-ticktick-vs-things-3-2026-personal-task-manager-pricing-compared/), [HabitBox TickTick review 2026](https://habitbox.app/blog/ticktick-review), [TickTick homepage](https://www.ticktick.com/?language=en_Us).

Super Productivity local-first + timers + optional sync from [its 2026 local-first roundup](https://super-productivity.com/blog/best-local-first-todo-apps-2026/) and [compare hub](https://super-productivity.com/compare/).

Things 3: one-time purchase, Apple-only, excellent Today UX, no web — [Pikvue 2026](https://pikvue.com/todoist-vs-things-3-vs-ticktick-which-task-manager-actually-works/).

## How a competitor would beat this

1. Screen-record Connect Google → Network tab empty → “backed up” alert.
2. Show two tabs deleting work.
3. Show TickTick free: habit + reminder + Pomo in one install.
4. Show Super Productivity: same privacy story, real timers, optional sync.
5. Ask: “Why is Preview showing 156 shares?”

No pricing page to undercut. The product loses on **honesty** and **completeness**, not on dollars.

## Open-source: did we rebuild something worse?

Yes, in spirit.

- **Storage:** mature pattern is IndexedDB (Cairn, Level Up + Dexie) or a real local DB (Baajit/SQLite, Super Productivity). We used a single `localStorage` string. Fine for a prototype; wrong once voice/goals exist.
- **UI kit:** we vendored a v0 Radix zoo instead of a small set (Cairn claims zero external UI).
- **PWA:** Level Up actually ships SW + Dexie. We ship a lying manifest.
- **Do not blindly replace** the workspace document with Yjs. Owner D004 still holds. **Do** steal: date-keyed habit completions, one capture bar, no fake modules.

## Last 30 days signal

Owner log already listed offlog / aven / Jibaru/tasks / bobbyhuang todos updated 2026-08-23. Public 2026 roundups still crown Super Productivity for local-first and TickTick for all-in-one SaaS. Manage.kar does not appear in those lists. That is appropriate.

## Sources

- [Best Local-First To-Do Apps in 2026](https://super-productivity.com/blog/best-local-first-todo-apps-2026/) (2026)
- [Super Productivity compare hub](https://super-productivity.com/compare/)
- [Super Productivity GitHub](https://github.com/super-productivity/super-productivity)
- [TickTick](https://www.ticktick.com/?language=en_Us)
- [TickTick What’s New](https://help.ticktick.com/articles/7082552170989486080)
- [TickTick AI Voice Add](https://help.ticktick.com/articles/7444677039392555008)
- [TickTick Review 2026 (HabitBox)](https://habitbox.app/blog/ticktick-review)
- [Todoist vs TickTick vs Things 3 2026 (StackCompare)](https://stackcompare.net/todoist-vs-ticktick-vs-things-3-2026-personal-task-manager-pricing-compared/)
- [Todoist vs Things 3 vs TickTick (Pikvue)](https://pikvue.com/todoist-vs-things-3-vs-ticktick-which-task-manager-actually-works/)
- [Unstar 2026 ranking](https://unstar.app/blog/todoist-ticktick-things-3-microsoft-todo-apple-reminders-todo-apps-ranked-2026)
- [Cairn](https://github.com/Artaeon/cairn), [Baajit](https://github.com/kaafihai/baajit), [DayCraft](https://github.com/1saptarshi/DayCraft), [Level Up](https://github.com/yokutech/level-up), [TaskFlow](https://github.com/MS33834/taskflow)
