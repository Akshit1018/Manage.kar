# Known issues

- Share links are password-encrypted in the URL. They still do not expire and cannot be revoked without a server.
- There is no hosted marketing site. First-run value is the in-app empty state.
- The desktop FAB remains a large leftover file (`components/floating-toggle.tsx`).
- Voice note audio is a blob URL. It does not survive a full browser restart.
- `styles/globals.css` is unused; styling lives in `app/globals.css`.
- Counts is a completion ratio, not a model.
- Local activity events stay on this device. There is no remote analytics or crash reporter.
- Encrypted cloud sync needs a provider. Export/import is the backup path.
