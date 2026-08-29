# Grillme: Hermes bridge, last 30 days, 50 questions

Generated 2026-08-29. There is no `grillme` skill in this workspace; this is
the founder-grill in the same voice as `docs/DECISIONS.md`. Answers are from
the MIT clone of [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent)
(HEAD `a73b14c` / live GitHub activity the same day), the WhatsApp / dashboard
plugin docs, and what this repo can actually prove on this VM.

Hermes last-30-days signal (GitHub, not the shallow local clone): Bot Mode
design system merged (`#96726`); desktop Bot Mode room limits; plugin install
still `hermes plugins install owner/repo --ref <40-char-sha>`; user platforms
are opt-in; kanban stays a 7-column plugin API; WhatsApp still prints a
terminal QR for a Node bridge; no official companion-phone QR shipped.

---

### Q1. Does Hermes already pair a phone with a dashboard QR?

**A:** No. Official “pairing” is DM pairing (`hermes pairing approve <platform> <code>`).
Dashboard attach is a session token on `/api/ws`. WhatsApp prints a QR for
*WhatsApp Web*, not for Manage.kar.

**Suggestion:** Do not wait for Nous to invent our QR. Ship `managekar.pair.v1`.

### Q2. What should `hermes plugins install` point at?

**A:** A public MIT repo whose root has `plugin.yaml` + `__init__.py` with
`register(ctx)`. Pin `--ref` to a full SHA. Enable is opt-in (`[y/N]`).

**Suggestion:** Extract `packages/hermes-managekar-plugin/` to its own repo
when `gh` write exists. Until then, `cp` into `~/.hermes/plugins/managekar`.

### Q3. Platform plugin or dashboard plugin?

**A:** Both, one directory. `kind: platform` for `hermes plugins install` /
gateway discovery. `dashboard/plugin_api.py` for `/api/plugins/managekar/`.
`dashboard/dist/index.js` for the host QR tab.

**Suggestion:** Keep chat on `/api/ws`. Do not invent a second inbound loop.

### Q4. Is the WhatsApp adapter the template?

**A:** For *ceremony* (host shows QR, phone scans), yes. For *transport*, no.
WhatsApp uses a Node bridge + session folder. We mint a ticket then use the
MIT dashboard socket.

**Suggestion:** Document the difference in the pairing sheet so nobody thinks
scanning WhatsApp pairs Manage.kar.

### Q5. Where do plugin routes mount?

**A:** `/api/plugins/<name>/` from `dashboard/manifest.json` `"api": "plugin_api.py"`
exporting `router = APIRouter()`.

**Suggestion:** Name the plugin `managekar`, not `managekar-platform`.

### Q6. Are those routes authenticated?

**A:** Hermes skips `/api/plugins/` on a localhost-bound dashboard. Binding
`--host 0.0.0.0` exposes them.

**Suggestion:** Single-use pair ids (32 hex). Never put the dashboard token
in the QR. Claim returns the token only once.

### Q7. What goes in the QR?

**A:** Compact `managekar.pair.v1|<pairId>|<claimUrl>`. Full JSON is too long
for QR versions 1–6 L.

**Suggestion:** Keep the JSON for paste/copy. Encode the compact form.

### Q8. Who displays the QR — phone or host?

**A:** Host: terminal (`hermes managekar`), `/pair/<id>`, Hermes dashboard tab.
The phone *scans* or pastes. A placeholder MK- QR on the phone is not a pair.

**Suggestion:** Label the on-phone MK- pattern **Not a real QR yet**.

### Q9. Can the phone also mint?

**A:** Yes, if it can reach `POST /api/plugins/managekar/pair` on the helper
URL (“Request ticket”). Useful on loopback. Useless from a public HTTPS preview
to a laptop `127.0.0.1`.

**Suggestion:** Keep Request ticket as a same-LAN / stub test, not the VPS story.

### Q10. What does claim return?

**A:** `{ endpoint, token, install_id?, version? }`. Then `session.create`.

**Suggestion:** Never persist a pair from `/api/status` alone.

### Q11. Is the ticket reusable?

**A:** No. Second claim is 409. Expiry is 10 minutes.

**Suggestion:** Match WhatsApp’s “scan again” muscle memory: mint a new QR.

### Q12. How does the VPS stay “alive” for the phone?

**A:** The VPS process stays up. The phone holds a long-lived token and
reconnects `/api/ws` when it opens Chats. That is not a WhatsApp persistent
socket from the plugin adapter.

**Suggestion:** Presence words stay reachable / asleep / unreachable from
websocket state, not a fake green dot.

### Q13. Can this cloud agent open the user’s Hermes?

**A:** No. CORS is localhost. Mixed content blocks `ws://` from HTTPS preview.
No API keys here for a full `hermes dashboard`.

**Suggestion:** Prove the protocol on a loopback stub. Tell the user to run
`hermes dashboard` + plugin on their VPS.

### Q14. Should we pip-install full hermes-agent on this VM?

**A:** `requires-python >=3.11,<3.14` and a large exact-pinned tree
(`openai==2.24.0`, firecrawl, pydantic, …). No `uv` on the box. No keys.

**Suggestion:** Don’t pretend a failed 200-package install is “Hermes running.”
Stub + Python pair unit tests are the honest proof.

### Q15. Free APIs?

**A:** Pair/claim/status/WS need no LLM. Free Groq/OpenRouter keys would only
matter for a live model reply after `prompt.submit`.

**Suggestion:** Do not block the bridge on a chat completion.

### Q16. What did last-30-days Hermes change for us?

**A:** Bot Mode design system (`#96726`). Desktop Bot Mode room limits from
`config.yaml`. Heavy plugin/safety/install work, not a phone QR.

**Suggestion:** Follow the exact title `Bot Chat`. Do not clone desktop room
limits until we consume session list.

### Q17. How should Bot Mode appear in Manage.kar?

**A:** Exact title `Bot Chat`, badge on the row, sharper (`rounded-sm`) chip.
Other sessions keep machine names. Demo stays Demo.

**Suggestion:** Do not invent a Bots tab.

### Q18. Kanban?

**A:** Hermes is 7 columns via `/api/plugins/kanban/`. Our board is still
todo/doing/done derived from `completed` (D007).

**Suggestion:** Consume the API later. Do not ship a 7-column clone now.

### Q19. Theme: square vs rounded?

**A:** Dashboard `--radius: 0.5rem`. We had editorial `calc(var(--radius) + 4px)`
and `rounded-3xl` composer. That is the visual drift.

**Suggestion:** Cards, composer, pair box → `var(--radius)` / `rounded-lg`.
Keep the HERMES pulsing preloader (site blue + chartreuse wordmark).

### Q20. Logo / preloader?

**A:** Live site quartet is already `--mk-site-*`. `.mk-preloader` must not
block the workspace.

**Suggestion:** Keep the wordmark pulse. Do not add a 3D caduceus or Sigurd.

### Q21. Loading icon?

**A:** Hermes dashboard uses Inter / JetBrains and a 15px / 1.55 type ramp.
No proprietary marketing faces.

**Suggestion:** Chat skeletons stay editorial cards, not a splash.

### Q22. Can we clone MIT lines?

**A:** Yes, with attribution. We already imported chat-title and theme tokens.

**Suggestion:** Import more contracts (kanban DTO, bot-mode CSS variables)
instead of restyling from screenshots.

### Q23. Plugin store?

**A:** Forbidden. Skills on a paired machine are read-only.

**Suggestion:** Grill any UI that says “Install skill.”

### Q24. Fake online?

**A:** Forbidden. Demo = not paired.

**Suggestion:** After a real claim, presence comes from the socket.

### Q25. Simulate pairing?

**A:** `#dev` / `?dev=1` only.

**Suggestion:** Keep the button copy “Simulate pairing (dev).”

### Q26. Custom URL scheme?

**A:** `managekar://pair?code=` is still a local scaffold. Real tickets are
`http(s)` claim URLs the PWA `/claim` page can open.

**Suggestion:** Prefer https claim links over a scheme the OS may not handle.

### Q27. Flutter?

**A:** Not full parity this slice. The PWA claim page is the shared contract.

**Suggestion:** Flutter should POST the same claim JSON, then store token.

### Q28. Security of pair_id?

**A:** 16 random bytes hex. Unauthenticated localhost plugin routes.

**Suggestion:** Treat LAN exposure as physical-proximity, like WhatsApp QR.
Rotate by expiry.

### Q29. Should QR include the token?

**A:** No. Token appears only after claim.

**Suggestion:** If a QR ever leaks, the attacker still has to claim first
and wins the single use — user mints again.

### Q30. Multiple machines?

**A:** D009 already allows VPS 1..n and local 1..n. Each claim is one machine.

**Suggestion:** One ticket per machine. Don’t reuse tokens across devices.

### Q31. Relay / sleeping laptop?

**A:** Hermes has experimental relay work (recent `feat(relay)`). Not this slice.

**Suggestion:** Explore next to official relay; don’t invent a middleman.

### Q32. IRC vs WhatsApp as code template?

**A:** IRC is stdlib-only and easier to copy. WhatsApp is the UX metaphor.

**Suggestion:** Adapter stays thin; pairing.py stays stdlib.

### Q33. `register_cli_command` vs slash `/managekar`?

**A:** CLI `hermes managekar` prints the QR. Slash commands are in-session.

**Suggestion:** Host ceremony is a terminal command, like `hermes whatsapp`.

### Q34. What if FastAPI isn’t importable?

**A:** `plugin_api.py` only loads inside the dashboard. Pairing.py is stdlib.

**Suggestion:** Keep that split so `python3 pairing_test.py` runs anywhere.

### Q35. How do we prove WS without the `ws` npm package?

**A:** Hand-rolled upgrade + masked client frames in the verify script.

**Suggestion:** Don’t add a runtime dependency for a test helper.

### Q36. Public preview URL?

**A:** Cannot reach the user’s Hermes. Can reach a stub on this VM only if
we bind and tunnel. Still not *their* machine.

**Suggestion:** Never say “I connected to your phone.”

### Q37. Classic skin radius?

**A:** Classic sets `--radius: 1rem`. Cards use the token, so Classic stays
softer. Hermes skin stays 0.5rem.

**Suggestion:** Don’t hard-code 8px.

### Q38. Approval cards?

**A:** Already MIT-styled. Not part of pair/claim.

**Suggestion:** Leave them unless Bot Mode CSS tokens land.

### Q39. Cron / reminders?

**A:** Unchanged. Still local nudges (D008) until pairing is real *and* cron
is consumed.

**Suggestion:** Don’t route reminders through the new platform adapter.

### Q40. Profiles / multi-bot?

**A:** Desktop Bot Mode pins one forever DM titled `Bot Chat`. Room limits
are moving into `config.yaml`.

**Suggestion:** One canonical Bot Chat row per paired machine until we list
Hermes sessions.

### Q41. License of the plugin?

**A:** MIT, same as Hermes. Required if we want anyone to `plugins install`.

**Suggestion:** Keep LICENSE in the extractable folder, not only the app repo.

### Q42. Capabilities / consent?

**A:** We don’t need `tools.override` or LLM overrides.

**Suggestion:** Don’t declare unused capabilities; consent screens scare people.

### Q43. `requires_env`?

**A:** Optional `MANAGEKAR_ENABLED` and `MANAGEKAR_PUBLIC_BASE`. No secret
required to mint a ticket.

**Suggestion:** Don’t gate pairing on an API key.

### Q44. How will people find the repo?

**A:** Hermes plugin index is separate; `owner/repo` works without an index.

**Suggestion:** README must be the install doc. Don’t add an in-app store.

### Q45. Doctor?

**A:** `hermes plugins doctor . --ci` is the official check. We can’t run it
without Hermes installed.

**Suggestion:** Run doctor on the user’s VPS after they copy the folder.

### Q46. Failure vocabulary?

**A:** Add `claim_failed`. Keep helper_not_running / needs_token / expired.

**Suggestion:** Toast + draft.failure, never a silent retry that looks paired.

### Q47. Is the stub a lie?

**A:** It is labeled a stub: version `0.5.0-stub`, `install_id` `stub-install`.
It speaks the same routes so tests can fail.

**Suggestion:** Keep `0.5.0-stub` so nobody confuses it with a real dashboard.

### Q48. Web QR vs terminal QR?

**A:** Both. CLI prints ticket + ASCII QR. `/pair/<id>` is the link you open
on a monitor. Dashboard tab opens that page.

**Suggestion:** Same ticket object everywhere.

### Q49. What breaks first in production?

**A:** Phone cannot route to `127.0.0.1` on the VPS. Users will scan a QR that
points at loopback.

**Suggestion:** Require `MANAGEKAR_PUBLIC_BASE` (LAN / Tailscale / tunnel)
before printing a QR meant for a physical phone.

### Q50. What should we tell the founder to do tomorrow?

**A:** Publish the plugin folder as a public MIT repo; on the VPS
`hermes plugins install … --enable`; `hermes managekar --host https://that-vps`;
scan from the PWA; confirm Chats says reachable, not Demo.

**Suggestion:** Do that before any kanban or bot-room UI work.

---

## Recommendations

1. **Publish the plugin repo** — this folder is the product people install.
2. **Set `MANAGEKAR_PUBLIC_BASE`** before any real phone scan.
3. **Keep chat on `/api/ws`** — the plugin is a lock, not a second messenger.
4. **Stay honest in the UI** — placeholder QR, stub version, no fake online.
5. **Theme: 0.5rem** — stop adding editorial puff radius.
6. **Bot Chat title only** — don’t invent a bots marketplace.
7. **Kanban later** — consume `/api/plugins/kanban/`, don’t clone 7 columns.
8. **No plugin store** — `hermes plugins install` lives in the terminal.
9. **Prove on loopback, pair on the VPS** — this VM cannot be their Hermes.
10. **Pin plugin SHAs** — `--ref` 40 chars, same as Hermes docs.
