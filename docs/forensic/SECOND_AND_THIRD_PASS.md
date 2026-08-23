# Second and third pass

## Second pass — assume the first forensic team was incompetent

Fresh critic. Same repo, same live origin, same already-written pack. Unique items that were missing or under-weighted:

### 1. Unlocked share page still describes plaintext

**OBSERVATION:** After a successful `enc1.` unlock, `app/shared/[data]/page.tsx` still tells the recipient “Anyone with this URL can read these tasks.”

**EVIDENCE:** The password gate is real (`decodeEncryptedSharePayload`). The sentence is unconditional.

**USER CONSEQUENCE:** Recipients over-share the URL *or* senders under-trust the feature. Opposite of the Share modal copy, which says password + ciphertext + no expiry.

**ROOT:** One leftover sentence from the plaintext era.

**COMPARISON:** SECURITY_MODEL.md has the same stale claim.

**SEVERITY:** Medium (trust / security communication). **PROVEN.**  
**Prior pack:** documented SECURITY_MODEL, not this string.

### 2. WhatsApp is a different product than “encrypted share”

**OBSERVATION:** `generateWhatsAppMessage` dumps titles, due dates, descriptions, checklist counts into the chat. It does not attach the `enc1.` URL.

**EVIDENCE:** `components/share-modal.tsx`.

**USER CONSEQUENCE:** User thinks they “shared via Manage.kar” privately. They published the list to WhatsApp’s servers in the clear.

**ROOT:** Share modal still offers three channels with one mental model.

**SEVERITY:** High for anyone who used WhatsApp because Link looked hard. **PROVEN.**  
**Prior pack:** mentioned WhatsApp as `window.open`, not the plaintext dump.

### 3. Service worker never refreshes `/`

**OBSERVATION:** `fetch` is cache-first and never `cache.put`s a new document. `CACHE_NAME` is `managekar-static-v1`.

**EVIDENCE:** `public/sw.js`.

**USER CONSEQUENCE:** An installed user can run a **dead HTML shell** after deploys until the name changes. Worse than “offline is incomplete.”

**SEVERITY:** High if anyone installed the PWA; otherwise latent. **STRONG** (code). Not reproduced with a version bump in this session.

**Prior pack:** said “not a full offline shell,” not “stale-forever HTML.”

### 4. Silent due-date coercion

**OBSERVATION:** `normalizeDueDate` default = today. `"this week"` = today + 3 days. `weekStartsOn` only reorders habit chips.

**EVIDENCE:** `lib/dates/due-date.ts`; settings week-start.

**USER CONSEQUENCE:** Imports, dirty rows, and slogan dates collapse to “today.” “This week” is not a week.

**SEVERITY:** Medium. **PROVEN** in source. Live dirty profile still stored `"Today"` until persist.

**Prior pack:** mentioned dirty `"Today"` bytes, not the default-branch / +3-day rule.

### 5. Two notify paths

**OBSERVATION:** `useWorkspace().persist` writes + `setWorkspace`. It does not `notifyWorkspaceChanged`. Settings, profile, and share import do.

**EVIDENCE:** `lib/store/use-workspace.ts` vs those modules.

**USER CONSEQUENCE:** Today there is a single hook consumer, so the home page does not desync from itself. A second mount (future split layout) would. Cross-tab still relies on `storage`.

**SEVERITY:** Low for current users; high for the next engineer who mounts the hook twice. **STRONG.**

### 6. Import idempotency is djb2, not a cryptographic hash

**OBSERVATION:** `hashString` in `lib/share/import-tasks.ts` is djb2.

**USER CONSEQUENCE:** Theoretical collision could skip an import or mark the wrong payload seen. Unlikely at personal scale.

**SEVERITY:** Low. **STRONG** (code). Do not treat as a user-facing incident.

### 7. Geist / Manrope from `next/font/google`

**OBSERVATION:** First paint can depend on font download. Local-first does not mean offline fonts.

**SEVERITY:** Low. **STRONG.** Mentioned because Cluster 4 pretends the PWA is self-contained.

### 8. Counts still imports Brain / Clock / Zap theater

**OBSERVATION:** Insights for tasks/habits are simple ratios (fine). Recommended Actions and unused icon imports are costume. Subtitle already admits heuristics.

**SEVERITY:** Low–medium (fake sophistication). **PROVEN.** Prior pack had this; keep it as theater, not as a new root.

### 9. No write-back sanitizer

**OBSERVATION:** Load normalizes dates/titles in memory. Disk stays dirty until a later `saveWorkspace`.

**USER CONSEQUENCE:** Export-before-edit can still emit slogan dates if a path stringifies raw storage instead of the in-memory workspace. Current export uses the live workspace object (**SUSPECTED** mismatch only if some path reads the key directly).

**SEVERITY:** Low if all I/O goes through `loadWorkspace`. **STRONG** that bytes stay dirty.

---

## Third pass — assume the audit exaggerated

Kill or downgrade:

| Claim | Verdict | Why |
| --- | --- | --- |
| “Must migrate to IndexedDB this week” | **OVERREACH** | Personal JSON in `localStorage` works at the current size. SP/Cairn are better *patterns*, not a rewrite order. Revisit when voice bytes or quota fail. |
| “Missing `nextEntityId` causes ID collisions” | **FALSE POSITIVE** | `allocateEntityId` uses `max(nextEntityId \|\| 1, highest+1)`. |
| “Leftover Google key is an active backdoor” | **FALSE POSITIVE** | Current UI does not read `manageKarGoogleIntegration`. It is dirt, not a live OAuth client. |
| “AES-GCM share is theater because the token is in the URL” | **OVERSTATED** | Password is not in the URL. Ciphertext-in-URL + no revoke is a **disclosed** limit, not a fake cipher. Still cannot expire. |
| “Reminders never re-fire after first load” | **FALSE as written** | Effect depends on `workspace`. Correct claim: no clock / no background. |
| “Must ship a TickTick calendar to be a product” | **OVERREACH** | Today list is EXPECTED. Full calendar is NICE. |
| “Product is dead vs TickTick” | **HYPOTHESIS** | Different job (no account vs suite). Do not file as PROVEN. |
| “XSS titles prove an XSS hole” | **FALSE POSITIVE** | Live session rendered them as text. They prove a **dirty test profile**, not script execution. |
| “Dark mode / glass UI is a launch blocker” | **OVERREACH** | Ugly ≠ data-loss. |
| “Replace the app with Super Productivity” | **OVERREACH** | Use it as a benchmark. Shipping Angular SP is not this repo’s job. |
| “No revoke is a blocker without a server” | **OVERSTATED** | Expected for a static link. Copy already admits no expiry. Fix copy + prefer export. |
| “QuotaExceeded will happen to everyone” | **HYPOTHESIS** | Unguarded `setItem` is real; population is unknown. Keep **SUSPECTED**. |
| “djb2 import hash is a security incident” | **OVERREACH** | Idempotency helper, not auth. |
| “Two notify paths is a user bug today” | **OVERSTATED** | Engineer trap. One hook. |

---

## Red-team disagreements (not forced consensus)

### Counts modal

- **UX critic:** Remove. Decorative score + static advice.  
- **Product critic:** The subtitle is honest; ratios are real; hiding it is enough.  
- **Resolution:** **HIDE or strip Recommended Actions.** Keeping the whole modal on desktop while the phone cannot open it fails Cluster 1. Evidence > taste: three strings never change.

### Time + Focus

- **Power user:** Keep both. Different jobs (billable log vs pomodoro).  
- **UX:** Two timers plus a FAB timer is three.  
- **Resolution:** **MERGE surfaces, keep both records.** One clock UI. FAB timer is the thing to delete.

### IndexedDB now

- **Engineer:** localStorage is a toy.  
- **Founder (six months):** do not spend the runway on a store migration while habit days are fake.  
- **Resolution:** **Not now**, unless Cluster 3 (voice / quota / 10k rows) is in scope.

### Mobile Share

- **UX:** Put Share in the bottom nav.  
- **Zero-patience:** Nav is already 4 items.  
- **Resolution:** **Export in Settings is enough** if Share stays desktop-only — but then delete desktop Share theater or the phone user never hears the word. Prefer one Export button in Settings *and* on Home, both viewports.

---

## Overreaction filter on the backlog

**Keep (harsh and true):**

1. Habit frequency / `reminderTime` unused.  
2. Reminder switch without a clock.  
3. Mobile missing Share/Goals/Time/Focus/Counts.  
4. SW stale-forever `/`.  
5. WhatsApp plaintext vs encrypted-link story.  
6. Unlocked share page copy.  
7. Stale README / SECURITY_MODEL / PRODUCT_GRAPH.  
8. Counts “week” + static recommendations.  
9. FAB as second app + blob voice.  
10. Full-document last-write-wins (warn; do not oversell CRDT).  
11. Silent due-date default → today.  
12. Search/view not in the URL.

**Do not put on a launch-critical list:**

- IndexedDB rewrite  
- Calendar clone  
- Cryptographic import hashes  
- Treating leftover Google JSON as live auth  
- Dark-mode redesign  
- “Kill the product, use SP”

---

## Completeness check (directive 43)

| Bar | Status |
| --- | --- |
| Product reconstructed from source | Yes — journeys file |
| Major journeys traced | Yes — create, habit, share, settings, import, focus/time/goals |
| Major subsystems inspected | Store, dates, habits, reminders, share, SW, analytics UI |
| Competitors researched | TickTick / Todoist / Things / SP / Cairn, with citations |
| Open source examined | SP + Cairn; Parallel/Firecrawl failed (logged) |
| Missing capabilities | ABSENT_CAPABILITIES.md |
| Useless capabilities challenged | We-have-this table + Cluster 1 |
| Personas | PERSONA_WALKS.md |
| Code ↔ product | NEGATIVE_GRAPH.md |
| Confidence labels | Used |
| False positives challenged | This file |
| Second pass new categories | Share copy, WhatsApp plaintext, SW staleness, due-date default, notify split |

A later agent can still **reproduce** SW staleness and a clean-profile 5-minute test. Those remain **STRONG / UNVERIFIED** respectively, not hidden.
