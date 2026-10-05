#!/bin/zsh
# Verifier probe: HTML in inviter name + no pending-invite cap. QA stack only.
D=/Users/danciulescu/Projects/Tutor/Reports/true-e2e-2026-10-05/verif-invite-html; cd "$D"
TS=$(date +%s); EMAIL="qa-e2e-1005-inviter-$TS@example.test"; PW='QaE2e!Pass1005'
NAME='<a href="https://rau.example">Banca ta</a>'
BODY=$(python3 -c "import json;print(json.dumps({'name':'$NAME','email':'$EMAIL','password':'$PW','role':'PARENT'}))")
: > RESULT.txt
# wait for the shared /api/auth:write bucket (20/min per address) to clear
for i in $(seq 1 40); do
  R=$(curl -s -X POST http://localhost:3113/api/auth/register -H 'content-type: application/json' -d "$BODY")
  echo "$R" | grep -q "Too many" || break
  sleep 10
done
echo "email=$EMAIL" >> RESULT.txt; echo "register: $R" >> RESULT.txt
docker exec tutor-qa-pg psql -U tutor -d tutor_qa -At -c "update \"User\" set \"emailVerified\"=now() where email='$EMAIL' returning id, name, \"accountRole\";" >> RESULT.txt
rm -f jar; CSRF=$(curl -s -c jar -b jar http://localhost:3113/api/auth/csrf | python3 -c "import json,sys;print(json.load(sys.stdin)['csrfToken'])")
for i in $(seq 1 12); do
  CODE=$(curl -s -c jar -b jar -o /dev/null -w "%{http_code}" -X POST http://localhost:3113/api/auth/callback/credentials \
    --data-urlencode "csrfToken=$CSRF" --data-urlencode "email=$EMAIL" --data-urlencode "password=$PW" --data-urlencode "json=true")
  [ "$CODE" != "429" ] && break; sleep 10
done
echo "signin callback: $CODE" >> RESULT.txt
curl -s -b jar http://localhost:3113/api/auth/session | head -c 300 >> RESULT.txt; echo >> RESULT.txt
echo "--- invites" >> RESULT.txt
for i in 1 2 3 4 5; do
  curl -s -b jar -X POST http://localhost:3113/api/dashboard/family/invite -H 'content-type: application/json' \
   -d "{\"target\":\"CHILD\",\"channel\":\"EMAIL\",\"email\":\"qa-e2e-1005-target-$i-$TS@example.test\"}" -w " [%{http_code}]\n" >> RESULT.txt
done
curl -s -b jar -X POST http://localhost:3113/api/dashboard/family/invite -H 'content-type: application/json' \
   -d "{\"target\":\"PARENT\",\"channel\":\"EMAIL\",\"email\":\"qa-e2e-1005-target-p-$TS@example.test\"}" -w " [%{http_code}]\n" >> RESULT.txt
sleep 3
echo "--- mail html target-1" >> RESULT.txt
f=$(ls -t ../mailbox/*target-1-$TS* 2>/dev/null | head -1)
if [ -n "$f" ]; then cp "$f" 01-invite-mail.json; python3 -c "import json;d=json.load(open('$f'));print(d['subject']);print(d['html'][:700])" >> RESULT.txt; else echo "NO MAIL FILE" >> RESULT.txt; fi
echo "--- mails sent for this TS: $(ls ../mailbox/*target-*-$TS* 2>/dev/null | wc -l)" >> RESULT.txt
echo "--- pending invites" >> RESULT.txt
docker exec tutor-qa-pg psql -U tutor -d tutor_qa -At -c "select count(*) from \"FamilyInvite\" fi join \"User\" u on u.id=fi.\"inviterId\" where u.email='$EMAIL' and fi.status='pending';" >> RESULT.txt
echo "$EMAIL" > .inviter-email
echo DONE >> RESULT.txt
