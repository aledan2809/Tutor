-- CreateTable
CREATE TABLE "LicentaDocument" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "totalPassages" INTEGER NOT NULL DEFAULT 0,
    "processedPassages" INTEGER NOT NULL DEFAULT 0,
    "questionCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "error" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LicentaDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LicentaDocument_userId_createdAt_idx" ON "LicentaDocument"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "LicentaDocument_domainId_idx" ON "LicentaDocument"("domainId");
