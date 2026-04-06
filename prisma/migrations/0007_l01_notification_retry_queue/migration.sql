-- CreateTable
CREATE TABLE "NotificationRetry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "nextRetryAt" TIMESTAMP(3) NOT NULL,
    "lastError" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationRetry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NotificationRetry_status_nextRetryAt_idx" ON "NotificationRetry"("status", "nextRetryAt");

-- CreateIndex
CREATE INDEX "NotificationRetry_userId_idx" ON "NotificationRetry"("userId");

-- AddForeignKey
ALTER TABLE "NotificationRetry" ADD CONSTRAINT "NotificationRetry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
