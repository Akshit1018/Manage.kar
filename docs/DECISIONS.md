# Decisions

## D001 — This product is a personal productivity workspace

- **Alternatives:** Treat the repo as a career copilot / candidate evidence platform because the prompt mentioned those nouns.
- **Evidence:** Code, routes, and data are tasks/notes/habits. No candidate domain exists.
- **Why:** Forcing a recruiting architecture would be a rewrite of a different product.
- **Reversal:** Owner writes a new vision and we start a separate app or a new major version.

## D002 — One workspace document is the source of truth

- **Alternatives:** Keep React seed state; keep scattered `manageKar*` keys; adopt Yjs immediately.
- **Evidence:** Dashboard never persisted. Settings exported empty keys. Voice wrote a side channel.
- **Why:** Data loss is P0. A single versioned JSON document is reversible and testable.
- **Reversal:** Move the same schema to IndexedDB when voice blobs or size require it.

## D003 — First run is empty, not fake seed data

- **Alternatives:** Persist the old demo tasks so the UI looks full.
- **Evidence:** Seed tasks trained users that the product is a demo; they also overwrote real work on refresh.
- **Why:** Trust. Empty states tell the user what to do next.
- **Reversal:** Add an explicit “Load sample workspace” action if testers need it.

## D004 — No CRDT / no backend in this slice

- **Alternatives:** Automerge, PowerSync, Supabase.
- **Evidence:** README mentioned Supabase; no client exists. No multi-user requirement.
- **Why:** Sync without a product need creates cost and conflict UI we cannot staff.
- **Reversal:** When a second device is a real requirement, add an adapter behind the workspace interface.

## D005 — Clipboard monitor off by default

- **Alternatives:** Keep polling every 2s.
- **Evidence:** Silent permission failures; reads secrets.
- **Why:** Privacy is a product feature.
- **Reversal:** User enables it in Settings → Privacy.
