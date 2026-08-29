# Gates: MIT Hermes speak

OWNS: GATES.md, scripts/verify-mit-hermes-speak.mjs, lib/hermes/**, lib/pairing/**, components/pairing-sheet.tsx, components/workspace/chats-view.tsx, components/chat-composer.tsx, docs/DECISIONS.md, docs/KNOWN_LIMITATIONS.md, docs/superpowers/specs/2026-08-29-mit-hermes-speak-design.md, docs/superpowers/plans/2026-08-29-mit-hermes-speak.md, lib/ui/workspace-sections-layout.ts, lib/ui/workspace-sections-layout.test.ts

Scope: Attach Manage.kar to a MIT hermes-agent dashboard using official /api/status, /api/ws token auth, session.create, and prompt.submit without pairing from a QR or status poll alone.

- [ ] G1: official dashboard status is recognized and non-Hermes JSON is rejected
  CHECK: node scripts/verify-mit-hermes-speak.mjs status
  EXPECT: hermes status verification passed
  EVIDENCE: pending

- [ ] G2: WebSocket URL and JSON-RPC frames match the MIT gateway client
  CHECK: node scripts/verify-mit-hermes-speak.mjs protocol
  EXPECT: hermes protocol verification passed
  EVIDENCE: pending

- [ ] G3: status probe waits; attach pairs only after session.create
  CHECK: node scripts/verify-mit-hermes-speak.mjs attach
  EXPECT: hermes attach verification passed
  EVIDENCE: pending

- [ ] G4: paired sends use the Hermes session_id
  CHECK: node scripts/verify-mit-hermes-speak.mjs send
  EXPECT: hermes send verification passed
  EVIDENCE: pending

- [ ] G5: pairing sheet exposes helper URL, token, and Connect
  CHECK: node scripts/verify-mit-hermes-speak.mjs ui
  EXPECT: hermes ui verification passed
  EVIDENCE: pending
