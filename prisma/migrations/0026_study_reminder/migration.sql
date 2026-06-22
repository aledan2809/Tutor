-- Recurring scheduled study reminders (days + time → escalation cascade + deep-link).
CREATE TABLE "StudyReminder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT,
    "window" TEXT NOT NULL DEFAULT 'morning',
    "sessionType" TEXT NOT NULL DEFAULT 'quick',
    "daysOfWeek" INTEGER[],
    "hour" INTEGER NOT NULL,
    "minute" INTEGER NOT NULL DEFAULT 0,
    "domainSlug" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Bucharest',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastFiredOn" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyReminder_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StudyReminder_userId_idx" ON "StudyReminder"("userId");
CREATE INDEX "StudyReminder_isActive_idx" ON "StudyReminder"("isActive");

ALTER TABLE "StudyReminder" ADD CONSTRAINT "StudyReminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
