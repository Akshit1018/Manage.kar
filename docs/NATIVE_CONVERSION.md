# Native conversion

Manage.kar is a Flutter iOS/Android client plus a PostgreSQL API. The same Flutter client also compiles to **web** so you can test auth, tasks, notes, and habits in a browser without a device.

## Why Flutter, not Swift-only

Flutter compiles to both iPhone and Android from one UI. A Swift rewrite would leave Android as a second product. iOS is still first: microphone, notification, and photo strings are real Info.plist / `RECORD_AUDIO` entries, not web `getUserMedia` theater.

## Why Fastify instead of Laravel in this repo

This environment already has Node, Prisma, and a test runner. The API is a Laravel-shaped REST service. A later Laravel Sanctum app can implement the same contract on the VPS if you want PHP specifically. PostgreSQL is the database either way.

## API

| Method | Path |
| --- | --- |
| GET | `/health` |
| POST | `/api/auth/register` `/login` `/logout` |
| GET/PATCH | `/api/me` |
| CRUD | `/api/tasks` `/api/notes` `/api/habits` `/api/goals` |
| POST | `/api/notes/:id/voice` JSON metadata or multipart `audio` |
| GET | `/api/notes/:id/voice` authenticated audio |
| POST | `/api/habits/:id/toggle` |
| POST | `/api/goals/:id/milestones` |
| PATCH | `/api/goals/:id/milestones/:milestoneId` |
| POST | `/api/time-entries` `/:id/pause` `/:id/resume` `/:id/stop` |
| GET/POST | `/api/focus` `/focus/start` `/pause` `/resume` `/stop` |
| GET | `/api/workspace` `/api/export` |
| POST | `/api/import` |
| DELETE | `/api/workspace` |

Voice files live under `VOICE_DIR` (`storage/voice` by default). They are not stored as data URLs.

## Run locally

```bash
# API
cd apps/api
pnpm install
pnpm exec prisma db push
pnpm test
pnpm dev

# Flutter (Mac for the iOS simulator)
cd apps/mobile
flutter pub get
flutter run --dart-define=API_BASE=http://127.0.0.1:4000

# Flutter web (browser test against the same API)
flutter run -d web-server --web-hostname 0.0.0.0 --web-port 5173 --dart-define=API_BASE=http://127.0.0.1:4000
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173) after the API is up. On an Android emulator use `http://10.0.2.2:4000`.

## iOS permission modules

| Module | File | String / permission |
| --- | --- | --- |
| Microphone | `ios/Runner/Info.plist` `NSMicrophoneUsageDescription` | Records a voice note after a tap |
| Notifications | `NSUserNotificationsUsageDescription` | Task/habit reminders |
| Photos | `NSPhotoLibraryUsageDescription` | Optional profile photo |
| Android mic | `RECORD_AUDIO` | Same voice path |
| Android alerts | `POST_NOTIFICATIONS` | Same reminders |

`AppPermissions` in Dart calls `permission_handler`. Recording is foreground-only.

The floating bowl never auto-starts and never auto-opens Settings. Full research and App Store / Play rules: [`docs/VOICE_BOWL_PERMISSIONS.md`](VOICE_BOWL_PERMISSIONS.md). We do **not** declare `UIBackgroundModes: audio`; unused background audio is a Guideline 2.5.4 reject.

## VPS (when you give SSH)

1. Copy the repo to the VPS.
2. Change `JWT_SECRET` and the Postgres password in `docker-compose.yml` / `.env`.
3. `docker compose up -d`
4. Point a domain / Nginx at port `4000` and terminate TLS.
5. Rebuild the iOS/Android apps with `--dart-define=API_BASE=https://your-domain`.

Do not expose Postgres publicly. Compose binds it to `127.0.0.1` only. Only the API port (or Nginx) should be public.
