# Architecture findings

## What exists

```
Next.js 15 App Router
  app/page.tsx          god view
  app/shared/[data]     share renderer
  lib/domain/types      model
  lib/store/workspace   JSON document
  lib/store/use-workspace
  lib/share/codec
  lib/theme/apply-theme
  components/*          including two fake products
```

Owner D002/D004 are correct: one document, no CRDT, no backend **for this slice**.

## What is wrong

### Overengineering

- Collaboration dashboard, Google adapter, analytics “insights,” profile achievements, eight-tile OS, 1k-line FAB.
- Settings model for language/timezone/backup/font that nothing reads.
- Radix inventory for unused widgets.

### Underengineering

- No cross-tab protocol (RT-002).
- No recovery for corrupt JSON (RT-003).
- No scheduler (RT-011).
- No date type (RT-026).
- No patch persist.
- Builds ignore `tsc` (RT-017).

### Wrong boundaries

- UI owns habit streak math.
- UI owns Google “network.”
- Settings and profile bypass the hook’s `persist` and talk to storage.
- Share modal redefines Task.
- Event name duplicated (RT-031).

### Coupling

Page imports every modal. Adding a real goal store requires touching the god view. FAB duplicates task/note types and permission UX.

### Why is AI involved?

It isn’t. The Brain icon and “insights” are cosmetics (RT-029). Mentions are a hardcoded array. Do not add a model to hide missing dates.

### Why is an agent involved?

It isn’t. There is no tool loop. Good.

### Duplicate abstractions

- `interface Task` × N
- `WORKSPACE_CHANGED_EVENT` × 2
- Two focus timers
- Two permission walls
- Legacy keys + v1 document + Google key

### Architecture astronautics

Manifest `display_override: window-controls-overlay` with 404 icons. `metadata.verification.google` placeholder. Twitter creator `@managekar`.

### Technical debt disguised as flexibility

`.passthrough()` on Zod, `schemaVersion` always 1, settings kitchen-sink — “we can add fields later” without consumers.

## Failure map

```
[User]
   |  clicks Sync / Reminder / Goal / Toggle
   v
[page.tsx / modal] --stale arrays--> [persist]
   |                                    |
   |                                    v
   |                           localStorage v1  <--- tab B stale persist (LOSS)
   |                                    |
   +-- fake Google timeout --> alert "backed up"  (LIE)
   +-- Goal useState ---------> unmount (LOSS)
   +-- Share Base64 URL ------> anyone (LEAK)
   +-- Import click ----------> append clone (DUP)
   +-- corrupt JSON ----------> empty doc --> next save (WIPE)
```

Dependencies that can take the product down: **none external**. The product can still fail itself.

## Recommendation direction (not a fix)

Keep the document. Delete or hide every module that is not a function of that document. Make persist a patch against storage. Then stop.
