# Editorial Mobile UI and Orb Design

## Direction

Preserve Manage.kar's existing product model, tabs, data, and working interactions while adopting the reference's editorial iOS character: oversized typography, restrained chrome, modular content cards, rounded controls, warm accent surfaces, and deliberate whitespace. This is a visual and interaction improvement, not a replacement application.

## Responsive contract

- Every route, tab, modal, sheet, form, card, composer, and navigation control must remain usable from 320px mobile widths through tablet and desktop.
- Mobile is single-column and touch-first. Tablet and desktop may progressively add columns without changing information hierarchy.
- Content must not overflow horizontally. Touch targets are at least 44px. Fixed controls respect safe-area and keyboard/visual-viewport insets.
- Bottom navigation remains reachable and legible. Long labels may compact visually but retain accessible names.

## Floating orb

- Use one Pointer Events gesture path with pointer capture for mouse, touch, and pen.
- A tap reveals Record, Task, Note, and Chats. A stationary long press opens recording on release.
- Drag starts only after the jitter threshold and cancels both long-press and open actions.
- The orb follows at animation-frame cadence. On release it clamps vertically outside navigation/safe areas, snaps to the nearest horizontal edge, then persists once.
- Resize, orientation, and visual-viewport changes re-clamp the orb so it cannot become unreachable.
- The action tray opens inward from the parked edge and remains inside the viewport.
- Keyboard users can reveal actions with Enter/Space, nudge with arrow keys, and park with Home/End. Reduced-motion users get immediate placement.

## Visual system

- Large, high-contrast section titles and compact supporting copy.
- Modular cards with asymmetric editorial layouts where content supports them, while maintaining predictable reading order.
- Warm coral/orange is an optional focused or featured surface; the existing Hermes blue/teal theme remains the semantic primary color.
- Borders, shadows, and blur are quieter than the current generic dashboard treatment.
- Motion communicates state changes only and respects reduced motion.

## Existing sections

- Home: editorial summary modules and quick actions with clearer hierarchy.
- Tasks: board/list controls and task metadata fit narrow screens without clipped actions.
- Notes: label filters, Ask panel, pinned notes, and note actions wrap safely.
- Chats: list/thread, machine pairing, composer, presence, and queued state adapt to mobile keyboards.
- Habits and all auxiliary tools: responsive cards and forms using the same visual language.
- Modals and sheets: full-height mobile sheets, centered constrained dialogs on larger screens, safe-area padding, and scrollable bodies.

## Verification

- Pure geometry and release behavior are test-driven in `lib/ui/orb-gesture.test.ts`.
- Browser checks cover 320x568, 375x812, 390x844, tablet, desktop, landscape, keyboard viewport changes, dragging, edge snapping, resize recovery, tap, and long-press cancellation.
- Run the full unit suite, lint, and production build.
