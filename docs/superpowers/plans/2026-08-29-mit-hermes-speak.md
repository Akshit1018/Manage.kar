# MIT Hermes Speak Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Speak the MIT hermes-agent dashboard contract so a local helper can be probed, attached, and messaged without fake pairing.

**Architecture:** Parse official `/api/status`, build official `/api/ws?token=` URLs, attach with `session.create`, persist endpoint + Hermes session id on the paired machine, map Hermes session ids onto dialer rows for stream/stop/approvals.

**Tech Stack:** TypeScript, Vitest, existing `HermesJsonRpcClient`, Next.js pairing sheet.

## Global Constraints

- D001–D011 stay in force. No plugin store, no 7-column board, no fake online, no Simulate on the happy path.
- QR remains labeled not real. Hermes DM pairing is not machine pairing.
- Tokens stay in the existing local workspace document; never log them.

---

### Task 1: Official endpoint + status + protocol

**Files:** `lib/hermes/endpoint.ts`, `lib/hermes/status.ts`, `lib/hermes/protocol.ts`, tests.

- [x] Write failing tests for status parse, WS URL + token, id-first JSON-RPC decode, extra methods/events
- [x] Implement until green

### Task 2: Probe + attach handshake

**Files:** `lib/pairing/*`, `lib/hermes/attach.ts`, `lib/hermes/session-map.ts`

- [x] Status probe never pairs; Connect + `session.create` pairs and stores endpoint/token/hermesSessionId
- [x] `needs_token` copy

### Task 3: Wire chats + send + sheet

**Files:** `components/pairing-sheet.tsx`, `components/workspace/chats-view.tsx`, `components/chat-composer.tsx`, `lib/hermes/session-client.ts`, `lib/hermes/send.ts`, docs

- [x] Helper URL + token + Connect
- [x] Send/stop/approval use Hermes session id
- [x] Docs + verify script + gates
