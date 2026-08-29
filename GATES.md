# Gates: install unlazy and audit every in-flight Manage.kar task

OWNS: .cursor/skills/unlazy/**, docs/superpowers/plans/2026-08-29-inflight-task-audit.md, docs/superpowers/evidence/2026-08-29-pr-snapshot.json, scripts/verify-inflight-audit.mjs, GATES.md, .gitignore, .superpowers/sdd/progress.md

Scope: Install the canonical Leonxlnx/unlazy skill so later agents can Read it, then publish an evidence-backed audit of every stacked PR, leftover product item, and live preview.

- [x] G1: the committed Cursor skill is unlazy from Leonxlnx and pins upstream da0b00a
  CHECK: node scripts/verify-inflight-audit.mjs
  EXPECT: inflight audit verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/workspace; path=565d104854b0/35 entries; EXPECT=matched; output-sha256=9ec9054acb8805bdf783bf96b141fba8480d49ed3a01dc35d9aebff3250603c9; output-bytes=35

- [x] G2: every open GitHub PR in the snapshot is classified in the audit
  CHECK: node scripts/verify-inflight-audit.mjs
  EXPECT: inflight audit verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/workspace; path=565d104854b0/35 entries; EXPECT=matched; output-sha256=9ec9054acb8805bdf783bf96b141fba8480d49ed3a01dc35d9aebff3250603c9; output-bytes=35

- [x] G3: leftover product items and stale-preview evidence are written, not implied
  CHECK: node scripts/verify-inflight-audit.mjs
  EXPECT: inflight audit verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/workspace; path=565d104854b0/35 entries; EXPECT=matched; output-sha256=9ec9054acb8805bdf783bf96b141fba8480d49ed3a01dc35d9aebff3250603c9; output-bytes=35
