# HRMS – Deployment & Operations Runbook

## 1. Required configuration
Copy `backend/.env.example` and `frontend/.env.example`.

| Where | Variable | Notes |
|---|---|---|
| backend | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET` | JWT secret ≥ 32 chars |
| backend (production) | `CORS_ORIGINS`, `FRONTEND_LOGIN_URL` | server **refuses to start** if missing / localhost |
| backend | `TRUST_PROXY` | `1` behind Render/Railway/nginx |
| frontend (build time) | `VITE_API_BASE_URL` | `npm run build` **fails** if missing / localhost |

## 2. Health checks
- `GET /health` – liveness (process is up).
- `GET /ready` – readiness (database reachable, returns 503 otherwise). Point the platform health check at `/ready`.
- On SIGTERM the server stops the cron jobs, finishes in-flight requests and exits.

## 3. Database migrations (one-time baseline, then versioned)
The schema was created by hand-run SQL in Supabase, so Prisma has no history yet.

1. Make a Supabase backup (Dashboard → Database → Backups, or `pg_dump`).
2. Confirm `prisma/schema.prisma` matches the live DB: `npx prisma db pull --print` and compare.
3. Generate the baseline: `mkdir -p prisma/migrations/0_init && npm run db:baseline > prisma/migrations/0_init/migration.sql`
4. Mark it as already applied on the live DB: `npx prisma migrate resolve --applied 0_init`
5. From now on every change = `npx prisma migrate dev --name <change>` locally → commit → `npx prisma migrate deploy` on staging, then production.
6. Never edit the production schema by hand again.

Rollback: restore the pre-release backup (Supabase point-in-time recovery / `pg_restore`); migrations are forward-only, so write a reverse migration for anything destructive.

## 4. Release order
1. CI green (lint, tests, audit, build).
2. Deploy to **staging** (separate Supabase project), run `migrate deploy`.
3. Role-based acceptance test (Admin, HR, Employee, Intern): login, leave, attendance, payroll run, permissions.
4. Backup production DB → `migrate deploy` → deploy backend → deploy frontend.

## 5. Known follow-ups (not code-fixable here)
- JWTs are kept in browser storage. Moving to HttpOnly secure cookies needs coordinated backend + frontend changes and CSRF handling; until then keep XSS risk low (no `dangerouslySetInnerHTML` with user data, strict CSP at the web host).
- Add a monitoring / error-tracking service (e.g. Sentry) and uptime check on `/ready`.
- Existing users keep their old passwords; the new 8-character + letter + number rule applies whenever a password is set or changed.
- Local archives (`*.zip`) and `node_modules` must not be part of deploy artifacts (now git-ignored).
