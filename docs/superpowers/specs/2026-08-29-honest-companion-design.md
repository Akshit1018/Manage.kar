# Honest Companion Shell Design

## Direction

Keep Manage.kar’s existing five-tab workspace, orb, editorial surfaces, and local stores. Do not clone Hermes desktop, Singularity’s suite, Tailscale’s device chrome, Termius host trees, or Screens Connect branding. This slice makes the companion honest and usable at 320px: presence words tell the truth, Home is Today, chat has one composer, pairing is a handshake, and tool approvals have a card even before a socket exists.

## Locked from prior sessions

- D001–D009 stay in force. Hermes source may be imported (MIT). Singularity / Tailscale / Termius / Screens may only be studied.
- Reject: 7-column Hermes kanban, DM-user pairing as machine pairing, a Plugins tab, xterm TUI, demo green “online” dots, Simulate pairing on the happy path.
- Adopt (jobs, not pixels): Today-first Home; machine status as a word; pairing as computer-confirms-phone; chat stream → stop → tool cards → approval card when a socket lands later.
- D003 demo exception remains: in-memory demo sessions may exist so the dialer is usable, but they must never read as live machines.

## Presence

Internal `SessionPresence` stays `active | idle | offline`. User-facing words:

| Source | Internal | Word | Dot |
| --- | --- | --- | --- |
| `demo` | any | `not paired` | muted, not green |
| `paired` | `active` | `reachable` | green |
| `paired` | `idle` | `asleep` | yellow |
| `paired` | `offline` | `unreachable` | red |
| none | — | `Not paired yet` | none |

Queued copy for a paired unreachable machine: `Queued — sends when the machine is reachable`. Demo copy stays `Saved locally — will send after pairing`. Never use the word `online` for demo or paired presence.

## Pairing

Empty sheet: one sentence, primary **Pair a computer**. Draft: name, kind, large code, **Copy link**, heading **Not a real QR yet** (the decorative grid is not a camera target). **Simulate pairing (dev)** stays in source (honest-copy contract) but renders only when the URL hash is `#dev` or the query contains `dev=1`. Waiting copy: `Open Hermes on the computer → Pair phone.` No fake “online” after simulate; simulated sessions remain `source: "paired"` so sends can become `Sent` (D009).

## Chats

One composer: the existing bottom dialer. Thread header has identity + status word, no second **Message** button. Empty thread has no third CTA. List loading is three skeleton rows, not `null`. Demo rows stay **Demo** plus **not paired**.

## Home and chrome

Overview main order: Today, then follow-ups, then counts. Global Add task / Note / Habit row is not shown on Chats. The seven unlabeled tool tiles are hidden below 640px (Goals / Time / Focus / Counts stay in Settings or existing sheets launched from Settings later; desktop overview may keep the launcher). Search is not a permanent field on Chats.

## Approvals

Ship the card contract now: Once / This chat / Always / Deny, countdown, denied/timed-out stay in the transcript, YOLO is a red banner `Approvals off on this machine` and is not offered as a phone choice. Do not invent a pending approval on first run (D003). The thread mounts the card only when a pending approval exists.

## Out of this slice

No real Hermes WebSocket, no plugin install UI, no seven-column board, no Flutter changes, no Android overlay.
