#!/bin/zsh
# Probe: how many parent-consent emails one address can trigger per minute via POST /api/auth/register (QA only).
BEFORE=$(ls /Users/danciulescu/Projects/Tutor/Reports/true-e2e-2026-10-05/mailbox | wc -l | tr -d ' ')
T=$(date +%s)
for i in $(seq 1 25); do
  code=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3113/api/auth/register \
    -H 'Content-Type: application/json' \
    -d "{\"name\":\"qa-e2e-1005-flood-$i\",\"email\":\"qa-e2e-1005-flood-$i-$T@example.test\",\"password\":\"Parola12345!\",\"birthDate\":\"2014-05-05\",\"parentEmail\":\"qa-e2e-1005-victim-$i-$T@example.test\"}")
  echo "$i $code"
done
sleep 4
AFTER=$(ls /Users/danciulescu/Projects/Tutor/Reports/true-e2e-2026-10-05/mailbox | wc -l | tr -d ' ')
echo "mailbox before=$BEFORE after=$AFTER new=$((AFTER-BEFORE))"
