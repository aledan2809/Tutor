-- CreateTable
CREATE TABLE "QuestionFeedback" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT,
    "rating" TEXT NOT NULL,
    "comment" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuestionFeedback_userId_questionId_key" ON "QuestionFeedback"("userId", "questionId");
CREATE INDEX "QuestionFeedback_status_rating_idx" ON "QuestionFeedback"("status", "rating");
CREATE INDEX "QuestionFeedback_questionId_idx" ON "QuestionFeedback"("questionId");
