# Gates: Assistive ball bugs and pair listener

OWNS: GATES.md, scripts/verify-ball-bugs.mjs, app/claim/page.tsx, lib/ui/orb-gesture.ts, lib/ui/orb-gesture.test.ts, components/floating-toggle.tsx, apps/mobile/lib/src/widgets/assist_orb.dart, apps/mobile/lib/src/widgets/assist_orb_geometry.dart, apps/mobile/lib/src/screens/shell_screen.dart, apps/mobile/test/widget_test.dart, apps/mobile/test/assist_orb_geometry_test.dart, packages/hermes-managekar-plugin/pairing.py, packages/hermes-managekar-plugin/pairing_test.py, packages/hermes-managekar-plugin/serve.py, packages/hermes-managekar-plugin/serve_test.py, packages/hermes-managekar-plugin/cli.py, packages/hermes-managekar-plugin/adapter.py, packages/hermes-managekar-plugin/README.md, packages/hermes-managekar-plugin/plugin.yaml, packages/hermes-managekar-plugin/dashboard/plugin_api.py, docs/DECISIONS.md

Scope: The in-app ball parks on an edge, its tray does not cover it, tap still opens actions after lost capture, long-press matches WhatsApp timing, the Flutter ball hides on Chats and snaps after a drag, and `hermes managekar --serve` lets a phone claim without dashboard auth while returning the dashboard endpoint.

- [ ] G1: default park snaps to the right edge and the tray misses the disk
  CHECK: node scripts/verify-ball-bugs.mjs geometry
  EXPECT: ball geometry verification passed
  EVIDENCE: pending

- [ ] G2: hover and lost-capture policies do not swallow taps
  CHECK: node scripts/verify-ball-bugs.mjs gesture
  EXPECT: ball gesture verification passed
  EVIDENCE: pending

- [ ] G3: pairing sheet and Flutter orb stay honest
  CHECK: node scripts/verify-ball-bugs.mjs ui
  EXPECT: ball ui verification passed
  EVIDENCE: pending

- [ ] G4: pair listener claim returns the dashboard and rejects reuse
  CHECK: node scripts/verify-ball-bugs.mjs serve
  EXPECT: ball serve verification passed
  EVIDENCE: pending
