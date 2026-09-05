-- Domain.joinCode — an admin-issued code that lets a person enroll themselves into
-- a private domain. Null = no code in circulation. Unique so a code names exactly
-- one domain; rotating it invalidates the old one for future joins only —
-- enrollments already made are untouched.

ALTER TABLE "Domain" ADD COLUMN IF NOT EXISTS "joinCode" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Domain_joinCode_key" ON "Domain"("joinCode");
