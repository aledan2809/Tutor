-- Parent-monitoring episode: opened when a child ignores their whole cascade.
CREATE TABLE "ParentEscalation" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'awaiting_parent',
    "childChannel" TEXT,
    "openedFor" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastParentNotifiedAt" TIMESTAMP(3),
    "authorizedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParentEscalation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ParentEscalation_childId_status_idx" ON "ParentEscalation"("childId", "status");
CREATE INDEX "ParentEscalation_status_idx" ON "ParentEscalation"("status");

ALTER TABLE "ParentEscalation" ADD CONSTRAINT "ParentEscalation_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ParentEscalation" ADD CONSTRAINT "ParentEscalation_childId_fkey" FOREIGN KEY ("childId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
