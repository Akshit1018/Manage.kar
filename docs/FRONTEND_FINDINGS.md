# Frontend findings

## Architecture of the UI

The dashboard is not a page. It is a module federation accident.

| File | Lines | Role |
| --- | ---: | --- |
| `app/page.tsx` | 1117 | Router, store, permissions, four views, eight modals |
| `components/floating-toggle.tsx` | 1053 | Second app: drag, long-press voice, lists, permissions |
| `components/collaboration-dashboard.tsx` | 713 | Dead ERP |
| `components/google-integration.tsx` | 651 | Fake OAuth |
| `components/settings-modal.tsx` | 526 | Mix of real export and dead switches |
| `components/task-modal.tsx` | 520 | Mentions + recurring fiction |

Duplicate `interface Task` in page consumers instead of `lib/domain/types` (RT-021, RT-045).

## State

- `useWorkspace` hydrates once, listens only to a custom event, not `storage` (RT-002).
- Modal local state for goals/time/focus is a second database (RT-008–010).
- `persist(partial)` + spread of full arrays is not a patch API.
- Settings and profile write storage themselves, then `notifyWorkspaceChanged` — two writers.
- Google settings live in `manageKarGoogleIntegration`, a third document.

## Effects / races

- Focus interval reset every second (RT-033).
- Clipboard `setInterval` 2s (RT-022).
- WhatsApp `setTimeout` fallbacks (RT-032).
- Permissions `useEffect` on mount (RT-015).
- Goal/time/focus lost on unmount (RT-008–010).

## Forms

- Silent empty title (RT-028).
- No max length; trailing spaces kept (RT-034).
- XSS-looking titles render as text (good). Not sanitized on share URL (expected for text).
- Frontend-only validation; there is no backend to mismatch — the mismatch is **settings UI vs no consumer**.

## Loading / empty / error

- Hydration: “Loading your workspace…” (good).
- Empty states exist for tasks/notes (owner P1-5, still good).
- Share generate failure: `console.error` only (`share-modal.tsx` 90–92).
- Import share: no success state (RT-007).
- Preview: empty search states for **mock** data (RT-013).

## A11y

- Unnamed icon buttons (RT-019).
- Custom overlays (permissions, preview) without focus trap / Escape (RT-013, RT-015).
- Cards as click targets (RT-019).
- Contrast not measured (UA-15).
- Motion: `hover:scale-105` everywhere; `animations` setting unused (RT-014).

## Responsive

- `rt-mobile-390.png`: density failure (RT-020).
- `sm:opacity-0 group-hover:opacity-100` on desktop edit — keyboard users never hover.
- `pb-32` admits the FAB problem; it does not fix overlap.

## Unused / template

- Radix package forest vs used set (RT-037).
- `package.json` name `my-v0-project`.
- `[v0]` console prefixes (RT-044).
- `generator: v0.app` in metadata.

## Buttons that are fake or incomplete

| Label | Location | Real? | Double-click | Undo | Analytics |
| --- | --- | --- | --- | --- | --- |
| Connect Google * | Settings | Fake success | Can click again | Disconnect confirm only | No |
| Sync Now | Settings | Alert only | Yes | No | No |
| Export Report | Preview | **No onClick** | n/a | n/a | No |
| Invite Member | Preview | **No onClick** | n/a | n/a | No |
| Share Tasks (footer) | Preview | **No onClick** | n/a | n/a | No |
| Recurring / Reminders | Task modal | Persist only | n/a | n/a | No |
| Auto Backup | Settings | Persist only | n/a | n/a | No |
| Language | Settings | Persist only | n/a | n/a | No |
| Grant Permissions | First run | Real `getUserMedia` | Yes | No | No |
| Create Task | Task modal | Real if title | Silent if empty | No | No |
| Import Tasks | Share page | Real write | Duplicates | No | No |
| Generate & Copy Link | Share | Real | Yes | No revoke | No |
| Add Task (FAB) | FAB | Real | Yes | No | No |

## Performance (frontend)

Not profiled at 10k rows. `filteredTasks` on every render is fine at n=2. Recharts is a dependency; analytics does not use it. Bundle includes unused Radix. Images unoptimized (`next.config.mjs`).
