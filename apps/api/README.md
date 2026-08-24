# Manage.kar API

Fast JSON API in front of PostgreSQL. Same resource shape as a Laravel Sanctum API.

```bash
pnpm install
pnpm exec prisma db push
pnpm test
pnpm dev
```

Default URL: `http://127.0.0.1:4000`

Voice files: `POST /api/notes/:id/voice` as multipart field `audio`, then `GET` the same path with a bearer token.
