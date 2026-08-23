# Support simulation and small friction

## Predicted tickets (clustered)

### Cluster A — “I thought it was saved somewhere else”

1. Voice note audio gone after refresh.  
2. Reminders did not fire at 9:00.  
3. Habit set to Mon/Wed still nagged on Tuesday (or the reverse: they completed it on an off day).  
4. Second phone is empty.  
5. Cleared Chrome / new profile, everything gone, they skipped Export.

**Root:** localStorage + tab-open / workspace-effect reminders + unused schedule fields + no second device.

### Cluster B — “Two windows ate my work”

6. Task created in tab B vanished after tab A toggled.  
**Root:** full-document write. Storage event reloads the loser. No merge.

### Cluster C — “Share / backup”

7. Forgot the link password.  
8. “Generate link” failed (size cap).  
9. Imported twice / almost-duplicate titles.  
10. Cannot find Share on iPhone.  
11. WhatsApp opened and they thought that was a backup.

### Cluster D — “The numbers are lying”

12. Weekly progress / productivity score.  
13. Checklist not on the card.  
14. Counts recommendations always 9–11 AM.

### Cluster E — “PWA / install”

15. Installed to home screen, offline is blank.  
16. Icon works, app shell does not.

Repeated clusters A and C are design failures, not copy nits.

## Small-friction inventory

| Friction | Evidence |
| --- | --- |
| Extra click to export | Backup copy points at another settings section |
| Search placeholder, no label | Snapshot: textbox “Search tasks, notes, and habits...” |
| View state not in URL | `currentView` useState |
| Date input good on mobile | Task due is a date field (live) |
| No autocomplete / NLP | Title is a raw textbox |
| Undo window 8s | sonner duration |
| Double confirm on clear | Correct for destroy; still two dialogs |
| Inconsistent close | Share is custom overlay; Goals is Dialog |
| Home icon is BarChart3 | `app/page.tsx` mobile nav |
| Next.js Dev overlay | Testers see “Open Next.js Dev Tools” |
| Glass / gradient / scale-105 | Template density on tiles |

## Copycat / fake sophistication

- Productivity score + Award tile  
- Brain / “Workspace notes”  
- Hardcoded Recommended Actions  
- “Weekly Progress” bars that are lifetime ratios  
- Profile trophies  
- Goal manager stat strip with 0 milestones  

These exist to look like a suite. They do not change a next action except to mislead.
