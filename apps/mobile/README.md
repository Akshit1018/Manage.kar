# Manage.kar Flutter app

iOS-first client that also compiles to Android. Talks to the PostgreSQL API in `apps/api`.

```bash
flutter pub get
flutter run --dart-define=API_BASE=http://127.0.0.1:4000
```

On an Android emulator use `http://10.0.2.2:4000`. After the VPS is up, rebuild with your HTTPS origin.

## Permission modules

| Capability | iOS | Android |
| --- | --- | --- |
| Microphone | `NSMicrophoneUsageDescription` | `RECORD_AUDIO` |
| Notifications | `NSUserNotificationsUsageDescription` | `POST_NOTIFICATIONS` |
| Photos | `NSPhotoLibraryUsageDescription` | optional |
| HTTP during setup | `NSAppTransportSecurity` | `usesCleartextTraffic` |

Recording is foreground-only. This is not Apple Voice Memos on the lock screen.
