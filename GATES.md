# Gates: Home greeting, agent circles, jump tiles

OWNS: GATES.md, scripts/verify-home-feed.mjs, docs/superpowers/specs/2026-08-29-home-agent-feed-design.md, docs/DECISIONS.md, lib/ui/home-feed.ts, lib/ui/home-feed.test.ts, lib/ui/home-chrome.ts, lib/ui/home-chrome.test.ts, components/workspace/home-feed.tsx, components/workspace/dashboard.tsx, lib/theme/apply-theme.ts, lib/theme/apply-theme.test.ts, lib/theme/hermes-tokens.ts, lib/theme/hermes-tokens.test.ts, app/globals.css, lib/domain/types.ts, components/settings-modal.tsx, apps/mobile/lib/src/theme/app_theme.dart, apps/mobile/lib/src/screens/settings_screen.dart, apps/mobile/test/theme_test.dart, apps/api/src/app.ts, apps/api/src/import-backup.ts

Scope: Overview header becomes greeting + honest day sum-up. Agent circles open Bot Chat. Four square jump tiles. Spotlight + faded previews. Hermes and Classic stay; White and Black skins are added. Other tabs stay as they are.

- [x] G1: home-feed helpers pick agents, sum-up, spotlight, and preview slices
  CHECK: node scripts/verify-home-feed.mjs logic
  EXPECT: home feed logic verification passed
  EVIDENCE: 2026-08-29 verify-home-feed.mjs + vitest 379 passed

- [x] G2: overview chrome uses HomeFeed, greeting, and four jump tiles
  CHECK: node scripts/verify-home-feed.mjs ui
  EXPECT: home feed ui verification passed
  EVIDENCE: 2026-08-29 dashboard renders HomeFeed; leftover-names passed

- [x] G3: White and Black skins exist without replacing Hermes or Classic
  CHECK: node scripts/verify-home-feed.mjs theme
  EXPECT: home feed theme verification passed
  EVIDENCE: 2026-08-29 apply-theme + Flutter theme_test white/black passed
