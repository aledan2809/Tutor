-- Parent↔child link for the family plan. Scopes a WATCHER (parent) to ONLY the
-- linked children, closing the family-plan minor-data leak. Additive.
CREATE TABLE "Guardian" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Guardian_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Guardian_parentId_childId_key" ON "Guardian"("parentId", "childId");
CREATE INDEX "Guardian_parentId_idx" ON "Guardian"("parentId");
CREATE INDEX "Guardian_childId_idx" ON "Guardian"("childId");

ALTER TABLE "Guardian" ADD CONSTRAINT "Guardian_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Guardian" ADD CONSTRAINT "Guardian_childId_fkey" FOREIGN KEY ("childId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
