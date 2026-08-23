# Known issues

- Goals, time tracker, and focus sessions still reset when the modal unmounts.
- Recurring tasks and reminder toggles are stored but never scheduled.
- PWA manifest references missing icons and there is no service worker.
- `styles/globals.css` is unused; styling lives in `app/globals.css`.
- Task `@mention` list is still a static demo roster.
- Analytics “productivity score” is a simple ratio, not a model.
- Share-by-link remains unsuitable for large or private task lists; JSON export is the safe path.
- `parallel-cli` / Firecrawl auth were unavailable in this environment; research used `gh` + web search.
