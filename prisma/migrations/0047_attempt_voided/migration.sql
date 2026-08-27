-- Incercarile scoase din scor pentru ca intrebarea nu avea nicio varianta
-- corecta. Aplicate deja manual pe productie la remedierea din 2026-08-26/27;
-- IF NOT EXISTS le face idempotente, ca schema si baza sa fie iar de acord.
ALTER TABLE "Attempt" ADD COLUMN IF NOT EXISTS "voided" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Attempt" ADD COLUMN IF NOT EXISTS "voidReason" TEXT;
