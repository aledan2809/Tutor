-- CreateTable
CREATE TABLE "WatcherReportSchedule" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "childId" TEXT,
    "cadence" TEXT NOT NULL DEFAULT 'weekly',
    "dayOfWeek" INTEGER,
    "hour" INTEGER NOT NULL DEFAULT 8,
    "minute" INTEGER NOT NULL DEFAULT 0,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Bucharest',
    "channels" TEXT[] DEFAULT ARRAY['EMAIL']::TEXT[],
    "sections" TEXT[] DEFAULT ARRAY['sessions', 'discipline', 'weaknesses', 'results']::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSentOn" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WatcherReportSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WatcherReportSchedule_parentId_idx" ON "WatcherReportSchedule"("parentId");

-- CreateIndex
CREATE INDEX "WatcherReportSchedule_isActive_idx" ON "WatcherReportSchedule"("isActive");
