-- Programa parcursă: clasa elevului + bifele lui pe unitățile de învățare.
-- Aditiv — nu atinge nimic existent.

ALTER TABLE "User" ADD COLUMN "schoolYear" INTEGER;

CREATE TABLE "CurriculumCheck" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "band" TEXT NOT NULL,
    "unitKey" TEXT NOT NULL,
    "schoolYear" INTEGER NOT NULL,
    "taught" BOOLEAN NOT NULL,
    "markedBy" TEXT NOT NULL DEFAULT 'SELF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CurriculumCheck_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CurriculumCheck_userId_band_unitKey_key" ON "CurriculumCheck"("userId", "band", "unitKey");
CREATE INDEX "CurriculumCheck_userId_band_idx" ON "CurriculumCheck"("userId", "band");

ALTER TABLE "CurriculumCheck" ADD CONSTRAINT "CurriculumCheck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
