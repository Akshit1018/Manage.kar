# Gates: Leftover name cleanup

OWNS: GATES.md, scripts/verify-leftover-names.mjs, lib/dialer/dialer.ts, lib/dialer/dialer.test.ts, lib/hermes/chat-identity.test.ts, lib/ui/home-chrome.ts, lib/ui/home-chrome.test.ts, components/workspace/dashboard.tsx, app/layout.tsx, public/manifest.json, apps/mobile/lib/src/state/dialer.dart, apps/mobile/lib/src/screens/shell_screen.dart, apps/mobile/test/widget_test.dart, docs/DECISIONS.md

Scope: User-visible leftover names match the locked companion copy: demo bot is Bot Chat, unnamed Home is Today, document title is Hermes companion.

- [ ] G1: leftover Research bot and Your workspace titles are gone from live sources
  CHECK: node scripts/verify-leftover-names.mjs
  EXPECT: leftover name verification passed
  EVIDENCE: pending
