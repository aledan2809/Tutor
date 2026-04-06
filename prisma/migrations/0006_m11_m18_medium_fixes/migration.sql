-- M11: Add configurable weak area threshold to ExamConfig
ALTER TABLE "ExamConfig" ADD COLUMN "weakAreaThreshold" DOUBLE PRECISION;

-- M18: Add notification retry queue fields
ALTER TABLE "Notification" ADD COLUMN "channel" TEXT;
ALTER TABLE "Notification" ADD COLUMN "nextRetryAt" TIMESTAMP(3);
ALTER TABLE "Notification" ADD COLUMN "retryCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Notification" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'SENT';

-- CreateIndex for retry processing
CREATE INDEX "Notification_status_nextRetryAt_idx" ON "Notification"("status", "nextRetryAt");
