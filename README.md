# Manage.kar

Local-first personal workspace for **tasks, notes, and habits**.

Your data lives in this browser (`managekar.workspace.v1`) unless you export it. There is no account and no live team backend.

## Run

```bash
pnpm install
pnpm dev
```

```bash
pnpm test
pnpm build
```

## What works

- Create / edit / complete / delete tasks and notes
- Habits with a written history entry; frequency and custom days are enforced
- Goals, time entries, and focus sessions persist in the same workspace document
- Settings theme, font size, animations, and date format
- Export / import / clear the **same** workspace the UI uses
- Password-protected share links (`enc1.`) with optional client-side expiry. Ciphertext still sits in the URL. WhatsApp send is **plain text**, not that link.
- Optional clipboard suggestions (off by default)
- Local reminders while this tab is open, plus a best-effort service-worker snapshot check (`periodicsync` / visibility). There is no push server.

## What is not here

- Cloud backup / Google Drive
- Team collaboration
- Guaranteed background alarms after the browser process is killed
- Remote share-link revoke (client expiry only)

## Docs

Start with [`docs/PRODUCT_VISION.md`](docs/PRODUCT_VISION.md).
The latest product-truth map is [`docs/forensic/FEATURE_TRUTH_MAP.md`](docs/forensic/FEATURE_TRUTH_MAP.md).
