# Manage.kar Flutter app

iOS-first client that also compiles to Android and **web**. Talks to the PostgreSQL API in `apps/api`.

```bash
flutter pub get
flutter run --dart-define=API_BASE=http://127.0.0.1:4000
```

On an Android emulator use `http://10.0.2.2:4000`. After the VPS is up, rebuild with your HTTPS origin.

## Browser test (Flutter web)

Start the API first (`cd apps/api && pnpm dev`). Then:

```bash
flutter run -d web-server --web-hostname 0.0.0.0 --web-port 5173 --dart-define=API_BASE=http://127.0.0.1:4000
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173). Create an account against PostgreSQL.

Same-origin demo (Flutter files served by the API, so one URL works):

```bash
cd apps/mobile
flutter build web --no-wasm-dry-run
cd ../api
FLUTTER_WEB_DIR=../mobile/build/web HOST=0.0.0.0 PORT=4000 pnpm start
```

Open [http://127.0.0.1:4000](http://127.0.0.1:4000). Demo account: `demo@managekar.app` / `Demo12345`.

This is the Flutter client in Chrome/Safari, not the Next.js `localStorage` PWA. The microphone uses the browser `getUserMedia` prompt after a tap. Local notifications stay iPhone/Android-only.

## Permission modules

| Capability | iOS | Android |
| --- | --- | --- |
| Microphone | `NSMicrophoneUsageDescription` | `RECORD_AUDIO` |
| Notifications | `NSUserNotificationsUsageDescription` | `POST_NOTIFICATIONS` |
| Photos | `NSPhotoLibraryUsageDescription` | optional |
| HTTP during setup | `NSAppTransportSecurity` | `usesCleartextTraffic` |

Recording is foreground-only. This is not Apple Voice Memos on the lock screen.

The bowl asks for the microphone only after a tap. It never auto-triggers and never redirects into Settings by itself. If the OS has locked the prompt, the person can tap **Open Settings**. See [`docs/VOICE_BOWL_PERMISSIONS.md`](../../docs/VOICE_BOWL_PERMISSIONS.md).
