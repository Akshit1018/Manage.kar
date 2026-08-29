# Known limitations

Honest leftover after the leftover-close session. Do not call these done.

- Reminder service-worker checks are best-effort. `periodicsync` can be delayed or denied. There is no push server and no guaranteed OS alarm after the browser process is killed.
- Share links cannot be remotely revoked. Client-side `expiresAt` is checked when this app decodes the URL. The ciphertext can still sit in history, referrer logs, and other apps.
- WhatsApp/email send titles in the clear. That is intentional and labeled.
- No second-device sync. Export is the backup.
- No Google Drive. Settings say so.
- The FAB is a compact control above the tab bar. It still opens extra sheets (quick add, voice). It is not a second app.
- iOS keyboard inset uses `visualViewport`. Some browsers report it a frame late, so a sheet footer can sit under the keyboard briefly.
- Voice notes use the browser microphone (`getUserMedia` + `MediaRecorder`). There is no iOS `NSMicrophoneUsageDescription` and no Android `RECORD_AUDIO` manifest because this is not a native wrapper. Recording stops if you leave the page. iOS Safari does not provide lock-screen Voice Memos or background capture.
- Live transcription is best-effort Web Speech. It is often missing on iPhone Safari; the audio file still saves.
- The Hermes JSON-RPC client speaks the MIT dashboard contract (`GET /api/status`, `/api/ws` on port 9119, `session.create`, `prompt.submit`). Hermes CORS only allows localhost origins, and `/api/ws` still needs the dashboard session token. This environment has no official `hermes dashboard` (no API keys / uv install). Pair/claim/`session.create` are proven against `scripts/hermes-bridge-stub.mjs` on loopback. A public HTTPS preview cannot reach Hermes on your laptop. Official OAuth single-use tickets are not implemented. Demo messages stay queued.
- The extractable plugin lives at `packages/hermes-managekar-plugin/`. `gh` cannot create the separate public GitHub repo from this agent; publish that folder and run `hermes plugins install owner/repo`.
- The host QR encodes a compact `managekar.pair.v1` payload. A phone off the host LAN cannot claim `127.0.0.1`. Use `MANAGEKAR_PUBLIC_BASE` (Tailscale / LAN IP / tunnel) on the VPS.
- Android `SYSTEM_ALERT_WINDOW` is declared and gated. The overlay service is a documented stub. It does not draw a floating ball unless a later slice verifies `Settings.canDrawOverlays` on a real device.
