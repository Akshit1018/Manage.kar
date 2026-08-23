# Unverified assumptions

This audit marks uncertainty on purpose. Do not treat these as proven defects.

| ID | Claim | Status | Why unverified |
| --- | --- | --- | --- |
| UA-1 | Voice notes become silent after refresh | HIGH CONFIDENCE, not browser-proven | `handleVoiceNote` stores `URL.createObjectURL(audioBlob)`. Blob URLs die with the document. We did not record audio in this environment (no mic grant). |
| UA-2 | `parseBackup("{}")` is accepted and can wipe on import | HIGH CONFIDENCE from code | `normalizeWorkspace` accepts any object. Browser file-picker import was not driven. |
| UA-3 | Habit `completedToday` never rolls at local midnight | HIGH CONFIDENCE from code | No date-keyed reset exists. We did not wait across midnight or mock the clock. |
| UA-4 | Habit streak increments twice if you complete → undo → complete the same day | HIGH CONFIDENCE from code | `streak + 1` on every on-toggle. Not clicked in the browser this pass. |
| UA-5 | Focus tap-to-unlock is flaky because `tapCount` is stale in the timeout | POSSIBLE | Closure on `tapCount` in `setTimeout`. Not tap-tested. |
| UA-6 | Time tracker `currentTime` drifts after pause/resume | POSSIBLE | Resume rewrites `startTime` from `duration`. Not timed. |
| UA-7 | `localStorage` quota (~5MB) will throw and lose the last write | HIGH CONFIDENCE generally, not reproduced | No quota-exceeded test. Voice blobs would accelerate this. |
| UA-8 | Safari private mode / iOS ITP wipes the workspace | HYPOTHESIS | Not tested on WebKit. |
| UA-9 | WhatsApp share on Android fires both intent and a 2s `wa.me` fallback | HIGH CONFIDENCE from code | Desktop path opens `wa.me`. Mobile not used. |
| UA-10 | Users want this vs TickTick/Super Productivity | HYPOTHESIS | No user interviews. Market evidence is secondary sources. |
| UA-11 | Production host `https://manage-kar.vercel.app` exists and matches this repo | UNVERIFIED | Only in `app/layout.tsx` `metadataBase`. Not fetched. |
| UA-12 | Parallel / Firecrawl CLIs would have changed competitor conclusions | UNVERIFIED | `parallel-cli` missing; Firecrawl CLI present but **unauthenticated**. Research used built-in web search + official pages. |
| UA-13 | RSC `?_rsc=` 500 during modal open is a product bug | POSSIBLE | Seen once in console. May be Next 15 + HMR. |
| UA-14 | Screen-reader experience beyond unlabeled buttons | UNVERIFIED | Snapshot + missing `aria-label` only. No VoiceOver/NVDA pass. |
| UA-15 | Contrast ratios fail WCAG | UNVERIFIED | `text-muted-readable` on glass not measured. |
| UA-16 | Import of a share link from another origin would write this browser’s workspace | HIGH CONFIDENCE from code | Same-origin test only. |

## Research tool status (2026-08-23)

- `parallel-cli`: not installed.
- `npx firecrawl-cli --version --auth-status`: `1.23.1`, `authenticated: false`.
- `firecrawl login --browser` hung in this environment; stopped.

Prior owner research in `docs/RESEARCH_LOG.md` remains valid as a starting set.
