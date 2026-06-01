-- Phase 13: Magic Quiz persistence (Tier 1 viral — duel + lazy-save + certificate)

-- CreateTable
CREATE TABLE "MagicQuiz" (
    "id" TEXT NOT NULL,
    "questions" JSONB NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'ro',
    "creatorName" TEXT,
    "sharerScore" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "takenCount" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MagicQuiz_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MagicQuiz_userId_idx" ON "MagicQuiz"("userId");

-- CreateIndex
CREATE INDEX "MagicQuiz_expiresAt_idx" ON "MagicQuiz"("expiresAt");

-- AddForeignKey
ALTER TABLE "MagicQuiz" ADD CONSTRAINT "MagicQuiz_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
