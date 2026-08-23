# Bad features

Features that should be removed, hidden, or redesigned. Not “add more.”

## Remove from the home grid

| Feature | Why it is bad | Redirect |
| --- | --- | --- |
| Preview (team) | Fake 156 shares; dead Export/Invite; traps Escape | Delete component |
| Goals | Seeded 2024 demo; not persisted | Persist empty **or** delete |
| Time | RAM timer sold as a product | Persist **or** delete |
| Focus | Second timer + tap lock + lost sessions | One persisted timer **or** delete |
| Analytics | Ratio as “insights” | Inline counts on Overview |
| Workspace/Monitor | Restates four numbers | Delete |

Share can stay if it defaults to **JSON export** and treats URL as advanced + dangerous.

## Remove from Settings

| Control | Why |
| --- | --- |
| Connect Google Sheets/Docs/Drive | RT-001. Will cause data-loss folklore. |
| Sync Now / Auto Sync / Spreadsheet ID | Theater. |
| Auto Backup + frequency | Writes a boolean. |
| Language | No translations. |
| Font size / animations | No consumers. |
| Week start / date format | No consumers; dates aren’t dates. |
| Notification subtypes / sound / volume | No scheduler. |
| Geolocation permission probe | Unused. |
| “Version 1.0.0” / “Smart Task & Life Management” | False completion. |

Keep: theme, clipboard opt-in, export, import (after RT-004), clear data.

## Remove from Task modal

| Control | Why |
| --- | --- |
| @mention roster | Five fictional employees |
| Recurring | Until a job exists |
| Reminders | Until a job exists |
| assignedTo | Nobody to assign |

Keep: title, notes, priority, **real** date, checklist.

## Redesign, don’t delete

| Feature | Problem | Direction |
| --- | --- | --- |
| Eight-tile grid | Equal weight, mostly fake | One CTA |
| FAB 1053 lines | Second app | Add-task only |
| Permissions modal | Asks too early | Ask on voice |
| Share URL | Public payload | File first |
| PWA tags | 404 | Real assets or none |
| Analytics score | Empty-habit math | Raw counts |
| Collaboration 713 lines | Maintenance tax | Delete |

## Duplicate / overlapping

- Two permission UIs (page + FAB).
- Two focus timers (modal + FAB).
- Two Task type definitions.
- Overview counts vs Analytics vs Workspace vs Preview stats.
- Export JSON in Settings **and** Share export (ok) vs fake Drive backup (bad).

## AI-for-marketing

None implemented. Title “Smart” and Brain icons still do the job of a fake AI feature. Remove the costume (RT-016, RT-029).

## Maintenance burden without value

`google-integration.tsx` + `collaboration-dashboard.tsx` + unused Radix + settings kitchen sink. Every hour spent there is an hour not spent on persist races or dates.
