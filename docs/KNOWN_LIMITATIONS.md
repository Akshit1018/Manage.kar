# Known limitations

Honest leftover after Green Team repair. Do not call these done.

- Reminders fire only while this tab is open. There is a 60s clock. There is no OS-level alarm after close.
- Share links cannot expire or revoke. Passworded ciphertext still lives in the URL forever.
- WhatsApp/email send titles in the clear. That is intentional and labeled.
- Two tabs: last full document write wins. The losing tab reloads and is told another tab updated.
- Voice audio is stored as a data URL in `localStorage`. Large recordings can hit quota.
- No second-device sync. Export is the backup.
- No Google Drive. Settings say so.
- FAB is still a large desktop helper. Focus now opens the persisted Focus modal.
- `app/page.tsx` and `floating-toggle.tsx` are still oversized.
