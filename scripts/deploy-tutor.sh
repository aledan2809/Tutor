#!/bin/bash
# Livrare Tutor cu COMUTARE ATOMICĂ.
#
# Problema pe care o rezolvă, măsurată pe 2026-09-10: `next build` rescrie `.next` SUB
# procesul care servește, iar procesul citește din el la cerere. În fereastra aceea,
# rutele neîncărcate încă răspund cu eroare — userul a văzut „Something went wrong" pe
# dashboard, iar în log erau `Cannot find module .next/server/app/[locale]/dashboard/
# progress/page.js` și `.../practice/page.js`. Fișierele existau după deploy; lipseau
# DOAR cât a durat construcția. Cu cinci livrări într-o zi, fereastra se nimerește.
#
# Cum: se construiește într-un arbore separat, legat prin hard-link-uri (`cp -al` —
# instant, aproape fără spațiu în plus), iar la final se comută prin două redenumiri.
# Procesul vechi servește neîntrerupt din `.next` intact până în clipa comutării.
#
# Dacă build-ul eșuează, live-ul NU e atins deloc.
# Revenire: `.next.old` + `node_modules.old` rămân pe disc →
#   mv .next .next.broken && mv .next.old .next \\
#     && mv node_modules node_modules.broken && mv node_modules.old node_modules \\
#     && pm2 restart tutor
#
# ⚠️  ORIGINALUL RULEAZĂ PE VPS2 la `/var/www/deploy-tutor.sh`. Copia asta există ca să
# aibă istoric — un script de livrare care trăiește într-un singur loc, fără versionare,
# e exact felul de fișier care se pierde. La orice modificare, schimbă-le pe amândouă.

set -euo pipefail

LIVE=/var/www/tutor
BUILD=/var/www/tutor-build
APP=tutor

echo "── 1/5 sursă ──"
cd "$LIVE"
git checkout -- package-lock.json 2>/dev/null || true
git pull --ff-only origin master
HEAD_NOU=$(git rev-parse --short HEAD)
echo "  HEAD: $HEAD_NOU"

echo "── 2/5 arbore de build (hard-links) ──"
rm -rf "$BUILD"
cp -al "$LIVE" "$BUILD"
rm -rf "$BUILD/.next"          # scoate DOAR link-urile din arborele de build
cd "$BUILD"
if ! npm install --no-audit --no-fund > /tmp/tutor-install.log 2>&1; then
  echo "  EȘEC la npm install — vezi /tmp/tutor-install.log (live-ul NU a fost atins)"
  tail -5 /tmp/tutor-install.log; exit 1
fi

echo "── 3/5 migrări + client Prisma ──"
# `prisma.config.ts` NU încarcă `.env` singur, iar `migrate deploy` NU regenerează clientul.
export DATABASE_URL=$(grep "^DATABASE_URL=" .env | head -1 | cut -d= -f2- | tr -d "\"")
npx prisma migrate deploy 2>&1 | tail -2
npx prisma generate >/dev/null 2>&1

echo "── 4/5 construcție (live-ul servește în continuare) ──"
if ! NODE_OPTIONS=--max-old-space-size=4096 npm run build > /tmp/tutor-build.log 2>&1; then
  echo "  BUILD EȘUAT — live-ul NU a fost atins:"; grep -A4 "Error:" /tmp/tutor-build.log | head -20; exit 1
fi
test -f .next/BUILD_ID || { echo "  BUILD_ID lipsă — live-ul NU a fost atins"; exit 1; }

echo "── 5/5 comutare atomică ──"
# Se comută .next ȘI node_modules, împreună.
#
# De ce amândouă, măsurat pe 2026-09-10: `npm install` și `prisma generate` rulează în
# arborele de BUILD. `cp -al` leagă fișierele prin hard-link, dar prisma REscrie clientul
# generat, ceea ce rupe legătura — deci noul client rămâne în build, iar live-ul păstrează
# unul vechi. Build-ul trece (se verifică pe clientul nou), producția cade la rulare:
# „Unknown field `meteredIncluded` for select statement on model `Organization`" în log,
# după o livrare raportată ca reușită. Aceeași capcană există pentru orice dependență nouă.
rm -rf "$LIVE/.next.old" "$LIVE/node_modules.old"
mv "$LIVE/.next" "$LIVE/.next.old"                       # instant
mv "$LIVE/node_modules" "$LIVE/node_modules.old"         # instant
mv "$BUILD/.next" "$LIVE/.next"                          # instant
mv "$BUILD/node_modules" "$LIVE/node_modules"            # instant — fereastra de risc = aceste patru linii
pm2 restart "$APP" --update-env >/dev/null
echo "  comutat + repornit ($HEAD_NOU)"

COD=000
for _ in $(seq 1 20); do
  COD=$(curl -s -o /dev/null -w "%{http_code}" -m 10 https://etutor.ro/ro/posta || echo 000)
  [ "$COD" = "200" ] && break
  sleep 3
done
echo "  GET /ro/posta → $COD"
[ "$COD" = "200" ] || { echo "  ⚠️  nu răspunde după 60s — pm2 logs tutor"; exit 1; }
