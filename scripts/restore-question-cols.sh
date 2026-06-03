#!/usr/bin/env bash
# Restore Question.options + Question.correctAnswer from the pre-normalize
# backup (staging-table approach; avoids dropping the live table / its FKs).
set -euo pipefail
cd /var/www/tutor
DBURL=$(grep ^DATABASE_URL= .env | head -1 | cut -d= -f2- | tr -d '"')
BK=/root/backups/tutor-Question-pre-normalize-2026-06-03.sql

psql "$DBURL" -v ON_ERROR_STOP=1 -c 'DROP TABLE IF EXISTS q_stage; CREATE TABLE q_stage (LIKE "Question" INCLUDING DEFAULTS);'

# Pull just the COPY block for "Question", retarget it to q_stage, load it.
awk '
  /^COPY public\."Question"/ { sub(/COPY public\."Question"/, "COPY q_stage"); f=1; print; next }
  f { print; if ($0 == "\\.") exit }
' "$BK" | psql "$DBURL" -v ON_ERROR_STOP=1

psql "$DBURL" -v ON_ERROR_STOP=1 -c 'UPDATE "Question" q SET options = s.options, "correctAnswer" = s."correctAnswer" FROM q_stage s WHERE q.id = s.id;'

echo "=== Drept Penal correctAnswer after restore (expect C.pen. ...) ==="
psql "$DBURL" -tAc "SELECT \"correctAnswer\" FROM \"Question\" WHERE id='cmo0ir5ol0005dfak6m5yxuo0';"

psql "$DBURL" -v ON_ERROR_STOP=1 -c 'DROP TABLE q_stage;'
echo "restore done"
