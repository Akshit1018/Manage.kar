# Known limitations

Honest leftover after the leftover-close session. Do not call these done.

- Reminder service-worker checks are best-effort. `periodicsync` can be delayed or denied. There is no push server and no guaranteed OS alarm after the browser process is killed.
- Share links cannot be remotely revoked. Client-side `expiresAt` is checked when this app decodes the URL. The ciphertext can still sit in history, referrer logs, and other apps.
- WhatsApp/email send titles in the clear. That is intentional and labeled.
- No second-device sync. Export is the backup.
- No Google Drive. Settings say so.
- `floating-toggle.tsx` is still a large desktop helper. It is now reachable on mobile above the tab bar.
- Voice notes use the browser microphone (`getUserMedia` + `MediaRecorder`). There is no iOS `NSMicrophoneUsageDescription` and no Android `RECORD_AUDIO` manifest because this is not a native wrapper. Recording stops if you leave the page. iOS Safari does not provide lock-screen Voice Memos or background capture.
- Live transcription is best-effort Web Speech. It is often missing on iPhone Safari; the audio file still saves.
