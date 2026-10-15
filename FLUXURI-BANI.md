# Drumul banilor — eTutor.ro
Actualizat: 2026-10-15 · de /bani

Cine plătește: părintele (Family / Family Duo / Trio / Family Trio) sau elevul singur (Elev), cu cardul, prin
brokerul de plăți `stripe.knowbest.ro` (firma Class RDA, cont Stripe live). Codurile de pe flyer: V126S (flyer
Poștă) și ONV126S (site), −25% pe Family, valabile până la 30.11.2026.

## Drum 1: vizitator → cont → probă de 7 zile → plată → reînnoire

| # | Pasul | Unde se vede | Cum numărăm | Depinde de |
|---|---|---|---|---|
| 1 | Vizită | Umami, site `etutor.ro` (analytics.knowbest.ro), doar gazda etutor.ro | vizitatori unici | scriptul Umami cu `data-domains="etutor.ro"` |
| 2 | Pagina pentru părinți `/ro/parinte` (flyerul intră prin `/cafea` → `/ro/parinte?voucher=V126S`) | Umami (cale), nginx pentru `/cafea` | vederi; scanări `/cafea` în jurnalul nginx | — |
| 3 | Cont creat | tabel `"User"` | rânduri noi, fără conturi de test (`resolveIsTest`) și fără super-admin | — |
| 4 | Copil legat de părinte | tabel `"Guardian"` (`relation='PARENT'`, `status='active'`) | rânduri noi | invitația: e-mail (Resend), WhatsApp din telefonul părintelui (wa.me), cod |
| 5 | Proba de 7 zile | calculată (`src/lib/access.ts`), pornește la max(cont, comutator) | conturi în probă | comutatorul `AppSetting.accessTrial` (PORNIT din 14.10.2026, 09:23) |
| 6 | Mesajele probei (ultimele zile, pauza) | tabel `"Notification"`, tipurile `access_trial_*` | rânduri noi pe tip | cron `/api/cron/escalation` (la 15 min, doar 9–20 ora României) |
| 7 | Plată începută | brokerul (nu e în baza eTutor) | sesiuni de plată create | broker + cheia proiectului |
| 8 | **Plată reușită** | tabel `"Payment"` (`status='succeeded'`) | rânduri noi | broker → `POST /api/stripe/callback` (semnat) |
| 9 | Reînnoire | `"Payment"` cu `stripeEventId` (subscription.renewed) | rânduri noi | webhook Stripe Class RDA cu toate cele 7 evenimente |

Banii intră la pasul: 8 (și 9 la fiecare reînnoire).

Se pot pierde fără zgomot dacă:
- comutatorul probei e oprit: nu se mai termină nicio probă, nimeni nu ajunge la plată;
- cron-ul de escaladare e pe pauză: nu pleacă mesajele de final de probă și de pauză;
- legătura broker → eTutor nu primește evenimentul (cheie, semnătură, limitare de cereri): plata trece în Stripe,
  dar contul rămâne în pauză;
- Resend (comun cu alte 6 aplicații) e blocat: invitațiile pe e-mail și mesajele nu pleacă;
- scriptul Umami numără și alte gazde (până la 15.10.2026, stiva de test: 59 din 61 „register_done” într-o săptămână).

## Drumul complet, de la înscriere până la final

| # | Etapa | Stare | Dovada | Cum numărăm |
|---|---|---|---|---|
| 1 | Înscriere și acord (termeni; acordul părintelui pentru minor, în Legal Hub) | există | `src/app/api/auth/register/route.ts`, `GuardianConsent` în Legal (29.09) | `"User"` noi |
| 2 | Setări complete (copil legat, materie, capitole confirmate) | parțial | „Primii pași” + poarta capitolelor (`src/lib/test-topic-gate.ts`) | — |
| 3 | Prima folosire reală (prima grilă) | există | evenimentul Umami `first_question` | Umami, gazda etutor.ro |
| 4 | Valoarea ajunge la familie (remindere copil, alerte părinte, rezumat) | există | `"Notification"` (escalation_l*, parent_alert), rezumatul zilnic | rânduri create (livrarea nu e numărată) |
| 5 | Avertizare înainte de finalul probei | există | `access-lifecycle.ts` (3 zile, 2 zile, ultima zi) + bannerul cu data de final | `"Notification"` `access_trial_*` |
| 6 | La final: pauză + buton spre plată; copilul nu vede prețul | există, n-a rulat încă pe producție | `access.ts`, `access-screens.tsx`; prima pauză reală 21.10.2026 | conturi în pauză |
| 7 | Prima plată cu cardul + alertă pe Telegram către tine | plata: n-a rulat pe producție (0 plăți); alerta: există din 15.10 (`src/lib/owner-alerts.ts`) | callback | `"Payment"` succeeded |
| 8 | Accesul pornește imediat după plată | există, verificat doar pe stiva de test | callback `subscription.activated` | — |
| 9 | Anunț înainte de reînnoire / card care expiră | lipsește în aplicație | — (Stripe își trimite propriile e-mailuri, dacă sunt pornite în cont) | — |
| 10 | Plata eșuată la reînnoire | există: pauză pe loc + mesaj (decizia lui Alex 13.10) | callback `subscription.payment_failed` | — |
| 11 | Neplătit → pauză; nimic șters; ștergere după 12 luni de pauză, cu avertismente | există | `access.ts`, `inactive-accounts.ts`, cron `/api/cron/account-retention` | — |
| 12 | Plata după pauză deblochează pe loc | există, n-a rulat pe producție | callback | — |
| 13 | Anularea păstrează accesul până la finalul perioadei | există, n-a rulat pe producție | callback `subscription.updated` / `canceled` | — |
| 14 | Schimbarea planului | parțial: doar Family → Family Duo prin diferență; loc de copil și materie în plus ca abonamente separate | `addon-checkout/route.ts` | — |
| 15 | Alerte către tine (plată, plată eșuată, plată abandonată, pauză) | există din 15.10 | `src/lib/owner-alerts.ts`, callback, `access-lifecycle.ts` | — |

Copilul rămas fără loc după plată (proba lasă oricâți copii, Family plătește unul): părintele vede pe „Familia mea”
care copil, de când e în pauză (sau când intră) și prețul locului (`src/lib/child-seat.ts`, 15.10.2026).

## Alarma zilnică (citită de Optimise)
```bani-check
{
  "version": 1,
  "enabled": false,
  "host": "vps2",
  "database": "tutor",
  "steps": [
    { "id": "cont", "label": "Cont creat", "sql": "SELECT count(*) FROM \"User\" u WHERE u.\"isSuperAdmin\" = false AND u.email IS NOT NULL AND NOT (lower(u.email) LIKE '%@tutor.app' OR lower(u.email) LIKE '%@demo.tutor.app' OR lower(u.email) LIKE '%@test.com' OR lower(u.email) LIKE '%.test' OR lower(u.email) LIKE '%.invalid' OR lower(u.email) LIKE '%@example.com') AND u.\"createdAt\" >= {from} AND u.\"createdAt\" < {to}" },
    { "id": "copil", "label": "Copil legat de părinte", "sql": "SELECT count(*) FROM \"Guardian\" g JOIN \"User\" u ON u.id = g.\"parentId\" WHERE g.relation = 'PARENT' AND g.status = 'active' AND u.\"isSuperAdmin\" = false AND NOT (lower(u.email) LIKE '%@tutor.app' OR lower(u.email) LIKE '%@demo.tutor.app' OR lower(u.email) LIKE '%@test.com' OR lower(u.email) LIKE '%.test' OR lower(u.email) LIKE '%.invalid' OR lower(u.email) LIKE '%@example.com') AND g.\"createdAt\" >= {from} AND g.\"createdAt\" < {to}" },
    { "id": "plata", "label": "Plată reușită", "money": true, "sql": "SELECT count(*) FROM \"Payment\" p JOIN \"User\" u ON u.id = p.\"userId\" WHERE p.status = 'succeeded' AND u.\"isSuperAdmin\" = false AND NOT (lower(u.email) LIKE '%@tutor.app' OR lower(u.email) LIKE '%@demo.tutor.app' OR lower(u.email) LIKE '%@test.com' OR lower(u.email) LIKE '%.test' OR lower(u.email) LIKE '%.invalid' OR lower(u.email) LIKE '%@example.com') AND p.\"createdAt\" >= {from} AND p.\"createdAt\" < {to}" }
  ],
  "checks": [
    { "id": "parinte", "label": "Pagina pentru părinți", "type": "http", "url": "https://etutor.ro/ro/parinte" },
    { "id": "web", "label": "Procesul web", "type": "pm2", "name": "tutor" },
    { "id": "escaladare", "label": "Cron-ul de remindere și mesajele probei", "type": "cron", "contains": "/api/cron/escalation -H" },
    { "id": "escaladare-rapida", "label": "Cron-ul de remindere la minut", "type": "cron", "contains": "/api/cron/escalation/fast" },
    { "id": "retentie", "label": "Cron-ul conturilor inactive", "type": "cron", "contains": "/api/cron/account-retention" },
    { "id": "proba", "label": "Comutatorul probei pornit", "type": "sql", "sql": "SELECT count(*) FROM \"AppSetting\" WHERE key = 'accessTrial'", "expect": ">=1" }
  ]
}
```

Cifre la scrierea hărții (15.10.2026, fără conturi de test, Umami doar etutor.ro):
- 30 de zile: 128 vizitatori · 14 vederi `/ro/parinte` · 8 vederi ale paginii de cont · 5 conturi · 1 copil legat · 0 plăți;
- flyerul: 3 scanări `/cafea` între 01 și 15.10 (jurnalul nginx), 0 conturi atribuite campaniei, 0 folosiri V126S/ONV126S;
- `"Payment"`: 0 rânduri de la lansare; brokerul: 4 plăți eTutor începute, niciuna terminată.
