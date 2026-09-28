-- Child accounts made by a parent (username, password the parent can set) and the age of a learner
-- who makes their own account, with a parent's consent under 16 (Alex, 28.09.2026). Additive only.
-- If the 5 s lock wait gives up, the deploy stops before touching the site: mark this migration
-- rolled back (`npx prisma migrate resolve --rolled-back 0074_child_accounts_and_age`) and deploy again.
SET lock_timeout = '5s';
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "createdByParentId" TEXT,
  ADD COLUMN IF NOT EXISTS "birthYear" INTEGER,
  ADD COLUMN IF NOT EXISTS "parentConsentEmail" TEXT,
  ADD COLUMN IF NOT EXISTS "parentConsentRequestedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "parentConsentAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "parentConsentRefusedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "ParentalConsent" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "parentEmail" TEXT NOT NULL,
  "decision" TEXT NOT NULL,
  "textVersion" TEXT NOT NULL,
  "ip" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ParentalConsent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ParentalConsent_userId_idx" ON "ParentalConsent"("userId");
DO $$ BEGIN
  ALTER TABLE "ParentalConsent" ADD CONSTRAINT "ParentalConsent_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
