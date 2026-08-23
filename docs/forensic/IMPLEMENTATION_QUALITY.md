# Implementation-quality benchmark

A feature can exist and still score 3/10. Scores are against a 2026 personal productivity product, **after remediations**.

Scale: 1 = punishable, 5 = usable, 8 = hard to dismiss, 10 = reserved (not used).

| Area | Completeness | UX | UI | Reliability | Perf | Architecture | Errors | Mobile | A11y | Observability | Security | Competitive | Notes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Tasks | 6 | 5 | 5 | 6 | 5 | 6 | 6 | 6 | 5 | 3 | 6 | 3 | Core works. No today/agenda, no NLP. |
| Notes | 5 | 5 | 5 | 4 | 5 | 5 | 5 | 5 | 5 | 2 | 5 | 3 | Voice audio broken. |
| Habits | 4 | 4 | 5 | 6 | 5 | 6 | 5 | 6 | 5 | 2 | 5 | 3 | Streak real; schedule fake. |
| Goals | 2 | 3 | 4 | 6 | 5 | 5 | 4 | 1 | 4 | 2 | 5 | 2 | Hidden on phone; no delete. |
| Time | 5 | 4 | 4 | 6 | 5 | 5 | 4 | 1 | 4 | 2 | 5 | 4 | Hidden on phone. SP does this better. |
| Focus | 5 | 4 | 4 | 5 | 5 | 4 | 4 | 1 | 4 | 2 | 5 | 4 | Duplicate FAB timer. |
| Reminders | 2 | 2 | 4 | 2 | 5 | 4 | 3 | 2 | 4 | 2 | 5 | 1 | Switch is the product. Scheduler is not. |
| Share/export | 6 | 5 | 5 | 6 | 4 | 6 | 5 | 2 | 5 | 4 | 6 | 3 | Export default. Link: no revoke. Mobile share hidden. |
| Settings | 6 | 5 | 5 | 6 | 5 | 6 | 5 | 5 | 5 | 4 | 6 | 4 | Honest backup. Split Backup vs Data. |
| PWA | 3 | 3 | 4 | 2 | 5 | 4 | 2 | 4 | 4 | 1 | 5 | 2 | Icons yes. Cache-first `/` never refreshes. `/shared` uncached. |
| Store | 7 | — | — | 7 | 4 | 7 | 7 | — | — | 3 | 6 | 4 | Quarantine + mutators. Still one blob. |
| Analytics/Counts | 2 | 2 | 3 | 5 | 5 | 3 | 3 | 1 | 4 | 4 | 5 | 1 | Device log is the real analytics. UI is costume. |

## Subsystem: expected vs actual

| Subsystem | Expected (2026) | Actual | Gap | Consequence |
| --- | --- | --- | --- | --- |
| Auth | None, if local-first is the pitch | None | None | Fine. |
| Search | Persist in URL or session | React state | Lost on refresh | Re-work. |
| Onboarding | One capture + survive refresh | Honest empty **or** leftover demo trash | This profile had trash | Returning testers see a polluted product. |
| Dashboard | Today + capture | Four counts + six tools | Hierarchy | Zero-patience opens the wrong door. |
| Forms | Inline error, disable submit | Empty title errors | OK | |
| API | N/A | No HTTP API | Share is a URL | Cannot revoke. |
| Database | IndexedDB + schema versions | localStorage JSON + Zod | Quota, no indexes | Scale + voice. |
| Background jobs | Notification triggers | useEffect on hydrate | Missed bills | |
| Observability | Know if export is used | Device event log | No remote | Fine for local-first; useless for a hosted product. |
| Mobile | Same jobs as desktop | Half the IA hidden | Share/timers gone | |
| A11y | Named controls, one dialog system | Mixed overlay/dialog | Share Escape exists (listener) | Custom modal still a trap risk. |

## Engineer dismissal (immediate)

- `floating-toggle.tsx` (~944 lines)  
- Dead `text-to-speech.tsx`, `theme-provider.tsx`  
- Habit frequency UI without enforcement  
- Full-document persist  
- README lying about persist  
- Hardcoded Counts recommendations  

## Designer dismissal (remove first)

- Counts modal  
- Desktop 6-tile row **or** give the phone the same jobs  
- Profile achievements  
- Glass/gradient competition with the Add task button  
- Home = bar-chart icon  

## Industry comparison (local-first peers)

| Pattern | Super Productivity | Cairn (Artaeon) | Manage.kar |
| --- | --- | --- | --- |
| Primary store | IndexedDB ([DeepWiki](https://deepwiki.com/johannesjo/super-productivity/5-data-persistence-and-synchronization)) | Dexie.js IndexedDB ([Cairn README](https://github.com/Artaeon/cairn)) | `localStorage` one key |
| IDs | App model | ULID | Monotonic `nextEntityId` (missing on this dirty profile until mutate) |
| Sync | Optional Dropbox/WebDAV + encryption | None (zero cloud) | File export + password URL |
| Time + tasks | Native | Yes | Time hidden on mobile |
| License / maturity | MIT, since 2016 ([SP about](https://super-productivity.com/about/)) | Local-first life OS | 0.2.0 Next app |

**Did we build an inferior version of a solved problem?** For “local-first tasks + time + focus,” **yes** relative to Super Productivity. That is not an order to rewrite in Angular. It is an order to stop pretending the suite chrome is the product.
