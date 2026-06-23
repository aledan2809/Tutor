-- CreateTable
CREATE TABLE "ParentNudge" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "intervalMin" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "fireCount" INTEGER NOT NULL DEFAULT 0,
    "lastFiredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParentNudge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ParentNudge_active_idx" ON "ParentNudge"("active");

-- CreateIndex
CREATE INDEX "ParentNudge_childId_idx" ON "ParentNudge"("childId");
