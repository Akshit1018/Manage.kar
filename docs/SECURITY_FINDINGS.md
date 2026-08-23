# Security findings

Trust boundary is the browser origin (`docs/SECURITY_MODEL.md`). That document is mostly honest. The UI is not.

## Confirmed / high confidence

| ID | Issue | Class |
| --- | --- | --- |
| RT-001 | Fake Google connect + “backed up” | Integrity / social-engineering yourself |
| RT-006 | Share token = public payload | Confidentiality |
| RT-007 | Import writes workspace without confirm | Integrity |
| RT-022 | Clipboard poll + `console.log` | Confidentiality |
| RT-017 | `ignoreBuildErrors` | Supply of broken authz later |
| RT-015 | Boot-time `getUserMedia` | Privacy |
| RT-039 | Avatar URL prompt | SSRF-to-image / tracking |
| RT-002 | Cross-tab overwrite | Integrity / availability of data |

## IDOR

No users. The share URL **is** the ID. Knowing it is authorization (RT-006).

## XSS

Task titles with `<script>` rendered as text in dashboard and share page (browser-confirmed). Prefer keep React text nodes. **Do not** later `dangerouslySetInnerHTML` notes.

`decodeSharePayload` + render must stay text.

## Secrets

No `.env` secrets in repo. Fake Google uses a **public** sample spreadsheet id. Risk is trust, not key leak.

## Sessions

No session. `localStorage` is the account. Clearing site data = account deletion. No re-auth. Device sharing = full access.

## Agent / prompt injection

No agent tools. Share import is the injection surface: a crafted link appends arbitrary tasks (RT-007).

## Logging

`[v0]` logs include clipboard snippets and “spreadsheet data prepared.” DevTools = leak.

## Dependencies

Not `npm audit`’d this pass (unverified). Large unused Radix surface increases advisory blast radius (RT-037).

## Headers / Next

Default Next 15. No custom security headers in `next.config.mjs`. Not scored CRITICAL without a host.

## File upload

Backup import is JSON text. No size cap in `parseBackup`. A huge file can freeze the tab / exceed quota.

## Rate limit

None. Import click can clone forever.

## Proof conditions

1. **Fake backup:** Connect → Connected without network to google.com (RT-001).
2. **Share leak:** decode path segment → JSON tasks (RT-006).
3. **Import:** click once → tasks appended, no dialog (RT-007).
4. **Tab wipe:** inject row → other tab persist → row gone (RT-002).

## What is actually okay

- No password in repo.
- Clipboard default **off** in workspace settings (owner D005). Component default `true` is still a footgun.
- No real Google token stored.
- Export is a local download.
