# Proba cu cardul pe etutor.ro, fără bani — pașii pentru Alex (14.10.2026)

**Ce verificăm:** că legătura Stripe → broker → eTutor merge pe producție la abonare, la anularea din portal și la
încheierea abonamentului. **Nu se ia niciun ban:** cu proba de 7 zile pornită (azi, 09:23), orice abonare de săptămâna
asta începe cu 7 zile gratuite. Ce NU verificăm azi: o taxare reală (prima va fi pe 21.10 sau la primul client).

**După fiecare pas** rulezi în Terminal, pe Mac, din orice folder (înlocuiește adresa cu cea a contului de test):

```bash
ssh root@72.62.155.74 'cd /var/www/tutor && git fetch -q origin master && git show origin/master:scripts/ops/urmareste-proba-card.cjs | CONT=alexdanciulescu+etutor-card@gmail.com node --env-file=.env -'
```

și îmi lipești rezultatul în sesiune. Scriptul doar citește. Rândurile `perl: warning: Setting locale failed` sunt inofensive.

## Pasul 0 — contul de test

1. Pe https://etutor.ro/ro/auth/register îți faci un cont nou de **părinte**, cu adresa
   `alexdanciulescu+etutor-card@gmail.com` (ajunge în Gmail-ul tău; vezi și e-mailurile pe care le primește un client).
   Nu adăuga copii.
2. Rulezi scriptul. Trebuie să arate: „zile gratuite la o abonare făcută ACUM: 7”, „Plăți înregistrate: 0”,
   „Pasul … încă NEABONAT cu card”.

## Pasul 1 — abonarea (0 lei azi)

1. În cont: **Pachete** → la **Family** → „Alege pachetul”.
2. Pagina Stripe trebuie să spună **7 zile gratuite**, apoi prețul lunar, și **0 lei de plătit azi**. Dacă vezi altă sumă
   azi, **oprește-te** și trimite-mi o captură.
3. Pui cardul și confirmi. Te întorci în eTutor.
4. Rulezi scriptul. Trebuie să arate: stare `trialing`, următoarea plată **21.10.2026**, o plată de **0,00 RON**,
   Stripe `trialing` și **fără** rândul „⚠ NEPOTRIVIRE”.

## Pasul 2 — ce vede părintele pe Pachete

Pe **Pachete** trebuie să scrie: „Proba cu cardul ține până pe 21.10.2026 — mai ai … Prima plată se face automat atunci.”
Fă o captură. (Prețul de după probă ar trebui să fie cel cu −30%, fiindcă plătești în primele 7 zile.)

## Pasul 3 — anularea din portal

1. Pe **Pachete** → „Gestionează abonamentul” → în portalul Stripe, **Anulează abonamentul**.
   Dacă portalul te întreabă, alege anularea **la sfârșitul perioadei**.
2. Rulezi scriptul (așteaptă un minut după anulare). Trebuie să arate „ANULARE PROGRAMATĂ”, oprire programată
   **21.10.2026**, iar Stripe „se oprește 21.10.2026”. Pe Pachete: „Abonamentul e oprit și nu se mai reînnoiește…”.

## Pasul 4 — încheierea imediată (din Stripe)

1. https://dashboard.stripe.com → contul **Class RDA** → **Customers** → cauți adresa contului de test → abonamentul →
   **Cancel subscription** → **Immediately** (fără rambursare: nu s-a plătit nimic).
2. Rulezi scriptul. Trebuie să arate stare `canceled`, „niciun abonament Stripe legat de cont” și, la „Ce a păstrat eTutor”,
   un rând cu abonamentul încheiat. **Nicio plată** în afară de cea de 0,00 RON.

## Pasul 5 — curățenie

Din Administrare → Utilizatori, la contul de test bifezi **„Gratuit permanent”**, ca să nu mai primească mesajele probei
și să nu intre în pauză pe 21.10.

## Dacă ceva nu se potrivește

Te oprești la pasul respectiv și îmi trimiți rezultatul scriptului + o captură. Nu repeta abonarea: un al doilea
abonament pe același cont complică lucrurile.
