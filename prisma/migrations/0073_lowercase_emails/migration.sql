-- Emails are stored lowercase from now on (True E2E 2026-09-26); older rows kept the capitals they
-- were typed with, and sign-in by the lowercase spelling missed them. Lowercases every row whose
-- lowercase form belongs to no other account; a collision (two rows differing only in capitals) is
-- left as it is, for a person to decide — the lookups refuse to guess between them.
-- If the 5 s lock wait gives up, the deploy stops before touching the site: mark this migration
-- rolled back (`npx prisma migrate resolve --rolled-back 0073_lowercase_emails`) and deploy again.
SET lock_timeout = '5s';
UPDATE "User" u
   SET email = lower(btrim(u.email))
 WHERE u.email <> lower(btrim(u.email))
   AND NOT EXISTS (
     SELECT 1 FROM "User" v
      WHERE v.id <> u.id AND lower(btrim(v.email)) = lower(btrim(u.email))
   );
