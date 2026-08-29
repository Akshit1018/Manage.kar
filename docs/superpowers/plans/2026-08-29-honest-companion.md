# Honest Companion Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make presence, Home, chat, and pairing honest at 320px without adding a Hermes socket, plugin store, or desktop-scale board.

**Architecture:** Keep `SessionPresence` and pairing/dialer stores. Add user-facing presence words and chrome helpers as pure functions. Components pass `source` into those helpers. Approval is a presentational card driven by an optional pending value.

**Tech Stack:** Next.js 15, React 19, TypeScript, Vitest. No new runtime dependencies.

## Global Constraints

- Preserve persisted workspace, dialer, and pairing shapes.
- D003: no fake seed data; demos stay in-memory and never read as live.
- D009: simulate pairing remains the only completion path until Hermes connects, but it is not on the happy path.
- Honest copy: never claim a send, server, or QR scan that did not happen.
- Touch targets stay ≥44px; no new drag library.
- Failing tests before production logic changes.

---

### Task 1: Honest presence words

**Files:**
- Modify: `lib/dialer/types.ts`
- Modify: `lib/dialer/dialer.ts`
- Modify: `lib/dialer/dialer.test.ts`
- Modify: `lib/ui/workspace-sections-layout.ts`
- Modify: `lib/ui/workspace-sections-layout.test.ts`
- Modify: `components/workspace/chats-view.tsx`
- Modify: `components/chat-composer.tsx`
- Modify: `components/pairing-sheet.tsx`

**Interfaces:**
- Produces: `presenceLabel(presence, source?)`, `presenceDotClass(presence, source?)` — demo always `not paired` + muted dot; paired maps active→`reachable`, idle→`asleep`, offline→`unreachable`.
- Produces: `WheelItem.source?: SessionSource`.
- Produces: `chatRowAccessibleName` includes optional `statusWord`.

- [ ] **Step 1: Write the failing tests** in `lib/dialer/dialer.test.ts`:

```ts
expect(presenceLabel("active")).toBe("reachable")
expect(presenceLabel("idle")).toBe("asleep")
expect(presenceLabel("offline")).toBe("unreachable")
expect(presenceLabel("active", "demo")).toBe("not paired")
expect(presenceLabel("offline", "demo")).toBe("not paired")
expect(presenceDotClass("active", "demo")).not.toContain("emerald")
expect(queueCopy({ status: "queued", source: "paired", presence: "offline" })).toMatch(/reachable/i)
expect(queueCopy({ status: "queued", source: "paired", presence: "offline" })).not.toMatch(/online/i)
```

- [ ] **Step 2: Run** `pnpm test lib/dialer/dialer.test.ts` — expect FAIL on `"online"`.
- [ ] **Step 3: Implement** the label/dot/queueCopy changes and pass `source` at every call site. Add `source` on `wheelItems`. Extend `chatRowAccessibleName` with `statusWord`.
- [ ] **Step 4: Run** `pnpm test lib/dialer/dialer.test.ts lib/ui/workspace-sections-layout.test.ts`.
- [ ] **Step 5: Commit** `fix(chats): never label demo sessions online`

---

### Task 2: Pairing handshake chrome

**Files:**
- Create: `lib/pairing/developer.ts`
- Create: `lib/pairing/developer.test.ts`
- Modify: `components/pairing-sheet.tsx`
- Modify: `lib/ui/workspace-sections-layout.ts` (honest copy still requires the simulate string in source)

**Interfaces:**
- Produces: `showSimulatedPairingControl({ hash, search }: { hash: string; search: string }): boolean` — true only for `#dev` or `dev=1` query.

- [ ] **Step 1: Failing tests**

```ts
expect(showSimulatedPairingControl({ hash: "", search: "" })).toBe(false)
expect(showSimulatedPairingControl({ hash: "#dev", search: "" })).toBe(true)
expect(showSimulatedPairingControl({ hash: "", search: "?dev=1" })).toBe(true)
```

- [ ] **Step 2: Run** `pnpm test lib/pairing/developer.test.ts` — FAIL (module missing).
- [ ] **Step 3: Implement** helper. Empty CTA **Pair a computer**. Draft heading **Not a real QR yet**. Simulate button only when helper is true. Keep the exact strings `Simulate pairing (dev)` and `paired (simulation)` in the file.
- [ ] **Step 4: Run** `pnpm test lib/pairing/developer.test.ts lib/ui/workspace-sections-layout.test.ts`.
- [ ] **Step 5: Commit** `fix(pairing): hide simulate pairing on the happy path`

---

### Task 3: One composer and honest chat shells

**Files:**
- Modify: `components/workspace/chats-view.tsx`
- Modify: `lib/ui/workspace-sections-layout.ts`
- Modify: `lib/ui/workspace-sections-layout.test.ts`

**Interfaces:**
- Consumes: Task 1 presence helpers.
- Produces: source contract — thread has no header Message button; empty thread has no `actionLabel`; loading uses `mk-chat-skeleton` (three rows).

- [ ] **Step 1: Extend** `WorkspaceSectionsSourceContract` with `chatsThreadHasNoHeaderMessage`, `chatsEmptyHasNoMessageCta`, `chatsLoadingUsesSkeletons`.
- [ ] **Step 2: Run** the layout test — FAIL.
- [ ] **Step 3: Implement** ChatThread without the header Message button; empty state description only; `ChatsView` renders three `mk-chat-skeleton` articles while `dialer` is null. Pass `statusWord` into `chatRowAccessibleName`.
- [ ] **Step 4: Run** `pnpm test lib/ui/workspace-sections-layout.test.ts`.
- [ ] **Step 5: Commit** `fix(chats): one composer and skeleton list`

---

### Task 4: Home Today-first and per-tab chrome

**Files:**
- Create: `lib/ui/home-chrome.ts`
- Create: `lib/ui/home-chrome.test.ts`
- Modify: `components/workspace/dashboard.tsx`

**Interfaces:**
- Produces: `showGlobalCreateRow(view)`, `showWorkspaceSearch(view)`, `showToolLauncher(view, width)`, `overviewPlacesTodayBeforeCounts(source)`.

```ts
showGlobalCreateRow("chats") === false
showGlobalCreateRow("overview") === true
showWorkspaceSearch("chats") === false
showToolLauncher("overview", 320) === false
showToolLauncher("overview", 640) === true
```

- [ ] **Step 1: Write failing tests** for those helpers plus a source-order assertion on `dashboard.tsx`.
- [ ] **Step 2: Run** `pnpm test lib/ui/home-chrome.test.ts` — FAIL.
- [ ] **Step 3: Implement** helpers and apply them in the dashboard header/overview.
- [ ] **Step 4: Run** `pnpm test lib/ui/home-chrome.test.ts`.
- [ ] **Step 5: Commit** `fix(home): Today first and hide phone tool launcher`

---

### Task 5: Approval card primitive

**Files:**
- Create: `lib/hermes/approval.ts`
- Create: `lib/hermes/approval.test.ts`
- Create: `components/approval-card.tsx`
- Modify: `components/workspace/chats-view.tsx`

**Interfaces:**
- Produces: `ApprovalChoice = "once" | "session" | "always" | "deny"`; `approvalChoiceLabel`; `approvalTimeoutLabel(secondsLeft)`; `yoloBannerCopy()` → `Approvals off on this machine`; `resolvePendingApproval(list)` → first or null.
- `ApprovalCard` returns null when `approval` is null. Chats thread renders it. No default pending item (D003).

- [ ] **Step 1: Failing tests** for labels, timeout, YOLO copy, resolve empty → null.
- [ ] **Step 2: Run** `pnpm test lib/hermes/approval.test.ts` — FAIL.
- [ ] **Step 3: Implement** module + card; mount in thread with `approval={null}` (or a real list when one exists).
- [ ] **Step 4: Run** `pnpm test lib/hermes/approval.test.ts`.
- [ ] **Step 5: Commit** `feat(chats): add Hermes approval card contract`

---

### Task 6: Decisions, suite, and verify

**Files:**
- Modify: `docs/DECISIONS.md` (D003 demo wording, D009 simulate gate, D010 Home/chrome)
- Modify: `.superpowers/sdd/progress.md` (new ledger section)

- [ ] Update decisions to match this slice.
- [ ] Run `pnpm test`, `pnpm lint`.
- [ ] Browser-check Home, Chats, pairing at 320 and 390.
- [ ] Commit docs if needed, push `cursor/honest-companion-e2f4`, open PR onto `cursor/editorial-mobile-ui-e2f4`.
