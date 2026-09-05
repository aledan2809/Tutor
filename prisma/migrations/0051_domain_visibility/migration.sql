-- Domain.visibility — make "private" a stored decision instead of a naming accident.
--
-- Before this, whether a domain was reachable was decided by a regex over its slug
-- (src/lib/exam-level.ts classifyDomainSlug): anything not ending in -v-viii / cl-viii
-- / -ix-xii counted as "restricted". That is why chimie, biologie, istorie and
-- geografie were hidden although nobody chose to hide them, and why renaming a
-- domain silently changed who could reach it.
--
-- The backfill below reproduces EXACTLY the set that is visible today, so the day
-- this ships nothing changes for any user. Everything else becomes PRIVATE, which is
-- also the default for domains created from now on: a domain nobody has published
-- yet must not leak.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DomainVisibility') THEN
    CREATE TYPE "DomainVisibility" AS ENUM ('PUBLIC', 'PRIVATE');
  END IF;
END
$$;

ALTER TABLE "Domain"
  ADD COLUMN IF NOT EXISTS "visibility" "DomainVisibility" NOT NULL DEFAULT 'PRIVATE';

-- Same predicate as classifyDomainSlug(), transcribed to POSIX regex.
UPDATE "Domain"
   SET "visibility" = 'PUBLIC'
 WHERE "slug" ~ '(-v-viii|cl-viii)$'
    OR "slug" ~ '-ix-xii$';
