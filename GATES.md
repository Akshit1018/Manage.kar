# Gates: Hermes host install and live bridge

OWNS: GATES.md, scripts/verify-hermes-host-install.mjs, docs/superpowers/grillme/2026-08-29-hermes-host-50.md, docs/superpowers/specs/2026-08-29-hermes-host-install-design.md, docs/DECISIONS.md, packages/hermes-managekar-plugin/**, scripts/hermes-bridge-stub.mjs, scripts/verify-hermes-bridge.mjs, lib/hermes/**, components/pair-qr.tsx, app/globals.css, lib/theme/hermes-tokens.ts

Scope: Hermes is installed on this VM far enough to mint a host QR, claim once, and attach over the official dashboard socket; leftover companion chrome matches Hermes; a 50-question grill records what last-30-days MIT code actually allows. A separate public plugin GitHub repo is not claimed if `gh` cannot create it.

- [ ] G1: last-30-days plugin, dashboard, Bot Chat, and theme facts are recorded from clone plus search
  CHECK: node scripts/verify-hermes-host-install.mjs research
  EXPECT: hermes host research verification passed
  EVIDENCE: pending

- [ ] G2: fifty grill questions have answers and suggestions
  CHECK: node scripts/verify-hermes-host-install.mjs grill
  EXPECT: hermes host grill verification passed
  EVIDENCE: pending

- [ ] G3: pair listener claim returns the dashboard endpoint and a second claim is 409
  CHECK: node scripts/verify-hermes-host-install.mjs serve
  EXPECT: hermes host serve verification passed
  EVIDENCE: pending

- [ ] G4: live attach path talks /api/status then /api/ws session.create
  CHECK: node scripts/verify-hermes-host-install.mjs live
  EXPECT: hermes host live verification passed
  EVIDENCE: pending

- [ ] G5: plugin folder stays extractable MIT and the companion keeps Bot Chat plus dashboard radius
  CHECK: node scripts/verify-hermes-host-install.mjs companion
  EXPECT: hermes host companion verification passed
  EVIDENCE: pending
