# Home PA first-run Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make first-open Home a short PA brief with one next step, without empty lists, Export, or a second chat dock.

**Architecture:** Pure chrome helpers and briefing copy stay in `lib/ui`. Dashboard wires existing TaskModal and PairingSheet. No new API, store, or workspace field.

**Tech Stack:** Next.js 15, React 19, TypeScript, Vitest, Flutter Home helpers.

## Issue map

### Frontend (this plan — surgical)

| Issue | Change |
| --- | --- |
| Briefing is four paragraphs, no next step | Short copy + Add task / Pair / Ask buttons |
| Empty Chat/Task/Notes/Habits blocks | Hide a preview until it has a real item |
| Chat rows that only say "No messages yet" | Treat as empty; keep the Bot Chat circle |
| Export + composer dock crowd Home | Hide Export and ChatComposer on overview |
| Black/White briefing blends into canvas | Stronger card surface on those skins only |

### Backend (not this plan)

No briefing API, LLM job, or server Home. PairingSheet is the existing pair path.

### Database (not this plan)

No new tables or workspace fields.

### Locks

Jump tiles stay Task / Notes / Chat / Habit. No Hello, beige, 89%, or Simulate on the happy path.

## Tasks

- [x] Chrome helpers: `showWorkspaceExport` / `showComposerDock` false on overview
- [x] Short `agentDayBriefing` + `showHomeListPreview` / `chatHasHomePreview`
- [x] Dashboard: briefing actions, PairingSheet, hide Export + composer on Home
- [x] HomeFeed: hide empty Chat / Task / Notes / Habits previews
- [x] White/Black briefing contrast + action row CSS
- [x] Flutter briefing, actions, hidden empty lists
- [x] D014 + verify-home-feed / leftover-names
- [x] Vitest + browser first-run check + public preview link

---
