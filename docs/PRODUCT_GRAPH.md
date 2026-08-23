# Product graph

```
User
 └─ Workspace (source of truth)
     ├─ Profile (name, contact)
     ├─ Settings (theme, privacy, notifications)
     ├─ Tasks ── share payload ── shared page ── import → Tasks
     ├─ Notes (optional voice blob URL)
     └─ Habits ── history[date] ── streak (derived later)
```

## Invalidation

| Change | Downstream |
| --- | --- |
| Task create/edit/toggle/delete | Overview counts, analytics, share set, FAB list |
| Note create/edit/delete | Notes view, FAB list, analytics (if added) |
| Habit toggle | Habit dashboard, monitor counts, analytics |
| Settings.theme | `document.documentElement.dark` |
| Settings.clipboardMonitor | ClipboardMonitor enabled |
| Import / clear | Full workspace reload via `managekar:workspace-changed` |

Goals, time entries, and focus sessions are still component-local. They are **not** on the graph yet.

## Rejected nodes (template, not this product)

Candidate, Evidence, Role, Resume, Interview, Recruiter, Fit score.
