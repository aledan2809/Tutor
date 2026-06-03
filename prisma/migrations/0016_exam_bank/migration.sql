-- CreateTable
CREATE TABLE "ExamPaper" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "examType" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "subjectKey" TEXT NOT NULL,
    "subjectName" TEXT NOT NULL,
    "grade" INTEGER NOT NULL DEFAULT 8,
    "variant" TEXT NOT NULL DEFAULT 'model',
    "maxScore" INTEGER NOT NULL DEFAULT 100,
    "officeBonus" INTEGER NOT NULL DEFAULT 10,
    "timeLimit" INTEGER,
    "language" TEXT NOT NULL DEFAULT 'ro',
    "sourceUrl" TEXT,
    "license" TEXT,
    "domainId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamPaper_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamPassage" (
    "id" TEXT NOT NULL,
    "paperId" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "title" TEXT,
    "author" TEXT,
    "sourceNote" TEXT,
    "body" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamPassage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamItem" (
    "id" TEXT NOT NULL,
    "paperId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "options" JSONB,
    "correctAnswer" TEXT,
    "rubric" JSONB,
    "passageRef" TEXT,
    "hasFigure" BOOLEAN NOT NULL DEFAULT false,
    "figureNote" TEXT,
    "autoGradable" BOOLEAN NOT NULL DEFAULT false,
    "topic" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExamPaper_examType_year_subjectKey_variant_key" ON "ExamPaper"("examType", "year", "subjectKey", "variant");

-- CreateIndex
CREATE INDEX "ExamPassage_paperId_idx" ON "ExamPassage"("paperId");

-- CreateIndex
CREATE INDEX "ExamItem_paperId_orderIndex_idx" ON "ExamItem"("paperId", "orderIndex");

-- AddForeignKey
ALTER TABLE "ExamPassage" ADD CONSTRAINT "ExamPassage_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "ExamPaper"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamItem" ADD CONSTRAINT "ExamItem_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "ExamPaper"("id") ON DELETE CASCADE ON UPDATE CASCADE;
