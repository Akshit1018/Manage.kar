# Database findings

**Store:** `localStorage["managekar.workspace.v1"]` JSON document.  
**Owner of data:** whoever has the browser profile. No user id.  
**Who may update:** any script on the origin, any tab, any share-import click, any extension.

## Schema

`Workspace` (`lib/domain/types.ts`): `schemaVersion: 1`, `updatedAt`, `tasks`, `notes`, `habits`, `settings`, `profile`.

**Not in the document:** goals, time entries, focus sessions, Google flags, FAB position, permission prompt flag, collaboration mocks.

## Keys / constraints

| Need | Actual |
| --- | --- |
| Primary key | `number`, max+1 |
| Unique title | no |
| Foreign keys | none (mentions are strings) |
| Soft delete | no |
| Audit / history | habit `history` only; no task history |
| Timestamps | notes `createdAt`; tasks have none besides due *label* |
| Indexes | n/a (full scan) |
| Enums | Zod on load; `.passthrough()` keeps extras |
| JSON blobs | the whole workspace is one blob |

## Chaos

- **Duplicate records:** share import appends clones (RT-007).
- **Partial writes:** single `setItem` is atomic; two tabs are not (RT-002).
- **Failed transaction:** no multi-key transaction. Profile dual-write can diverge (RT-030).
- **Deleted parents:** no graph. Deleting a task does not care about mentions.
- **Soft-delete restore:** n/a.
- **Migration rollback:** `migrateLegacyWorkspace` reads old keys once if `schemaVersion !== 1`. No down migration. Corrupt JSON → empty (RT-003).
- **Large datasets:** unbounded arrays. No pagination. `localStorage` quota (UA-7).
- **Orphans:** `manageKarGoogleIntegration`, `manage-kar-permissions`, `floating-toggle-position`, leftover `manageKarUserProfile`.
- **Competing sources of truth:** React state vs storage vs legacy keys vs Google key.

## Nullability / validation

Zod task schema requires `id`, `title`, `completed`, `priority`, `dueDate`. Invalid rows dropped (RT-005). Title may be whitespace-padded (RT-034). `dueDate` is free string (RT-026).

## Cascades

None. Clear workspace removes a hard-coded list of legacy keys (`clearWorkspace`) but **not** `manageKarGoogleIntegration` or `manage-kar-permissions`. After “Clear All Data,” Google can still show Connected.

## History / auditability

`updatedAt` is overwritten on every save. No op-log. Cannot answer “what changed at 4pm.”

## Who owns what

| Entity | Owner | On parent change |
| --- | --- | --- |
| Task | The browser origin | n/a |
| Note | The browser origin | Voice `blob:` dies with document (UA-1) |
| Habit | The browser origin | `completedToday` ignores calendar |
| Settings | Mixed (theme works) | Dead keys persist |
| Profile | Workspace + legacy key | Dual write |
| Goals | Component instance | Destroyed |
| Share payload | Anyone with URL | No revoke |

## Indexes / query

Search is `String.includes` on title/description in React (RT-035). No habit search. No sort beyond array order.
