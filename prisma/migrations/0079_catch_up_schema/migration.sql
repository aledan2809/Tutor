-- Catch-up (13.10.2026): what the schema has and no migration ever created. Production got these through
-- `db push` long ago, so a database built only from prisma/migrations (QA, a restore drill, a new server)
-- lacked them: the figure and source columns of "Question" (the demo without an account came back empty),
-- the "Bibliography" and "PushSubscription" tables and a handful of indexes.
--
-- Only adds, and only what is missing: on production every statement is a no-op. It never drops anything:
-- the old objects the schema no longer has (ImpersonationSession, the retry columns of "Notification",
-- ExamConfig."weakAreaThreshold", some old indexes) stay where they are.

ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "sourceReference" TEXT;
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "bookOrder" INTEGER;
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "pdfPage" INTEGER;
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "bookPage" INTEGER;
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "qNumberInBook" INTEGER;
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "chapterIndex" INTEGER;
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "explanationVideoUrl" TEXT;

CREATE TABLE IF NOT EXISTS "Bibliography" (
    "id" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "authors" TEXT NOT NULL,
    "publisher" TEXT,
    "year" INTEGER,
    "edition" TEXT,
    "city" TEXT,
    "isbn" TEXT,
    "url" TEXT,
    "notes" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bibliography_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Bibliography_domainId_status_idx" ON "Bibliography"("domainId", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");
CREATE INDEX IF NOT EXISTS "PushSubscription_userId_idx" ON "PushSubscription"("userId");
CREATE INDEX IF NOT EXISTS "Attempt_sessionId_idx" ON "Attempt"("sessionId");
CREATE INDEX IF NOT EXISTS "Attempt_userId_questionId_idx" ON "Attempt"("userId", "questionId");
CREATE INDEX IF NOT EXISTS "Enrollment_domainId_isActive_idx" ON "Enrollment"("domainId", "isActive");
CREATE INDEX IF NOT EXISTS "LeaderboardEntry_domainId_groupId_week_year_idx" ON "LeaderboardEntry"("domainId", "groupId", "week", "year");
CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");
CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "Question_domainId_status_idx" ON "Question"("domainId", "status");
CREATE INDEX IF NOT EXISTS "Question_domainId_subject_topic_idx" ON "Question"("domainId", "subject", "topic");
CREATE INDEX IF NOT EXISTS "Question_domainId_status_type_idx" ON "Question"("domainId", "status", "type");
CREATE INDEX IF NOT EXISTS "Question_domainId_status_difficulty_idx" ON "Question"("domainId", "status", "difficulty");
CREATE INDEX IF NOT EXISTS "Session_userId_domainId_idx" ON "Session"("userId", "domainId");
CREATE INDEX IF NOT EXISTS "Session_userId_startedAt_idx" ON "Session"("userId", "startedAt");
CREATE INDEX IF NOT EXISTS "UserGamification_domainId_level_idx" ON "UserGamification"("domainId", "level");
CREATE INDEX IF NOT EXISTS "UserGamification_userId_lastActivityDate_idx" ON "UserGamification"("userId", "lastActivityDate");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Bibliography_domainId_fkey') THEN
    ALTER TABLE "Bibliography" ADD CONSTRAINT "Bibliography_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PushSubscription_userId_fkey') THEN
    ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
