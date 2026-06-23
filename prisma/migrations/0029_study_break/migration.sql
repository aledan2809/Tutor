-- CreateTable
CREATE TABLE "StudyBreak" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudyBreak_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudyBreak_userId_startDate_idx" ON "StudyBreak"("userId", "startDate");
