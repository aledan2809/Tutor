-- Date of birth instead of the year alone (Alex, 28.09.2026: the 16th birthday can be days or months
-- away, so the year alone can't tell).
--
-- Additive only. "birthYear" stays in the table, unused by the new code, and goes in a later deploy:
-- the build of this deploy runs while the previous build still serves, and that one reads it.
--
-- Every known year becomes the LAST day of that year: the latest possible birthday. That keeps the old
-- year rule exactly (asked for consent while they may be under 16, no prices until surely 18), keeps
-- a learner's waiting or refused state, and can't be undone by answering the question again.
SET lock_timeout = '5s';

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "birthDate" DATE;

UPDATE "User"
   SET "birthDate" = make_date("birthYear", 12, 31)
 WHERE "birthYear" IS NOT NULL
   AND "birthDate" IS NULL;
