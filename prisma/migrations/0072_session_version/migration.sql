-- Raised on every password change, so sessions signed in before it stop working (True E2E 2026-09-26).
-- Additive only: one column with a default; existing sessions carry no version and read as 0.
-- Waits at most 5 s for the table lock: a sign-in holding a row lock would otherwise queue every
-- later query on "User" behind this ALTER. If it gives up, the deploy stops before touching the site;
-- Prisma then records the migration as failed and refuses to go on (P3009) until it is marked rolled
-- back: `npx prisma migrate resolve --rolled-back 0072_session_version`, then deploy again (the
-- statement was rolled back, and IF NOT EXISTS makes the retry safe).
SET lock_timeout = '5s';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sessionVersion" INTEGER NOT NULL DEFAULT 0;
