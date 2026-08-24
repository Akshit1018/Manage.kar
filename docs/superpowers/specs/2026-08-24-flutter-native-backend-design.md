# Manage.kar native conversion design

Date: 2026-08-24

## Decision

Convert the local-first Next.js PWA into:

- an **iOS-first Flutter app** that also compiles to Android
- a **PostgreSQL** database
- a **fast JSON API** (Fastify + Prisma) with the same resource shape a Laravel Sanctum API would expose

Flutter is the client because one codebase ships both App Store and Play Store. Swift-only would leave Android as a second rewrite. Laravel is the intended VPS-era PHP option; this environment has Node, PostgreSQL, and Flutter, so the first shippable API is TypeScript Fastify with identical routes (`/api/auth/*`, `/api/tasks`, …). A later Laravel port can implement the same OpenAPI contract.

The existing Next.js app stays in the repo as the web reference. It does not become the phone client.

## Product (unchanged)

Personal productivity: tasks, notes (with voice), habits, goals, time, focus, profile, settings. Not recruiting.

## Auth (new, required)

Local-first `localStorage` cannot be the source of truth on a VPS. Users register with email + password. Every row is scoped by `user_id`. JWT bearer tokens (30 days).

## API

`apps/api` — Fastify, Prisma, PostgreSQL.

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | create user + default settings/profile |
| POST | `/api/auth/login` | JWT |
| POST | `/api/auth/logout` | client discards token (stateless JWT) |
| GET | `/api/me` | profile + settings |
| PATCH | `/api/me` | profile + settings |
| CRUD | `/api/tasks` | checklist JSON, recurring, reminders |
| CRUD | `/api/notes` | text + optional voice |
| POST | `/api/notes/:id/voice` | multipart m4a/webm |
| CRUD | `/api/habits` | history + server-computed streak |
| POST | `/api/habits/:id/toggle` | toggle a local date |
| CRUD | `/api/goals` | milestones |
| CRUD | `/api/time-entries` | start/pause/stop |
| GET/POST/PATCH | `/api/focus` | active session + history |
| GET | `/api/workspace` | full dump for first sync |
| GET | `/health` | liveness |

Voice files live on disk (`storage/voice/{userId}/{noteId}`) and are served through an authenticated GET. They are not stored as data URLs.

## Flutter client

`apps/mobile` — Material 3, same IA as the PWA:

- Bottom nav: Home / Tasks / Notes / Habits
- Overlay routes: task, note, habit, settings, profile, goals, time, focus, share, counts, voice recorder
- `dio` + secure token store
- `permission_handler` + iOS Info.plist + Android manifest

## iOS permission modules (real, not pretended)

| Capability | Flutter / native module | Info.plist / Android |
| --- | --- | --- |
| Microphone | `permission_handler` + `record` | `NSMicrophoneUsageDescription`; `RECORD_AUDIO` |
| Notifications | `flutter_local_notifications` | `NSUserNotificationsUsageDescription`; `POST_NOTIFICATIONS` |
| Photos (avatar) | `image_picker` | `NSPhotoLibraryUsageDescription` |
| Network | platform | `INTERNET` |

Background lock-screen Voice Memos is still not claimed. Recording is foreground-only.

## VPS (later, when SSH is provided)

`docker-compose.yml` runs Postgres + API. Nginx terminates TLS. Flutter points `API_BASE_URL` at that host. No SSH work in this change.

## Out of scope

Google OAuth, TickTick calendar clone, Super Productivity rewrite, remote share revoke, APNs production certs (needs Apple developer account on a Mac).
