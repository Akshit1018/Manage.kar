# Gates: remaining honest companion leftovers

OWNS: GATES.md, scripts/verify-remaining-companion.mjs, apps/mobile/lib/src/screens/chats_screen.dart, apps/mobile/lib/src/state/dialer.dart, apps/mobile/lib/src/overlay/**, apps/mobile/test/**, apps/mobile/android/**, lib/hermes/**, lib/pairing/**, lib/dialer/**, lib/ui/workspace-sections-layout.ts, lib/ui/workspace-sections-layout.test.ts, components/workspace/chats-view.tsx, components/pairing-sheet.tsx, components/approval-card.tsx, components/chat-composer.tsx, docs/DECISIONS.md, docs/KNOWN_LIMITATIONS.md

Scope: Ship Flutter presence parity, a testable Hermes JSON-RPC client, an honest pairing handshake, live approval cards, and documented Android overlay stubs without fake online, fake sent, or fake QR scans.

- [ ] G0: this ledger states outcomes that can fail
  CHECK: node .cursor/skills/unlazy/scripts/gate-lint.mjs GATES.md
  EXPECT: LINT OK
  EVIDENCE: pending

- [ ] G1: Flutter presence words match the web companion
  CHECK: node scripts/verify-remaining-companion.mjs flutter-presence
  EXPECT: flutter presence verification passed
  EVIDENCE: pending

- [ ] G2: Hermes JSON-RPC client streams tokens and never marks demo messages sent
  CHECK: node scripts/verify-remaining-companion.mjs protocol
  EXPECT: protocol verification passed
  EVIDENCE: pending

- [ ] G3: pairing handshake waits, expires, and names helper failures without scanning a QR
  CHECK: node scripts/verify-remaining-companion.mjs pairing
  EXPECT: pairing handshake verification passed
  EVIDENCE: pending

- [ ] G4: approval cards appear only from live requests and never offer YOLO on the phone
  CHECK: node scripts/verify-remaining-companion.mjs approval
  EXPECT: approval verification passed
  EVIDENCE: pending

- [ ] G5: Android overlay capability stays not granted unless the OS reports it
  CHECK: node scripts/verify-remaining-companion.mjs overlay
  EXPECT: overlay verification passed
  EVIDENCE: pending
