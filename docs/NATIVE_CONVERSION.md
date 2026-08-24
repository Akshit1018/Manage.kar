# Native conversion

Manage.kar is now a Flutter iOS/Android client plus a PostgreSQL API.

## Why Flutter, not Swift-only

Flutter compiles to both iPhone and Android from one UI. A Swift rewrite would leave Android as a second product. iOS is still first: the permission strings, microphone module, and notification module are real Info.plist / `RECORD_AUDIO` entries, not web `getUserMedia` theater.

## Why Fastify instead of Laravel in this repo

This environment already has Node, Prisma, and a test runner. The API is a Laravel-shaped REST service:

- `/api/auth/register|login|logout`
- `/api/me`
- `/api/tasks|notes|habits|goals|time-entries|focus|workspace`

A later Laravel Sanctum app can implement the same contract on the VPS if you want PHP specifically. PostgreSQL is the database either way.

## Run locally

```bash
# API
cd apps/api
pnpm install
pnpm exec prisma db push
pnpm dev

# Flutter (on a Mac for the iOS simulator)
cd apps/mobile
flutter pub get
flutter run --dart-define=API_BASE=http://127.0.0.1:4000
```

On an Android emulator use `http://10.0.2.2:4000`.

## iOS permission modules

| Module | File | String / permission |
| --- | --- | --- |
| Microphone | `ios/Runner/Info.plist` `NSMicrophoneUsageDescription` | Records a voice note after a tap |
| Notifications | `NSUserNotificationsUsageDescription` | Task/habit reminders |
| Photos | `NSPhotoLibraryUsageDescription` | Optional profile photo |
| Android mic | `RECORD_AUDIO` | Same voice path |
| Android alerts | `POST_NOTIFICATIONS` | Same reminders |

`AppPermissions` in Dart calls `permission_handler`. Recording is foreground-only. This is still not Apple Voice Memos on the lock screen.

## VPS (when you give SSH)

1. Copy the repo to the VPS.
2. `docker compose up -d`
3. Point a domain / Nginx at port `4000` or put TLS in front.
4. Change `JWT_SECRET` and the Postgres password.
5. Rebuild the iOS/Android apps with `--dart-define=API_BASE=https://your-domain`.

Do not expose Postgres publicly. Only the API port (or Nginx) should be public.
