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
- Password-protected share links (`enc1.`). Ciphertext sits in the URL and does not expire. WhatsApp send is **plain text**, not that link.
- Optional clipboard suggestions (off by default)
- Local reminders while this tab is open (they respect habit reminder time; they do not fire in the background)

## What is not here

- Cloud backup / Google Drive
- Team collaboration
- Background notifications after you close the tab
- Share-link revoke or expiry

## Docs

Start with [`docs/PRODUCT_VISION.md`](docs/PRODUCT_VISION.md).
The latest product-truth map is [`docs/forensic/FEATURE_TRUTH_MAP.md`](docs/forensic/FEATURE_TRUTH_MAP.md).
