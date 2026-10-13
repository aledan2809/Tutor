#!/bin/bash
# Livrarea eTutor pe VPS2, cu copie a bazei înainte (13.10.2026). Rulat de Alex, din folderul Tutor de pe Mac:
#
#   git pull && ssh root@72.62.155.74 'bash -s' < scripts/ops/livreaza-tutor.sh
#
# Ce face, în ordine — se oprește la prima problemă, iar până la pasul 4 site-ul nu e atins deloc:
#   1. arată ce versiune rulează acum și ce urmează să intre;
#   2. copie a bazei în /root/backups (pg_dump), verificată că se poate citi;
#   3. livrarea propriu-zisă: /var/www/deploy-tutor.sh (migrări, construcție separată, comutare atomică);
#   4. verifică: migrările la zi, codul nou chiar în build, paginile răspund 200;
#   5. completează figurile lipsă ale grilelor din banca de examene (doar câmpuri goale; copia de la pasul 2 acoperă);
#   6. citește, fără să schimbe nimic, starea comutatorului probei și adresa brokerului de plăți.
#
# NU pornește comutatorul probei. NU atinge .env.
set -euo pipefail

LIVE=/var/www/tutor
STAMP=$(date +%Y-%m-%d-%H%M)
BACKUP=/root/backups/tutor-pre-livrare-$STAMP.dump
# Un fișier din livrarea scrisă odată cu scriptul: origin/master trebuie să-l aibă.
NEEDED=prisma/migrations/0079_catch_up_schema/migration.sql

cd "$LIVE"
echo "══ 1/6 ce rulează și ce intră ══"
ACUM=$(git rev-parse --short HEAD)
git fetch -q origin master
echo "  acum: $ACUM · pe GitHub: $(git rev-parse --short origin/master)"
git log --oneline -40 "HEAD..origin/master" | sed 's/^/    + /'
git cat-file -e "origin/master:$NEEDED" 2>/dev/null || { echo "  ✗ origin/master nu are $NEEDED — nimic atins."; exit 1; }
if [ -n "$(git status --porcelain --untracked-files=no | grep -v ' package-lock.json$' || true)" ]; then
  echo "  ✗ fișiere schimbate direct pe server (în afară de package-lock.json) — nimic atins:"
  git status --porcelain --untracked-files=no | sed 's/^/    /'
  exit 1
fi
test -f /var/www/deploy-tutor.sh || { echo "  ✗ lipsește /var/www/deploy-tutor.sh"; exit 1; }
if ! git show origin/master:scripts/deploy-tutor.sh | diff -q - /var/www/deploy-tutor.sh >/dev/null; then
  echo "  ⚠ /var/www/deploy-tutor.sh diferă de copia din repo (scripts/deploy-tutor.sh); îl folosesc pe cel de pe server."
fi

echo "══ 2/6 copie a bazei ══"
# Prisma pune parametri (ex. ?schema=public) pe care pg_dump nu-i înțelege: îi tai.
DBURL=$(grep "^DATABASE_URL=" .env | head -1 | cut -d= -f2- | tr -d '"' | sed 's/?.*$//')
DBNAME=$(printf '%s' "$DBURL" | sed -E 's#.*/([^/]+)$#\1#')
mkdir -p /root/backups
if ! pg_dump -Fc -d "$DBURL" > "$BACKUP" 2>/tmp/tutor-dump.err; then
  # Tabele care nu sunt ale utilizatorului aplicației: copia o face proprietarul.
  sudo -u postgres pg_dump -Fc -d "$DBNAME" > "$BACKUP" 2>>/tmp/tutor-dump.err || { echo "  ✗ copia a eșuat — nimic atins:"; tail -3 /tmp/tutor-dump.err; exit 1; }
fi
pg_restore -l "$BACKUP" >/dev/null || { echo "  ✗ copia nu se poate citi — nimic atins"; exit 1; }
echo "  $BACKUP ($(du -h "$BACKUP" | cut -f1))"

echo "══ 2b/6 migrările noi: cine le poate aplica ══"
# deploy-tutor.sh rulează `prisma migrate deploy` ca utilizatorul aplicației. Dacă tabelele sunt ale lui `postgres`
# (bază restaurată cu --no-owner), ALTER TABLE pică cu 42501, iar rândul eșuat blochează orice livrare următoare (P3009).
# Atunci le aplic eu înainte, ca proprietar, într-o tranzacție, și le marchez aplicate.
OWNER_OK=$(psql "$DBURL" -XtAc "select coalesce(bool_and(tableowner = current_user), false) from pg_tables where schemaname = 'public' and tablename in ('User', 'Question', 'Attempt', 'Session')")
if [ "$OWNER_OK" = "t" ]; then
  echo "  tabelele sunt ale utilizatorului aplicației: deploy-tutor.sh aplică migrările singur"
else
  echo "  tabelele NU sunt ale utilizatorului aplicației: aplic migrările noi ca proprietar"
  git fetch -q origin master
  APP_USER=$(psql "$DBURL" -XtAc "select current_user")
  for m in $(git ls-tree --name-only origin/master prisma/migrations/ | xargs -n1 basename | grep -E '^[0-9]{4}_' | sort); do
    DONE=$(psql "$DBURL" -XtAc "select count(*) from _prisma_migrations where migration_name = '$m' and finished_at is not null and rolled_back_at is null")
    [ "$DONE" = "0" ] || continue
    echo "  → $m"
    git show "origin/master:prisma/migrations/$m/migration.sql" > "/tmp/tutor-$m.sql"
    sudo -u postgres env PGOPTIONS='-c client_min_messages=warning' psql -d "$DBNAME" -X -q -v ON_ERROR_STOP=1 --single-transaction -f "/tmp/tutor-$m.sql" \
      || { echo "  ✗ $m a eșuat ca proprietar — nimic aplicat din ea (tranzacție), site-ul neatins"; exit 1; }
    sudo -u postgres psql -d "$DBNAME" -X -q -c "GRANT ALL ON ALL TABLES IN SCHEMA public TO \"$APP_USER\"; GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO \"$APP_USER\";"
    DATABASE_URL="$(grep "^DATABASE_URL=" .env | head -1 | cut -d= -f2- | tr -d '"')" npx prisma migrate resolve --applied "$m" 2>&1 | grep -E "applied|Error|P[0-9]{4}" | sed 's/^/    /' || true
  done
fi

echo "══ 3/6 livrare (deploy-tutor.sh) ══"
bash /var/www/deploy-tutor.sh

echo "══ 4/6 verificări ══"
export DATABASE_URL=$(grep "^DATABASE_URL=" .env | head -1 | cut -d= -f2- | tr -d '"')
echo "  versiune: $(git rev-parse --short HEAD)"
npx prisma migrate status 2>&1 | grep -E "up to date|not yet been applied|failed" | sed 's/^/  migrări: /' || true
for f in 0078_subscription_period 0079_catch_up_schema; do
  test -d "prisma/migrations/$f" || { echo "  ✗ lipsește migrarea $f din cod"; exit 1; }
done
# Un șir din codul nou (panoul comutatorului): dacă lipsește, build-ul e vechi.
grep -rqs "launchMessagesAt" .next/server/app/api/admin/access-trial/ && echo "  cod nou în build: da" || { echo "  ✗ codul nou NU e în build"; exit 1; }
FAIL=0
for p in /api/health /ro /ro/try /ro/parinte /ro/auth/register /ro/grile; do
  COD=$(curl -s -o /dev/null -w "%{http_code}" -m 15 "http://127.0.0.1:3013$p" || echo 000)
  echo "  $p → $COD"
  [ "$COD" = "200" ] || FAIL=1
done
[ "$FAIL" = "0" ] || echo "  ⚠ o pagină nu răspunde 200 — pm2 logs tutor --lines 50 --nostream"

echo "══ 5/6 figurile grilelor din banca de examene ══"
# Doar rândurile fără imagine, copiate din ExamItem care are figură (Reports/proba-flux-2026-10-13/RAPORT.md §1).
# NU se rulează din nou grile-from-exambank.mjs: ar șterge istoricul elevilor pe acele grile.
psql "$(printf '%s' "$DATABASE_URL" | sed 's/?.*$//')" -X -q -v ON_ERROR_STOP=1 <<'SQL'
\pset footer off
select count(*) as "grile cu figură în text, fără imagine (înainte)" from "Question"
 where "sourceReference" like 'exam-bank:%' and "imageUrl" is null
   and content ~* '(figur[ai]|desen(ul)?|graficul|schi[țt]a)\s+(al[ăa]turat|de mai (jos|sus))';
begin;
with done as (
  update "Question" q set "imageUrl" = e."figureUrl" from "ExamItem" e
   where q."imageUrl" is null and e."figureUrl" is not null
     and q."sourceReference" like 'exam-bank:' || e.id || ' |%'
  returning q.id)
select count(*) as "imagini completate acum" from done;
commit;
select count(*) as "grile cu figură în text, fără imagine (după)" from "Question"
 where "sourceReference" like 'exam-bank:%' and "imageUrl" is null
   and content ~* '(figur[ai]|desen(ul)?|graficul|schi[țt]a)\s+(al[ăa]turat|de mai (jos|sus))';
SQL

echo "══ 6/6 de citit (nimic schimbat) ══"
psql "$(printf '%s' "$DATABASE_URL" | sed 's/?.*$//')" -X -qtA -c \
  "select coalesce((select 'PORNIT din ' || (value->>'startsAt') from \"AppSetting\" where key = 'accessTrial'), 'OPRIT')" \
  | sed 's/^/  comutatorul probei: /'
echo "  adresa brokerului (STRIPE_BROKER_URL): $(grep '^STRIPE_BROKER_URL=' .env | cut -d= -f2- | tr -d '"' || echo '(lipsește)')"
echo
echo "GATA. Revenire, dacă e nevoie: vezi capul lui /var/www/deploy-tutor.sh (.next.old + node_modules.old);"
echo "baza: pg_restore din $BACKUP."
