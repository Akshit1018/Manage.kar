# Research log

Performed 2026-08-23. `parallel-cli` was not installed. Firecrawl CLI was present via npx but **not authenticated**. GitHub search used `gh search repos`. Web search used the built-in search tool.

## GitHub (updated the same day)

Local-first task apps were actively landing:

- [offlog](https://github.com/hrach-gevorgyan/offlog) — local-first, no account, Wi-Fi device sync (updated 2026-08-23)
- [aven](https://github.com/raine/aven) — local-first tasks for people and agents (2026-08-23)
- [Jibaru/tasks](https://github.com/Jibaru/tasks) — local-first across platforms (2026-08-23)
- [bobbyhuang-dev/todos](https://github.com/bobbyhuang-dev/todos) — local-first list + Pomodoro, React 19 (2026-08-23)

**ADOPT (principle):** local store is the UI source of truth.  
**REJECT (for now):** cloning those codebases; different stacks and licenses not reviewed in depth.

## Market complaints (2026)

- Power users leave Notion/Todoist/Trello over pricing, gating, and **sync/data loss** ([Unstar, 2026](https://unstar.app/blog/productivity-app-reviews-what-power-users-complain-about-2026)).
- TickTick/Todoist offline and sync remain weak points ([Pikvue comparison](https://pikvue.com/todoist-vs-things-3-vs-ticktick-which-task-manager-actually-works/)).
- Private alternatives argue: local-first, optional encrypted sync, no telemetry ([Super Productivity](https://super-productivity.com/blog/private-alternatives-todoist-ticktick-notion-microsoft-todo/)).

**ADOPT:** persistence, honest export, no fake cloud.  
**BACKLOG:** optional encrypted sync.  
**REJECT:** adding AI auto-categorization to look like TickTick v6.

## Local-first architecture (2026)

- [Smashing Magazine, May 2026](https://www.smashingmagazine.com/2026/05/architecture-local-first-web-development/): IndexedDB/SQLite when needed; do not add Yjs unless you need collaborative text.
- Writes go local first; server is an async replica if it exists.

**ADOPT:** versioned local document, migrate later.  
**REJECT:** CRDT + outbox in this slice.

## Red-team market pass (2026-08-23, later the same day)

`parallel-cli` still missing. Firecrawl CLI 1.23.1 **unauthenticated**; `login --browser` hung.

Used built-in web search + page fetch:

- [Best Local-First To-Do Apps in 2026](https://super-productivity.com/blog/best-local-first-todo-apps-2026/)
- [Super Productivity compare](https://super-productivity.com/compare/)
- [TickTick](https://www.ticktick.com/?language=en_Us), [What’s New](https://help.ticktick.com/articles/7082552170989486080), [AI Voice Add](https://help.ticktick.com/articles/7444677039392555008)
- [StackCompare Todoist/TickTick/Things 2026](https://stackcompare.net/todoist-vs-ticktick-vs-things-3-2026-personal-task-manager-pricing-compared/)
- GitHub: [Cairn](https://github.com/Artaeon/cairn), [Baajit](https://github.com/kaafihai/baajit), [DayCraft](https://github.com/1saptarshi/DayCraft), [Level Up](https://github.com/yokutech/level-up), [TaskFlow](https://github.com/MS33834/taskflow)

**ADOPT for the audit:** TickTick as the all-in-one SaaS foil; Super Productivity as the honest local-first foil.  
**REJECT:** Copying TickTick AI/MCP before reminders exist.  
**Full writeup:** `docs/COMPETITOR_GAPS.md`.
