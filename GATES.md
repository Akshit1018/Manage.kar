# Gates: Hermes bridge plugin

OWNS: GATES.md, scripts/verify-hermes-bridge.mjs, scripts/hermes-bridge-stub.mjs, lib/hermes/plugin-pair.ts, lib/hermes/plugin-pair.test.ts, lib/hermes/qr-byte.ts, lib/hermes/qr-byte.test.ts, lib/hermes/status.ts, lib/pairing/types.ts, lib/pairing/handshake.ts, lib/pairing/pairing.ts, components/pairing-sheet.tsx, components/pair-qr.tsx, app/claim/page.tsx, app/globals.css, lib/theme/hermes-tokens.ts, lib/theme/hermes-tokens.test.ts, packages/hermes-managekar-plugin/**, docs/DECISIONS.md, docs/KNOWN_LIMITATIONS.md, docs/superpowers/grillme/2026-08-29-hermes-bridge-50.md, docs/superpowers/specs/2026-08-29-hermes-bridge-plugin.md

Scope: Extractable MIT Hermes plugin that mints a host QR or claim link; the companion claims it once and attaches over the official dashboard WebSocket; a local stub on this VM proves pair, claim, and session.create.

- [ ] G1: managekar.pair.v1 tickets parse and reject garbage
  CHECK: node scripts/verify-hermes-bridge.mjs protocol
  EXPECT: hermes bridge protocol verification passed
  EVIDENCE: pending

- [ ] G2: plugin package is installable as hermes plugins install owner/repo
  CHECK: node scripts/verify-hermes-bridge.mjs plugin
  EXPECT: hermes bridge plugin verification passed
  EVIDENCE: pending

- [ ] G3: local stub pair is single-use and session.create returns a Hermes session_id
  CHECK: node scripts/verify-hermes-bridge.mjs live
  EXPECT: hermes bridge live verification passed
  EVIDENCE: pending

- [ ] G4: companion claim UI and Bot Chat stay honest
  CHECK: node scripts/verify-hermes-bridge.mjs ui
  EXPECT: hermes bridge ui verification passed
  EVIDENCE: pending

- [ ] G5: editorial surfaces use the dashboard 0.5rem radius
  CHECK: node scripts/verify-hermes-bridge.mjs theme
  EXPECT: hermes bridge theme verification passed
  EVIDENCE: pending

- [ ] G6: fifty grill questions have answers and recommendations
  CHECK: node scripts/verify-hermes-bridge.mjs grill
  EXPECT: hermes bridge grill verification passed
  EVIDENCE: pending
