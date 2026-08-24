# Flutter + PostgreSQL Conversion Implementation Plan

> **For agentic workers:** Execute inline in this session. User already ordered a full conversion.

**Goal:** Ship a Flutter iOS/Android client and a PostgreSQL-backed API that cover every Manage.kar entity.

**Architecture:** Fastify + Prisma own the database. Flutter talks JSON over JWT. Habit streaks stay server-computed using the existing schedule rules.

**Tech Stack:** Flutter 3.47, Dart 3.13, Fastify 5, Prisma 6, PostgreSQL 16, Vitest, permission_handler, record.

## Global Constraints

- Product remains tasks / notes / habits / goals / time / focus. No recruiting surfaces.
- Every query is `user_id` scoped.
- Voice files are disk objects, not JSON data URLs.
- iOS Info.plist ships real microphone and notification usage strings.
- Next.js stays as the web reference; it is not deleted.

---

### Task 1: API schema + auth + resources

**Files:** `apps/api/**`

- [x] PostgreSQL databases `managekar` / `managekar_test`
- [ ] Prisma models for user, settings, tasks, notes, habits, goals, time, focus
- [ ] Vitest against a live test database
- [ ] Fastify routes matching the design table

### Task 2: Flutter client + iOS permission modules

**Files:** `apps/mobile/**`

- [ ] Auth, shell, and every entity screen
- [ ] Info.plist + AndroidManifest permission modules
- [ ] `flutter analyze` clean

### Task 3: VPS compose + docs

- [ ] `docker-compose.yml`
- [ ] Deploy notes for later SSH
