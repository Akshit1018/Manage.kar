# Logic failures

INPUT → STATE → ACTION → SIDE EFFECT → NEXT STATE. What breaks.

## Persist (core)

```
INPUT: user toggles task 1
STATE: React `tasks` = [t1, t2]  (possibly stale)
ACTION: persist({ tasks: tasks.map(...) })
SIDE EFFECT: load storage (may contain t3 from another tab), then spread `{ ...current, tasks: staleMapped }`
NEXT STATE: t3 gone
```

Confirmed RT-002.

Same shape for notes, habits, clipboard capture, voice capture. `nextNumericId(tasks)` also uses the stale list → duplicate ids possible (RT-038).

## Habit toggle

```
INPUT: tap habit
STATE: completedToday=false, streak=3
ACTION: invert flag; streak+1; rewrite today's history row
NEXT: streak=4
INPUT: tap again same day
NEXT: streak=3
INPUT: tap again
NEXT: streak=4   // same calendar day, streak oscillates
NEXT DAY: completedToday still true  // no rollover
```

RT-012. History exists but streak is not a function of history.

## Goals

```
INPUT: open Goals
STATE: two seeded 2024 goals
ACTION: +10% / new goal
SIDE EFFECT: useState only
INPUT: close modal
NEXT: unmount; state destroyed
INPUT: reopen
NEXT: seed again, user goal gone
```

RT-008.

## Time / Focus

```
INPUT: start timer
STATE: running in modal state
ACTION: close modal OR refresh
NEXT: 00:00, no row
```

Focus additionally: start → lock → need 5 taps (stale count) → stop writes to `sessions` still in RAM (RT-009, RT-010).

## Reminders / recurring

```
INPUT: reminders=true, recurring=daily
STATE: fields on Task
ACTION: save
SIDE EFFECT: JSON write
NEXT: nothing else. Ever.
```

No transition to “instance created” or “notification shown” (RT-011).

## Share import

```
INPUT: click Import
STATE: payload in URL
ACTION: append copies
SIDE EFFECT: localStorage write
NEXT: should be `/` ; observed: same URL, duplicate rows, no toast
```

RT-007. Retry is not idempotent.

## Google connect

```
INPUT: Connect
STATE: disconnected
ACTION: setTimeout 2s; 20% reject
NEXT: connected=true, sample spreadsheet id, Notification optional
INPUT: Sync Now
ACTION: read manageKarTasks (usually [])
NEXT: alert success “backed up”
```

RT-001. Invalid transition: connected without credentials.

## Corrupt load

```
INPUT: storage = "{not-json"
ACTION: loadWorkspace → empty
INPUT: user adds task
NEXT: empty+new overwrites damaged bytes
```

RT-003.

## Due dates

`dueDate: "Today"` never becomes yesterday. No overdue state. No timezone (RT-026, RT-014).

## Permissions flag

`manage-kar-permissions` = granted | partial | skipped. Not used to skip later FAB prompts reliably. Grant may be `partial` if mic denied but modal still closes (RT-015).

## Backup import

`{}` → valid empty workspace → replace (RT-004).

## Mentions

`@john` in text ≠ `mentions: ["john"]` unless dropdown used (RT-027). Assigned users never notify anyone.

## Analytics score

Empty workspace: `completed/max(length,1)*50 + habitsToday/max(habits,1)*50` = **50 + 50 = 100** if both lists empty?  
`tasks.length` 0 → `max(1)` → 0/1*50 = 0; habits same → **score 0**.  
One incomplete task, zero habits: 0 + 50 = **50** for doing nothing on habits. Logic is decorative (RT-029).
