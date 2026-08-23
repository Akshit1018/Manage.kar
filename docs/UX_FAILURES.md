# UX failures

See ledger `docs/RED_TEAM_FINDINGS.md`. Screenshots: `docs/red-team/evidence/`.

## First-run destruction

**ENTRY:** User opens `/`.

**What they see:** “Hello, User!” + optional permissions wall (mic + notifications “for task reminders”) + eight equal tiles + Overview/Tasks/Notes + search + empty or leftover tasks + a floating orb.

Hesitation points (each is a defect candidate):

1. **Who is User?** Profile defaults (RT-043).
2. **Why is the app locked?** Permissions before value (RT-015, `rt-first-visit-permissions.png`).
3. **What should I click?** Analytics vs Time vs Goals vs Habits vs Focus vs Share vs Preview vs Workspace (RT-018).
4. **What is Preview?** Opens a fake company (RT-013, `rt-preview-fake-team.png`). Escape fails. User is trapped until they find Close.
5. **Goals already have progress?** Fake 2024 goals (RT-008, `rt-goals-fake-seed.png`).
6. **Where is Add Task?** Third-row empty state or FAB. FAB has no name (RT-019).
7. **Grant Permissions** starts the mic. Hostile users bounce.

**First success** should be: type a task, see it, refresh, still there. That path exists but is not the visual hero. The hero is the suite costume.

## Journey: add a task

ENTRY → Tasks → Add Task → title → Create Task → list.

Breaks:

- Empty title: nothing happens (RT-028).
- Description coaches `@` team members who do not exist (RT-027, `rt-task-modal-advanced-mentions.png`).
- Advanced Settings: Recurring + Reminders look real (RT-011).
- Due Date: Today / Tomorrow / This Week as words (RT-026).
- Delete: no confirm, no undo (RT-023).
- Complete control: icon-only, unlabeled (RT-019).

## Journey: share

Share → WhatsApp default (RT-055) → Share Link → Generate & Copy → huge Base64 URL (`rt-share-public-url.png`) → recipient Import → **no confirm**, **duplicates**, **stuck on the share page** (RT-007, `rt-shared-import-no-confirm.png`).

User cannot answer “did it work?”

## Journey: “back up my life”

Settings → Integrations: honest paragraph, dishonest Connect buttons (RT-001, `rt-google-fake-connected.png`).

Settings → Data → Auto Backup: switch stores `true`, no job (RT-014).

Settings → Export: this one is real. It is visually equal to Import and weaker than the green Connect button.

## Mobile

`rt-mobile-390.png`: tiles wrap, search still full-width, FAB covers the last row, no tab bar, no safe-area honesty. Hostile mobile user never finds edit (desktop uses hover; mobile shows edit — that part was improved). Still too much chrome.

## Mental model failures

| User thinks | Product is |
| --- | --- |
| This is a team app | One browser |
| Google is connected | `Math.random` + sample sheet id |
| Reminders will ping | A boolean |
| Goals are mine | Seeded 2024 demo |
| 156 shares | Constants |
| 1.0.0 | v0 template |
| Preview is a safe tease | Full fake ERP that steals focus |
| Second window is safe | Last write deletes the other |

## Copy that creates tickets

- “Your data is now backed up.”
- “For task reminders and confirmations.”
- “Automatically sync your tasks to a Google Sheets spreadsheet.”
- “Automatically backup all your Manage.kar data to Google Drive for secure cloud storage.”
- “Use @ to mention team members.”
- “This share link is invalid or has expired.” (no expiry)
- “Smart Task & Life Management.”
- “Team preview / Demo layout only” next to **156 Total Shares**.

## Discoverability

Working persistence is not celebrated. Fake modules are on the first row. Export is inside Settings → Data. Recurring is inside Advanced Settings. The only honest sentence on the home header — “Your workspace stays on this device” — is smaller than “Hello, User!” and drowned by eight icons.
