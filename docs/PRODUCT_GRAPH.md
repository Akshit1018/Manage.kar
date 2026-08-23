# Product graph

```
User
 └─ Workspace (source of truth)
     ├─ Profile (name, contact)
     ├─ Settings (theme, privacy, notifications)
     ├─ Tasks ── share payload ── shared page ── import → Tasks
     ├─ Notes (voice pointer `idb:voice:{id}` in IndexedDB)
     ├─ Habits ── schedule ── history[date] ── streak (scheduled days only)
     ├─ Goals
     ├─ Time entries
     └─ Focus sessions / activeFocus
```

## Invalidation

| Change | Downstream |
| --- | --- |
| Task create/edit/toggle/delete | Overview today, counts, share set, FAB list |
| Note create/edit/delete | Notes view, FAB list |
| Habit toggle | Habit list, today, counts (if scheduled) |
| Settings.theme / font / animations | `document.documentElement` |
| Settings.clipboardMonitor | ClipboardMonitor enabled |
| Import / clear / any save | Full workspace via `managekar:workspace-changed` |

## Rejected nodes (template, not this product)

Candidate, Evidence, Role, Resume, Interview, Recruiter, Fit score.
