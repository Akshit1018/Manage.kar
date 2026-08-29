# Home agent feed — 2026-08-29

## Problem

Home still reads as a title ("Home") plus a device disclaimer, then Today
and count tiles. The founder wants a greeting + one-line agent day sum-up,
circles for the user's bots, four square jumps (Task / Notes / Chat / Habit),
then a pinned-or-last item with real progress/thinking, then short faded
lists. Keep existing Hermes and Classic skins; add White and Black.

## Decision

Surgical overview-only change. Other tabs keep their lists and chrome.

1. Header on overview: `homeGreeting` (`Today` or `Hello, {name}`) plus
   `agentDaySumUp` from live doing/today/thinking/approval state. No fake
   weekly percent.
2. Circles: bot-identity sessions (`Bot Chat`). If none, visible sessions.
   Tap opens that session on the Chats tab. Demo stays labeled Demo.
3. Four square tiles in one row jump to the existing tabs.
4. Spotlight: busy chat (thinking / tool / approval), else last chat with
   a message, else a doing/today/open task with checklist progress.
5. Then Chat / Task / Notes / Habit headings. Tasks show 4 items + View all
   with an iOS-style bottom fade. Same pattern for the others.
6. Skins: `hermes` | `classic` | `white` | `black`. White is paper + ink.
   Black is `#000` + light ink. Site tokens stay chrome-only.

## Out of scope

- Cloning the beige reflection mock as a third canvas
- Plugin store, fake online, Simulate on the happy path
- Rewriting Flutter Home (skins persist there; layout stays)
