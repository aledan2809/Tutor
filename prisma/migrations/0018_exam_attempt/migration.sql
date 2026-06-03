-- AlterTable
ALTER TABLE "ExamItem" ADD COLUMN "finalAnswer" TEXT;

-- CreateTable
CREATE TABLE "ExamAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paperId" TEXT NOT NULL,
    "objectiveAnswers" JSONB NOT NULL,
    "selfScores" JSONB,
    "rawPoints" INTEGER NOT NULL DEFAULT 0,
    "note10" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isEstimate" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExamAttempt_userId_paperId_idx" ON "ExamAttempt"("userId", "paperId");

-- CreateIndex
CREATE INDEX "ExamAttempt_userId_createdAt_idx" ON "ExamAttempt"("userId", "createdAt");
