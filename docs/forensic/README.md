# Forensic product intelligence

**Product:** Manage.kar (`Akshit1018/Manage.kar`)  
**Inspected revision:** `cursor/fix-red-team-findings-e2f4` @ `34ef512` (this docs branch is `cursor/forensic-intelligence-e2f4`)  
**Date:** 2026-08-23  
**Method:** Reconstruct from source → verify in browser at `http://127.0.0.1:3000` → compare to live competitors and open-source local-first apps → attack → challenge false positives.

This is **not** a second copy of `docs/RED_TEAM_FINDINGS.md`. That ledger attacked the product-foundation slice. This pack reconstructs the **post-remediation** product and asks what reality will still punish.

## Sequence executed

1. Codebase archaeology (no criticism first)
2. Feature truth map
3. Product mental model
4. Hostile persona walks
5. Competitor + open-source reconstruction
6. Absence, friction, support simulation
7. Negative graph / root-cause clusters
8. Second-pass “you missed something”
9. Third-pass “overreaction”

## Documents

| File | Purpose |
| --- | --- |
| [JOURNEY_TRACES.md](./JOURNEY_TRACES.md) | USER → … → STORAGE map for every major journey |
| [FEATURE_TRUTH_MAP.md](./FEATURE_TRUTH_MAP.md) | Claimed vs real classification |
| [PRODUCT_MENTAL_MODEL.md](./PRODUCT_MENTAL_MODEL.md) | What this product is actually trying to be |
| [ABSENT_CAPABILITIES.md](./ABSENT_CAPABILITIES.md) | What a user reasonably expects that is missing |
| [PERSONA_WALKS.md](./PERSONA_WALKS.md) | Ten adversarial users on the same journeys |
| [SUPPORT_AND_FRICTION.md](./SUPPORT_AND_FRICTION.md) | Click counts and predicted tickets |
| [IMPLEMENTATION_QUALITY.md](./IMPLEMENTATION_QUALITY.md) | Per-area scores, not “exists = good” |
| [COMPETITOR_ATTACK_SCRIPT.md](./COMPETITOR_ATTACK_SCRIPT.md) | What a competitor can truthfully say |
| [NEGATIVE_GRAPH.md](./NEGATIVE_GRAPH.md) | Root defects → business consequence |
| [SECOND_AND_THIRD_PASS.md](./SECOND_AND_THIRD_PASS.md) | Missed items and rejected overreaches |
| [SKILL_TOOL_LOG.md](./SKILL_TOOL_LOG.md) | Which tools were actually used |

## Live evidence

- `docs/forensic/evidence/desktop-1280.png`
- `docs/forensic/evidence/mobile-390.png`

## What this pack is allowed to say is proven

Only what was read in source or reproduced in the browser on 2026-08-23. Competitor facts are cited. Market hypotheses are labeled **HYPOTHESIS**.