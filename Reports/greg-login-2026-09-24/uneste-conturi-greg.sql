-- Unește cele două conturi ale lui Greg în „greg” (decizie Alex, 24.09.2026).
-- „greg” (cmud1qyxx000x65f7m3hpsq43): parola lui, legat de invitație, înscris la Agent imobiliar.
-- Contul cu email (cmud10voy008l9sq37k2yj6eq): parola dată de admin, 0 exerciții, 0 lecții → se șterge,
-- iar emailul lui trece pe „greg”. O singură tranzacție; orice legătură neașteptată o oprește.
BEGIN;
SELECT 'account' t, count(*) FROM "Account" WHERE "userId"='cmud10voy008l9sq37k2yj6eq'
UNION ALL SELECT 'guardian', count(*) FROM "Guardian" WHERE "parentId"='cmud10voy008l9sq37k2yj6eq' OR "childId"='cmud10voy008l9sq37k2yj6eq'
UNION ALL SELECT 'enrollment', count(*) FROM "Enrollment" WHERE "userId"='cmud10voy008l9sq37k2yj6eq'
UNION ALL SELECT 'attempt', count(*) FROM "Attempt" WHERE "userId"='cmud10voy008l9sq37k2yj6eq';
DELETE FROM "User" WHERE id='cmud10voy008l9sq37k2yj6eq' AND email='grigore.soare@yahoo.com';
UPDATE "User" SET email='grigore.soare@yahoo.com' WHERE id='cmud1qyxx000x65f7m3hpsq43' AND username='greg' AND email IS NULL;
SELECT id,name,username,email FROM "User" WHERE id IN ('cmud1qyxx000x65f7m3hpsq43','cmud10voy008l9sq37k2yj6eq');
COMMIT;
