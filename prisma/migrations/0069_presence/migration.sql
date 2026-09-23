-- Presence: when an account last signed in, and the stays on the site.
-- Additive only: a new nullable column and a new table; nothing existing changes.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "UserVisit" (
  "id"         TEXT NOT NULL,
  "userId"     TEXT NOT NULL,
  "startedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "pings"      INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT "UserVisit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "UserVisit_userId_lastSeenAt_idx" ON "UserVisit"("userId", "lastSeenAt");
CREATE INDEX IF NOT EXISTS "UserVisit_lastSeenAt_idx" ON "UserVisit"("lastSeenAt");

ALTER TABLE "UserVisit" DROP CONSTRAINT IF EXISTS "UserVisit_userId_fkey";
ALTER TABLE "UserVisit" ADD CONSTRAINT "UserVisit_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- The history columns read activity by (user, time); without these the estimate over 30 days
-- sorts the whole per-user history on every admin page load.
CREATE INDEX IF NOT EXISTS "Attempt_userId_createdAt_idx" ON "Attempt"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "LessonProgress_userId_updatedAt_idx" ON "LessonProgress"("userId", "updatedAt");
