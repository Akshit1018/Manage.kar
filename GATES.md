# Gates: remaining honest companion leftovers

OWNS: GATES.md, scripts/verify-remaining-companion.mjs, apps/mobile/lib/src/screens/chats_screen.dart, apps/mobile/lib/src/state/dialer.dart, apps/mobile/lib/src/overlay/**, apps/mobile/test/**, apps/mobile/android/**, lib/hermes/**, lib/pairing/**, lib/dialer/**, lib/ui/workspace-sections-layout.ts, lib/ui/workspace-sections-layout.test.ts, components/workspace/chats-view.tsx, components/pairing-sheet.tsx, components/approval-card.tsx, components/chat-composer.tsx, docs/DECISIONS.md, docs/KNOWN_LIMITATIONS.md

Scope: Ship Flutter presence parity, a testable Hermes JSON-RPC client, an honest pairing handshake, live approval cards, and documented Android overlay stubs without fake online, fake sent, or fake QR scans.

- [x] G0: this ledger states outcomes that can fail
  CHECK: node .cursor/skills/unlazy/scripts/gate-lint.mjs GATES.md
  EXPECT: LINT OK
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/workspace; path=b145806bef66/11 entries; EXPECT=matched; output-sha256=48630b7361dd44ee870917b12c3d19b9d7bdea738aaca16bb04d4cab83b772d2; output-bytes=8

- [x] G1: Flutter presence words match the web companion
  CHECK: node scripts/verify-remaining-companion.mjs flutter-presence
  EXPECT: flutter presence verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/workspace; path=b145806bef66/11 entries; EXPECT=matched; output-sha256=c3cd3ad7eae1771c5aee674f6baa78cd4d387abb2d37572d10913d588fcadd77; output-bytes=37

- [x] G2: Hermes JSON-RPC client streams tokens and never marks demo messages sent
  CHECK: node scripts/verify-remaining-companion.mjs protocol
  EXPECT: protocol verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/workspace; path=b145806bef66/11 entries; EXPECT=matched; output-sha256=5aaba0a40d83090a0835bf446554d1cfeda8a943c08fac358e46fd3c65a3cd25; output-bytes=29

- [x] G3: pairing handshake waits, expires, and names helper failures without scanning a QR
  CHECK: node scripts/verify-remaining-companion.mjs pairing
  EXPECT: pairing handshake verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/workspace; path=b145806bef66/11 entries; EXPECT=matched; output-sha256=64853e3af1e8d1ea0063bf8d1da4d0ee27a82822935c9d61cabccb6b202cb490; output-bytes=38

- [x] G4: approval cards appear only from live requests and never offer YOLO on the phone
  CHECK: node scripts/verify-remaining-companion.mjs approval
  EXPECT: approval verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/workspace; path=b145806bef66/11 entries; EXPECT=matched; output-sha256=99343298e2b4893106a169d93f85d251538638b4e65986b52e89c06a402c9215; output-bytes=29

- [x] G5: Android overlay capability stays not granted unless the OS reports it
  CHECK: node scripts/verify-remaining-companion.mjs overlay
  EXPECT: overlay verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/workspace; path=b145806bef66/11 entries; EXPECT=matched; output-sha256=e4765ab18e1732050794a54b26b87dced95654e6b9309b67375713304f54189c; output-bytes=28
