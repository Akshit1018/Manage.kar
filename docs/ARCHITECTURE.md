# Architecture

## Runtime

- Next.js 15 App Router, client-rendered dashboard (`app/page.tsx`)
- No `app/api`, no auth, no database server
- Persistence: one JSON document in `localStorage` key `managekar.workspace.v1`

## Domain

- Types: `lib/domain/types.ts`
- Store: `lib/store/workspace.ts` (load, save, migrate, backup parse)
- Hook: `lib/store/use-workspace.ts`
- Share codec: `lib/share/codec.ts` (unicode-safe, size-capped)
- Theme: `lib/theme/apply-theme.ts`

## Why localStorage, not CRDT / IndexedDB yet

2026 local-first writing recommends IndexedDB + optional CRDT **when** there is multi-device sync or large blobs. A personal task/note/habit document is small. A versioned JSON document is the durable foundation and can move to IndexedDB without changing the domain types.

## Boundaries

- UI may not write `manageKarTasks` / `manageKarNotes` as a second source of truth
- Settings export/import must read/write the same workspace document
- Mock integrations (Google, team preview) must be labeled as preview

## Tests

`pnpm test` runs Vitest on `lib/**/*.test.ts`.
