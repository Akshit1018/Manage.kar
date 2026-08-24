# Manage.kar

Personal workspace for **tasks, notes, and habits**.

There are two clients:

- **Flutter (iOS first, Android too)** in `apps/mobile` — this is the native product. It talks to PostgreSQL through `apps/api`.
- **Next.js PWA** at the repo root — the original local-first web app. It still uses `localStorage` and is the web reference.

Native setup, permission modules, and VPS compose: [`docs/NATIVE_CONVERSION.md`](docs/NATIVE_CONVERSION.md).

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

**Flutter + PostgreSQL (native product)**

- Email/password account, JWT, every row scoped by user
- Tasks, notes, habits, goals, time, focus, profile, settings
- Real microphone permission + multipart voice files
- Local iOS/Android notification permission (not a push server)
- Export / import a Manage.kar JSON backup against the account
- Plain-text share through the system share sheet

**Next.js PWA (web reference)**

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
