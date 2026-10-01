-- Curățenie înainte de repornirea cron-urilor de remindere (bucla de e-mailuri, 01.10.2026).
-- Se rulează O DATĂ, pe VPS2, DUPĂ livrarea codului nou și ÎNAINTE de scoaterea prefixului
-- #PAUSED-TUTOR-EMAIL-LOOP-2026-10-01 din crontab. Doar cu OK-ul lui Alex, după copia bazei:
--   sudo -u postgres pg_dump -Fc tutor > /root/backups/tutor-pre-curatenie-alerte-2026-10-01.dump
-- Rulare: psql "<DATABASE_URL fără ?schema=>" -v ON_ERROR_STOP=1 -f curatenie-inainte-de-repornire.sql
--
-- De ce: cât au stat cron-urile oprite, n-a pornit niciun lanț nou, dar au rămas în bază trei lucruri care
-- la repornire ar trimite mesaje vechi sau duble:
--   1. trepte de remindere care așteptau (PENDING/ESCALATING) — ar pleca la copii cu zile întârziere;
--   2. episoade de alertă către părinți încă deschise, din regula veche (unele cu treapta 84);
--   3. episoade vechi al căror „început” e cel mai vechi eveniment din fereastra de 12 ore, nu prima treaptă
--      a lanțului — regula nouă le-ar lua drept neraportate și ar trimite încă o alertă.

BEGIN;

-- Previzualizare: ce se schimbă.
SELECT 'trepte care așteaptă' AS ce, count(*) FROM "EscalationEvent" WHERE status IN ('PENDING', 'ESCALATING')
UNION ALL
SELECT 'episoade deschise', count(*) FROM "ParentEscalation" WHERE status IN ('awaiting_parent', 'authorized');

-- 1. Treptele care așteptau din dinaintea opririi: închise, netrimise (ca o treaptă sărită) și marcate ca
--    încheiate, cum închide motorul un lanț oprit de pauză.
UPDATE "EscalationEvent"
SET status = 'COMPLETED',
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('closed', 'paused'),
    "updatedAt" = NOW()
WHERE status IN ('PENDING', 'ESCALATING');

-- 2. Episoadele deschise: închise fără niciun mesaj (o ratare nouă deschide unul nou, după regula nouă).
UPDATE "ParentEscalation"
SET status = 'expired', "resolvedAt" = NOW(), "updatedAt" = NOW()
WHERE status IN ('awaiting_parent', 'authorized');

-- 3. Episoadele vechi primesc începutul lanțului pe care l-au raportat: prima treaptă (nivelul 1) cea mai
--    recentă dinaintea deschiderii lor. Nu coboară niciodată valoarea existentă.
UPDATE "ParentEscalation" pe
SET "openedFor" = GREATEST(
      pe."openedFor",
      (SELECT MAX(e."createdAt")
         FROM "EscalationEvent" e
        WHERE e."userId" = pe."childId"
          AND e.level = 1
          AND e."isTest" = false
          AND (e.metadata->>'reason') IS DISTINCT FROM 'parent_authorized'
          AND e."createdAt" <= pe."createdAt")
    ),
    "updatedAt" = NOW();

-- Control după: trebuie 0 și 0.
SELECT 'trepte care așteaptă (după)' AS ce, count(*) FROM "EscalationEvent" WHERE status IN ('PENDING', 'ESCALATING')
UNION ALL
SELECT 'episoade deschise (după)', count(*) FROM "ParentEscalation" WHERE status IN ('awaiting_parent', 'authorized');

COMMIT;
