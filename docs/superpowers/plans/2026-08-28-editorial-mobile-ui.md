# Editorial Mobile UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every existing Manage.kar web surface responsive from 320px upward, adopt the approved editorial iOS visual direction, and repair the floating orb gesture system.

**Architecture:** Preserve the dashboard's existing routes, stores, and feature components. First establish shared responsive surface tokens, then repair the shell and gesture geometry, then adapt each feature group independently. Gesture decisions remain pure functions in `lib/ui/orb-gesture.ts`; the component uses Pointer Events and pointer capture.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Vitest, Playwright MCP.

## Global Constraints

- Preserve every existing feature, route, persisted state shape, orb action, and honest-copy rule.
- Fully usable from 320px mobile widths through tablet and desktop.
- Touch targets are at least 44px; fixed UI respects safe-area and visual-keyboard insets.
- No new runtime dependency for dragging or animation.
- Use failing tests before production logic changes.

---

### Task 1: Shared editorial surface system

**Files:**
- Modify: `app/globals.css`
- Modify: `components/ui/button.tsx`
- Modify: `components/ui/input.tsx`
- Modify: `components/ui/select.tsx`
- Modify: `components/ui/textarea.tsx`

**Interfaces:**
- Produces: reusable `.mk-editorial-card`, `.modern-card`, `.glass-card`, `.mk-section-title`, `.mk-toolbar`, and responsive touch-target rules.

- [ ] Add semantic CSS utilities based on existing `--background`, `--card`, `--foreground`, `--muted-foreground`, `--primary`, and radius variables; do not hardcode light-only text colors.
- [ ] Ensure form controls render at 16px on narrow iOS widths to avoid browser zoom and shared interactive controls have 44px minimum hit areas.
- [ ] Run `pnpm lint` and `pnpm build`.
- [ ] Commit as `feat(ui): add responsive editorial surface system`.

### Task 2: Test-drive safe orb geometry

**Files:**
- Modify: `lib/ui/orb-gesture.test.ts`
- Modify: `lib/ui/orb-gesture.ts`

**Interfaces:**
- Produces: `OrbBounds`, `clampOrbPosition(x, y, bounds)`, `snapOrbToEdge(position, bounds)`, and inward-aware `iconBarPosition`.

- [ ] Add failing tests proving: a 56px orb stays above a 76px bottom reserve; right/left release snaps to the nearest edge; a previously valid 390x844 position re-clamps inside 320x568; and the tray remains visible on either edge.
- [ ] Run `pnpm test lib/ui/orb-gesture.test.ts` and confirm failures identify missing bottom reserve/snap behavior.
- [ ] Implement the smallest pure geometry changes needed to pass.
- [ ] Run the focused test and then `pnpm test`.
- [ ] Commit as `fix(orb): add safe bounds and nearest-edge snapping`.

### Task 3: Unified pointer gesture controller

**Files:**
- Modify: `components/floating-toggle.tsx`

**Interfaces:**
- Consumes: geometry functions from Task 2.
- Preserves: tap action tray; long-press recording on release; Record/Task/Note/Chats callbacks.

- [ ] Replace duplicate mouse/touch document listeners with `onPointerDown`, pointer capture, `onPointerMove`, `onPointerUp`, and `onPointerCancel`.
- [ ] Start drag after `DRAG_THRESHOLD_PX`, cancel long press, and hide the tray; schedule visual position updates through one `requestAnimationFrame`.
- [ ] On release, snap to the nearest edge and persist once. Add a resize/orientation/`visualViewport.resize` effect that re-clamps saved placement.
- [ ] Add Enter/Space tray activation, arrow-key movement, Home/End edge parking, reduced-motion-safe placement, and `touch-action: none`.
- [ ] Browser verify at 320x568 and 390x844: drag beyond element bounds, snap both edges, rotate/resize recovery, short tap, long-press, and drag cancellation.
- [ ] Commit as `fix(orb): unify pointer dragging and responsive parking`.

### Task 4: Responsive shell, header, quick actions, and navigation

**Files:**
- Modify: `components/workspace/dashboard.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Preserves: `WorkspaceView`, URL state, five existing tab actions, modal callbacks.

- [ ] Refactor the header and quick actions to wrap safely at 320px, with icon-only secondary actions where text would overflow.
- [ ] Apply editorial hierarchy: oversized section heading, quieter support copy, modular summary cards, warm featured surface using semantic theme-compatible variables.
- [ ] Reserve one shared bottom-chrome space for nav, composer, and orb; ensure page content scrolls above it.
- [ ] Keep mobile nav at 44px+ targets and provide equivalent persistent section navigation on larger screens.
- [ ] Browser verify all five tabs at 320, 375, 390, 768, and 1280 widths with no horizontal overflow.
- [ ] Commit as `feat(ui): refresh responsive workspace shell`.

### Task 5: Responsive overlays and forms

**Files:**
- Modify: `components/mobile-sheet.tsx`
- Modify: `app/globals.css`
- Modify: `components/settings-modal.tsx`
- Modify: `components/profile-modal.tsx`
- Modify: `components/share-modal.tsx`
- Modify: `components/confirm-sheet.tsx`

**Interfaces:**
- Preserves: body scroll lock, nested-sheet behavior, existing close callbacks.

- [ ] Restore mobile backdrop dismissal while preventing pointer-through to the workspace.
- [ ] Make mobile sheets full-height/safe-area aware with one scrolling body; keep constrained centered dialogs on larger screens.
- [ ] Adapt section tabs, switch rows, form grids, and footers to 320px without clipped labels or buttons.
- [ ] Run `pnpm test lib/ui/body-scroll-lock.test.ts lib/ui/sheet-layout.test.ts`.
- [ ] Browser verify open/close, nested confirmation, keyboard input, and scrolling.
- [ ] Commit as `fix(ui): make sheets and settings responsive`.

### Task 6: Tasks and notes responsive editorial pass

**Files:**
- Modify: `components/workspace/task-list.tsx`
- Modify: `components/workspace/today-section.tsx`
- Modify: `components/workspace/follow-up-section.tsx`
- Modify: `components/task-modal.tsx`
- Modify: `components/workspace/note-list.tsx`
- Modify: `components/note-modal.tsx`
- Modify: `components/label-picker.tsx`
- Modify: `components/label-chips.tsx`
- Modify: `components/voice-recorder.tsx`

**Interfaces:**
- Preserves: board transitions, completion semantics, follow-ups, labels, pinning, Ask results, voice callbacks.

- [ ] Make task/note toolbars wrap, filters horizontally scroll, metadata truncate safely, and action hit areas reach 44px.
- [ ] Use horizontal snap columns for task board on narrow screens rather than three long stacked columns.
- [ ] Restyle cards using Task 1's surfaces without changing data hierarchy.
- [ ] Make modal footers and voice controls stack below 360px and remain keyboard-safe.
- [ ] Run all task, note, label, follow-up, and store tests.
- [ ] Browser verify create/edit/filter/board/pin/Ask/voice layouts at 320 and 390 widths.
- [ ] Commit as `feat(ui): optimize task and note surfaces for mobile`.

### Task 7: Chats, pairing, composer, and remaining sections

**Files:**
- Modify: `components/workspace/chats-view.tsx`
- Modify: `components/chat-composer.tsx`
- Modify: `components/pairing-sheet.tsx`
- Modify: `components/workspace/habit-list.tsx`
- Modify: `components/habit-modal.tsx`
- Modify: `components/habit-dashboard.tsx`
- Modify: `components/focus-modal.tsx`
- Modify: `components/goal-manager.tsx`
- Modify: `components/time-tracker.tsx`
- Modify: `components/analytics-dashboard.tsx`
- Modify: `components/clipboard-monitor.tsx`
- Modify: `app/shared/[data]/page.tsx`

**Interfaces:**
- Preserves: honest outbox states, pairing simulation labels, chat targeting, habit/focus/goal/time data flows, shared import behavior.

- [ ] Stack or compact chat headers at narrow widths; keep titles truncatable and action labels accessible.
- [ ] Ensure composer, orb, and nav never overlap, including with `--mk-keyboard`; constrain pairing code/QR content.
- [ ] Remove nested fixed-height scroll traps from habit/analytics sheets and apply shared responsive surfaces to all auxiliary tools.
- [ ] Stack the shared-import header and actions on narrow screens.
- [ ] Run dialer, pairing, habits, workspace, and visual-viewport tests.
- [ ] Browser verify every remaining section at 320, 390, 768, and desktop widths.
- [ ] Commit as `feat(ui): complete responsive pass across workspace sections`.

### Task 8: Cross-screen regression verification

**Files:**
- Modify only if verification finds a scoped defect.

- [ ] Run `pnpm test`; expect all tests green.
- [ ] Run `pnpm lint`; expect no errors.
- [ ] Run `pnpm build`; expect successful production build.
- [ ] Use browser automation to inspect every tab and every sheet at 320x568, 375x812, 390x844, 844x390, 768x1024, and 1280x800.
- [ ] Verify no `scrollWidth > clientWidth`, no controls under bottom chrome, and no console errors.
- [ ] Commit any verified fixes separately, push `cursor/editorial-mobile-ui-e2f4`, and update the PR.
