# Absent capabilities

Question for every screen: what would a reasonable personal-productivity user try next that is not there?

Classification is for **this** product (local-first, single user, no backend). Not a demand to clone TickTick.

| Missing thing | Where it is felt | Class | Why it matters |
| --- | --- | --- | --- |
| Time-of-day / background reminders | Task/habit reminder switches | MUST HAVE if the switch stays | `useLocalReminders` runs on workspace effect only. `reminderTime` unused. |
| Habit schedule enforcement | Habit modal frequency / custom days | MUST HAVE if the fields stay | Toggle works every day. |
| Checklist on the task card | Overview / Tasks list | EXPECTED | Data exists; list hides it. |
| Sort / filter (overdue, priority) | Tasks | EXPECTED | Search is substring only. |
| Agenda / today / calendar | Home | EXPECTED | Competitors treat “today” as the home, not four count tiles. See [Pikvue 2026](https://pikvue.com/todoist-vs-things-3-vs-ticktick-which-task-manager-actually-works/). |
| Quick-add without a modal | Home | EXPECTED | Two clicks + modal to capture. Todoist/Things compete on capture speed ([The Tool Chief 2026](https://thetoolchief.com/best-of/best-task-management-apps/)). |
| Keyboard capture / shortcuts | Everywhere | EXPECTED (desktop) | None. |
| URL for view + search | All | EXPECTED | Refresh returns to overview, search dies. |
| Mobile Share / Goals / Time / Focus / Counts | 390px | MUST HAVE or HIDE forever | Desktop-only `hidden sm:grid`. Proven in snapshot. |
| Conflict UI for two tabs | Any persist | MUST HAVE | Full-document last-write-wins. |
| Durable voice storage | FAB voice | MUST HAVE or REMOVE | Blob URL. |
| Offline app shell | PWA install | EXPECTED if PWA stays | `sw.js` caches static assets only. |
| Goal delete / complete / milestones | Goals | EXPECTED or REMOVE module | Create-only. |
| Archive | Tasks | EXPECTED | Delete + 8s undo only. |
| Projects / areas / tags | Tasks | EXPECTED | Priority + due date only. |
| Import from Todoist / Apple Reminders / TickTick | Settings | NICE | JSON-only. |
| Encrypted cloud / second device | Backup | DIFFERENTIATOR later | [Super Productivity](https://github.com/johannesjo/super-productivity) already offers optional Dropbox/WebDAV. |
| IndexedDB + ULID | Store | FOUNDATION NOW if voice or 10k rows | [Cairn](https://github.com/Artaeon/cairn) uses Dexie + ULID for this class of app. |
| Quota / “storage full” UI | Persist | MUST HAVE at scale | `setItem` can throw; no user-facing path. **SUSPECTED** until reproduced. |
| Bulk complete / reschedule | Tasks select mode | EXPECTED | Select only feeds Share. |
| Recurring habit skip / vacation | Habits | NICE | |
| History of task edits | Task modal | NICE | |
| Revoke / expire share links | Share | EXPECTED for private work | Needs a secret store or a server. Current copy admits no expiry. |
| Natural-language due dates | Task create | NICE | Todoist’s actual advantage ([Calmevo TickTick review 2026](https://calmevo.com/ticktick-review/)). |
| Team / Google / AI coach | — | IRRELEVANT | Correctly absent. Do not build. |

## They have this — why don’t we?

| External capability | Them | Us | Worth |
| --- | --- | --- | --- |
| Habits + tasks + Pomo in one app | TickTick bundles all three, including on cheaper plans ([StackCompare 2026](https://stackcompare.net/todoist-vs-ticktick-vs-things-3-2026-personal-task-manager-pricing-compared/)) | We have the nouns. Schedules and clocks do not work like theirs. | Finish or hide. Do not add more nouns. |
| Reminders on the free tier | TickTick/Things include reminders; Todoist gates some behind Pro ([StackCompare 2026](https://stackcompare.net/todoist-vs-ticktick-vs-things-3-2026-personal-task-manager-pricing-compared/)) | We show a switch that does not keep time. | Worse than absent. |
| Calendar / time-block | TickTick calendar is a stated reason to switch ([Pikvue 2026](https://pikvue.com/todoist-vs-things-3-vs-ticktick-which-task-manager-actually-works/)) | No calendar. | NICE; not the first hole. |
| Local-first + real optional sync | Super Productivity: IndexedDB, optional encrypted Dropbox/WebDAV ([DeepWiki persistence](https://deepwiki.com/johannesjo/super-productivity/5-data-persistence-and-synchronization)) | JSON in `localStorage`, export file | FOUNDATION (IndexedDB) before sync theater. |
| Issue import (Jira/GitHub) | Super Productivity ([GitHub repo](https://github.com/johannesjo/super-productivity)) | None | IRRELEVANT unless the owner is a developer tool. |
| One-time-purchase polish | Things 3, Apple-only ([The Tool Chief 2026](https://thetoolchief.com/best-of/best-task-management-apps/)) | Web PWA | Do not copy Apple HIG as a costume. |

## Adjacent actions per screen

| Screen | Next obvious action | Available? |
| --- | --- | --- |
| Overview empty | Add task | Yes |
| Overview with tasks | Complete / add another | Yes. Cannot mark habit from overview. |
| Task modal | Save, remind, repeat | Save yes. Remind/repeat are storage+partial. |
| Habits tab | Mark today | Yes. Cannot see “not scheduled today.” |
| Goals | Add milestone / complete / delete | No |
| Share | Export | Yes. Password link extra. Mobile: screen missing. |
| Settings Backup | Export | Copy points at Data → Export, which is another section. Extra click. |
| Shared page | Import | Yes, after confirm. |

## Power-user ceiling

A skilled user does not get faster. There are no shortcuts, saved views, templates, bulk reschedule, or API. They stay in beginner modals. That is a ceiling, not a learning curve.
