-- The family pays the difference to the package with one more parent (Family → Family Duo): additive,
-- zero for every existing account, so nothing changes until a difference is actually paid.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "paidExtraParentSeats" INTEGER NOT NULL DEFAULT 0;
