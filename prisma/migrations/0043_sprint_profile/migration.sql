-- Sprint de calcul (chained mental arithmetic): per-student adaptive state.
--
-- Written ONLY by the mandatory end-of-session feedback route. `level` is the
-- centre of the difficulty band the next session ramps across (1..5) and
-- `timeFactor` scales the per-question clock (0.5..2.5). Both start at the
-- gentlest setting, so a student with no row yet behaves exactly like a new one.
--
-- Fully additive: a brand-new table, no existing column or row is touched.
CREATE TABLE "SprintProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "timeFactor" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "sessions" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SprintProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SprintProfile_userId_domainId_key" ON "SprintProfile"("userId", "domainId");
CREATE INDEX "SprintProfile_userId_idx" ON "SprintProfile"("userId");

ALTER TABLE "SprintProfile" ADD CONSTRAINT "SprintProfile_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SprintProfile" ADD CONSTRAINT "SprintProfile_domainId_fkey"
    FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;
