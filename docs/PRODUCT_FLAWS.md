# Product flaws

Ledger IDs live in `docs/RED_TEAM_FINDINGS.md`. This file is the product-manager / competitor / growth cut.

## Status

OPEN unless marked otherwise. Do not delete; mark RESOLVED when the home grid matches reality.

## Identity

Manage.kar does not know what it is.

- README: local-first tasks, notes, habits.
- Window title / OG / Settings footer: “Smart Task & Life Management” Version 1.0.0.
- Manifest: “team collaboration features.”
- Home: Analytics, Time, Goals, Habits, Focus, Share, Preview, Workspace.
- Code: one `localStorage` document for three entities.

A first-time user is sold a suite. They receive a list. That is a **trust defect**, not a positioning debate (RT-016, RT-018).

Owner decision D003 forbids fake seed data. Goals still ship 2024 React/marathon demos (RT-008). D001 correctly rejected a career-copilot rewrite; leftover team/ERP chrome was not removed, only relabeled “Preview” (RT-013).

## Why this would lose to a competitor tomorrow

If this launched today, a user would open [TickTick](https://www.ticktick.com/?language=en_Us) (tasks + habits + real Pomo + calendar + reminders on a generous free tier, 2026 reviews) or [Super Productivity](https://super-productivity.com/) (local-first, real timers, optional sync, no account). Both are documented in 2026 comparison pages ([Super Productivity local-first list](https://super-productivity.com/blog/best-local-first-todo-apps-2026/), [StackCompare pricing](https://stackcompare.net/todoist-vs-ticktick-vs-things-3-2026-personal-task-manager-pricing-compared/)).

Manage.kar’s only honest differentiator is “no account, one JSON file.” That is a feature of Super Productivity, Obsidian Tasks, todo.txt, Planify, Cairn, Baajit, and a dozen GitHub toys. It is not a product.

## Bad product decisions (keep / kill)

| Decision | Verdict | Why |
| --- | --- | --- |
| Local-first workspace document | KEEP | Right architecture for this repo. |
| Home grid of eight modules | KILL / hide | Three work; five lie or evaporate. |
| Fake Google Connect | KILL | RT-001. Will cause real data-loss stories. |
| Fake team Preview | KILL | RT-013. Dead Export/Invite. Traps focus. |
| Reminders switch | HIDE | RT-011. Stored fiction. |
| Recurring select | HIDE | RT-011. |
| @mentions | KILL | RT-027. Static John Doe. |
| Goals/Time/Focus on home | HIDE until persisted | RT-008–010. |
| Analytics “score” | RENAME | RT-029. Counts only. |
| First-run permission wall | KILL | RT-015. |
| WhatsApp as default share | DEMOTE | RT-055. Export JSON first. |
| Settings language/backup/font | HIDE | RT-014. |
| Clipboard monitor | KEEP off; fix default prop | RT-022. |
| PWA tags without icons | KILL or finish | RT-025. |
| “Version 1.0.0” | KILL | This is not 1.0. |

## Useless / overbuilt features

- 713-line collaboration dashboard with mock 156 shares.
- 651-line Google client that `Math.random()`s connection failure.
- 1053-line FAB that is a second task/note/voice app.
- Settings that write `Español` and never translate a string.
- Auto Backup switch with no job.
- Geolocation permission probe.
- Profile achievements (“Local-first”, “Closer”).
- Monitor/Workspace view that restates the four counts.

## Missing features that actually matter

Evidence: TickTick/Todoist/Things/Super Productivity 2026 writeups; GitHub [Cairn](https://github.com/Artaeon/cairn), [Baajit](https://github.com/kaafihai/baajit).

Must-have for this category (not “nice”):

1. Real dates and overdue.
2. Recurrence that creates the next instance.
3. Reminders that fire or are absent.
4. Undo / confirm delete.
5. One capture box that always works.
6. Honest export (exists) + honest **no** cloud unless real.
7. Habit day boundary.
8. Persist or remove Time/Focus/Goals.
9. Cross-tab safety.
10. Mobile bottom nav.

Do **not** build: AI categorization, MCP, team ERP, Google Sheets, Eisenhower, Kanban — until the list is trustworthy. TickTick already owns the “all-in-one + AI voice split” slot ([TickTick What’s New / AI Voice Add](https://help.ticktick.com/articles/7444677039392555008)).

## Growth

- **Why sign up?** There is no signup. That is fine. Why *open the URL again tomorrow?* Reminders don’t fire. Streaks lie. Goals reset.
- **Why tell a friend?** Share dumps plaintext into a URL. Invite Member does nothing.
- **Landing:** none (RT-024).
- **CTA:** eight-way tie (RT-018).

## Support tickets this will generate

See `docs/RED_TEAM_FINDINGS.md` and the support map in the PR body. Top predicted:

- “I clicked backup and my data is gone.”
- “My other tab deleted my tasks.”
- “Reminders never came.”
- “Why do I have someone else’s marathon goal?”
- “Export Report does nothing.”
- “I imported the share link and now I have duplicates and I’m still on this page.”
