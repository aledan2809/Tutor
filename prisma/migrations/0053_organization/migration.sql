-- Organization — the merchant boundary.
--
-- Until now the platform had exactly one kind of administrator: the superadmin.
-- The per-domain ADMIN enrollment role existed but could do almost nothing: 41 of
-- the admin routes check `isSuperAdmin` (including the helper misleadingly named
-- `requireAdmin`), so a "domain admin" saw the panel and was refused by it.
--
-- This adds the second kind: a merchant admin, who administers their own
-- organization — its subjects, its content, its people — and nothing else.
--
-- Additive and inert on its own: every existing row gets organizationId = NULL,
-- which means platform-owned, i.e. superadmin-only, exactly as before. Nobody
-- becomes a merchant admin until someone is explicitly made one.

CREATE TABLE IF NOT EXISTS "Organization" (
  "id"        TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "slug"      TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Organization_slug_key" ON "Organization"("slug");

ALTER TABLE "Domain" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
ALTER TABLE "User"   ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
ALTER TABLE "User"   ADD COLUMN IF NOT EXISTS "isOrgAdmin" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "Domain_organizationId_idx" ON "Domain"("organizationId");
CREATE INDEX IF NOT EXISTS "User_organizationId_idx"   ON "User"("organizationId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Domain_organizationId_fkey') THEN
    ALTER TABLE "Domain" ADD CONSTRAINT "Domain_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'User_organizationId_fkey') THEN
    ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;
