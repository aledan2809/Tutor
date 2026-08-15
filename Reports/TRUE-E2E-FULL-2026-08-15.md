# True E2E Full Audit [10] — Tutor / etutor.ro — 2026-08-15

**Țintă**: `https://etutor.ro` (VPS2 :3013, PM2 `tutor`, PG local `tutor`/`tutor_app`)
**Commit auditat**: `cf1a16d` (include `a556bac` — Sprint de calcul, livrat în aceeași zi)
**Auditul anterior complet**: 2026-05-11 — de atunci **456 commit-uri, 313 fișiere, +32.366 linii**.
Bifele din TODO au fost **re-rulate**, nu preluate.

---

## Verdict pe scurt

Aplicația e **sănătoasă în punctele care contează cel mai mult**: nimeni neautentificat nu intră
nicăieri (15/15 refuzate cu 401), granița ADMIN→SuperAdmin ține (5/5 cu 403), iar izolarea pe
domenii — garanția multi-tenant a platformei — e exactă: un instructor înrolat doar în `aviation`
vede fix cele 24 de întrebări ale lui și **zero** din cele 540 ale altui domeniu.

Scorul auditului de cod e **95/100 — cel mai bun din istoricul proiectului** (89 → 40 → 91 → 95).

Un singur defect merită atenție reală și e descris primul.

---

## Matrice scope-vs-executat

| Fază | Cerut de [10] | Executat | Rezultat |
|---|---|---|---|
| 0 | `/review` pe branch | ✅ 3 felii de risc, 25 fișiere | 7 constatări → **2 reale**, 4 false, 1 minoră |
| 1 | Conturi de test toate rolurile | ⚠️ parțial | 3/6 conturi valide; 3 blocate (vezi §Blocaje) |
| 2 | `[7]` E2E Audit CODE | ✅ pe prod | **95/100**, 1 plugin FAIL |
| 3 | `[8]` Journey audit | ⚠️ 19 rute, **doar ca superadmin** | **18 OK / 1 fals pozitiv** — nu spune ce vede un elev |
| 4 | TRWG-GW (Tester-Gateway) | ✅ config îmbogățit + 2 rulări | FAILED — **o singură cauză-rădăcină** |
| 5 | TWG loop pe P0/P1 | ✅ rulat (autorizat de user) | 1 iterație — `/review` 3 constatări **toate false**, Vision 42/100 onest, Gateway expirat |
| 6 | Scenarii workflow multi-rol | ✅ 16 scenarii | **13 PASS**, 2 erori de probă, 1 real |
| 7 | Concurență | ✅ F1 | PASS (200/200, 155 ms) |
| 8 | Browser real headed | ✅ prin [8] + TG (32 capturi) | PASS |
| 9 | Paritate RO↔EN | ✅ | **defect găsit** (§3) |
| 10 | Stres + audit trail | ✅ I1 | PASS (10 paralel, 0×5xx, 310 ms) |

**Acoperire pe roluri — completă, 5/5**: SuperAdmin ✅ · Instructor ✅ · Admin ✅ · Student ✅ ·
**Watcher ✅** (provisionat prin `POST /api/admin/users` + `/[id]/enroll`, 10/10 PASS — vezi §6).

---

## 1. 🔴 Limitarea de trafic pe autentificare numără greșit — lovește elevii din aceeași școală

**Unde**: `src/middleware.ts:66-72`
**Cum a apărut**: Tester-Gateway a raportat 3×P0 + 3×P1. Toate șase duc la același loc.

```ts
if (path.startsWith("/api/auth")) maxRequests = 20;          // 20 cereri / 60s
const key = `${ip}:${path.split("/").slice(0, 3).join("/")}`; // → "ip:/api/auth"
```

Cheia conține **doar IP-ul**, iar bugetul e comun pentru tot ce începe cu `/api/auth`. În aceeași
găleată de 20 intră două lucruri de naturi complet diferite:

- **încercările de autentificare** — pe care chiar vrei să le limitezi;
- **`/api/auth/session`** — o simplă citire pe care NextAuth o face la **fiecare încărcare de
  pagină**, la revenirea în tab și la refocalizare.

**Măsurat pe producție**, nu dedus: parcurgând 18 rute, s-au făcut **60 de cereri către
`/api/auth/session`**; a **18-a a primit 429**, iar 23 din 60 au fost respinse. Când citirea
sesiunii întoarce 429, clientul NextAuth îl tratează ca „fără sesiune".

**Demonstrat în cod, nu presupus** (next-auth 5.0.0-beta.31): `lib/client.js:34` — corpul 429 e JSON
valid, deci `res.json()` reușește, apoi `!res.ok` aruncă, se prinde la `:38` și funcția
**întoarce `null`**; `react.js:273` pune `setSession(null)`; `react.js:331-335` calculează
`status: "unauthenticated"`.

**Nuanță importantă, măsurată**: sesiunea de pe server **NU** e distrusă — cu aceleași cookie-uri,
`/api/admin/users` întoarce 200 în timp ce `/api/auth/session` dă 429. Deci e un fals-negativ pe
client, nu o pierdere de sesiune. Efectul pentru utilizator e însă același: orice componentă care
se bazează pe `useSession()` se comportă ca la delogare.

**De ce contează aici mai mult decât în alte aplicații**: eTutor e o platformă școlară. Un
laborator de informatică, o clasă sau o familie stau în spatele **unui singur IP public**. Bugetul
de 20/minut e **al întregii clase**, nu al fiecărui elev. Trei-patru copii care lucrează simultan îl
epuizează în mod normal — și vor fi delogați în mijlocul unei sesiuni de exersare.

**Reproducere**: `reports/tutor/2026-08-15T12-53-07-796Z-k5y0/network.json` (Tester-Gateway).
Rulare repetată pe fereastră curată de rate-limit → **rezultat identic**, deci nu e artefact al
sarcinii de test.

**Reparație propusă** (nu aplicată — atinge calea de autentificare pe producție):
1. Scoate `/api/auth/session` din găleata de autentificare, sau dă-i una separată, largă (e o
   citire idempotentă, nu o tentativă de acces).
2. Cheia să includă și utilizatorul acolo unde există sesiune, ca IP-ul partajat să nu mai fie
   pedepsit colectiv.
3. Păstrează 20/minut **doar** pentru `callback/credentials` + `register` + `forgot-password` —
   adică exact ce trebuie apărat de forță brută.

---

## 2. 🟡 Ținte de atins prea mici pe mobil — regresie față de măsurătoarea anterioară

`mobile-tester` **63/100 (FAIL)** — singurul plugin picat.

**Precizare de onestitate**: TODO-ul nota 75/100 în iunie. Cifra aceea vine din text, nu dintr-o
măsurătoare pe care s-o pot compara direct (posibil altă versiune de plugin, alt set de pagini).
Ce **este** măsurat azi: 63/100 și numerele din tabel. Că *a scăzut* e plauzibil, nu demonstrat.

| Dispozitiv | `/` | `/dashboard` |
|---|---|---|
| iPhone 13 | 11 din 22 sub 44×44 px | 14 din 18 |
| Pixel 5 | 11 din 22 | 14 din 18 |
| iPad Pro 11 | 16 din 26 | 14 din 18 |

Pe pagina de dashboard **majoritatea** butoanelor sunt sub pragul de atins cu degetul. Pentru un
produs folosit de copii, pe telefon, e defectul cu cel mai direct efect asupra utilizării.
Corespunde gap-urilor deja deschise **AGT-007 / AGT-009**.

---

## 3. 🟡 Șase pagini afișează titluri în română indiferent de limba aleasă

Journey-ul a semnalat pe locale-ul **`/en/`**: `h1="Bibliografie"`, `h1="Statistici"`.

Traducerile **nu lipsesc** — am comparat cheile: `ro.json` și `en.json` au **859 de chei fiecare,
zero diferențe în ambele direcții**. Problema e că paginile nu le folosesc:

```tsx
// src/app/[locale]/dashboard/bibliography/page.tsx:66
<h1 className="text-2xl font-bold text-white">Bibliografie</h1>   // hardcodat
```

Ironia: fișierul importă deja `useTranslations` și îl folosește 12 linii mai jos, pentru „loading".

**Pagini afectate: 5** — `bibliography`, `progress`, `gamification`, `exam-bank`, `admin/exam-bank`.
Pentru fiecare există traducere engleză reală și diferită (`Bibliography`, `My Progress`,
`Gamification`, `Simulations`), pe care pagina n-o folosește.

**Corectat de la 6 la 5 după re-verificare**: `licenta` are `nav.licenta = "Licență"` **și** în
`en.json`, **și** în `ro.json` — e numele propriu al examenului românesc, deci hardcodarea lui acolo
nu e defect de traducere. Numărasem greșit.

---

## 4. 🔵 Escapare incompletă în randarea documentelor legale — la noi e blocată de CSP, la vecini nu

`src/lib/legal-doc.ts` transformă markdown-ul primit de la Legal Hub în HTML și îl injectează cu
`dangerouslySetInnerHTML`. `escapeHtml` acoperă `&`, `<`, `>` — **dar nu ghilimelele**, iar
transformarea de link pune URL-ul direct în `href="$2"`. Verificat rulând funcția reală:

| intrare | ieșire |
|---|---|
| `[x](" onmouseover="alert(1))` | `<a href="" onmouseover="alert(1" rel="noopener">` |
| `[apasa](javascript:alert(1))` | `<a href="javascript:alert(1" rel="noopener">` |
| `<img src=x onerror=...>` | escapat corect ✅ |

Deci se poate ieși din atribut. **Pe Tutor nu e exploatabil**: CSP-ul live e
`script-src 'self' 'nonce-…'` fără `'unsafe-inline'`, iar browserul blochează atât handler-ele
inline, cât și schema `javascript:`. Securitatea depinde însă **în întregime** de acel CSP.

**Notă de scop**: ajutorul `mdToHtml` are copii și în alte proiecte. Le-am verificat inițial și am
inclus un tabel comparativ — **greșit ca scop**: auditul acesta e despre Tutor. Materialul a fost
scos. Dacă vrei evaluarea celorlalte, e o sesiune separată, în proiectul respectiv.

---

## 5. 🔵 Parola nu are limită superioară, iar bcrypt taie la 72 de octeți

`register/route.ts:17` și `reset-password/route.ts:10` cer `min(8)` fără `.max()`. Verificat empiric:
o parolă de 87 de caractere se autentifică cu primele 72. Efect practic mic (nu se exploatează de la
distanță fără a ști începutul parolei), dar e un plafon tăcut pe entropie. Un `.max(72)` îl închide.

---

## 6. Rolul WATCHER — 10/10, iar promisiunea din cod se ține

Provisionat **prin suprafețele aplicației**, nu prin scriere în baza de date (aceea a rămas
blocată): `POST /api/admin/users` → `POST /api/admin/users/[id]/enroll` cu `roles:["WATCHER"]`.

Codul promite, într-un comentariu, că *„un watcher pur (părinte) vede DOAR copiii lui asociați"*.
Verificat pe producție:

| Test | Rezultat |
|---|---|
| Watcher fără niciun copil asociat → câți elevi vede | **0** |
| Citirea unui elev nelegat (IDOR) | **403** |
| Rute de administrare | **3/3 refuzate** |
| Panou watcher + rapoarte | 200 |

Conturile de test create pe parcurs au fost dezactivate prin `PATCH /api/admin/users/[id]`.

---

## 7. TWG loop — rulat, cu două straturi din patru neproductive

Loop `loop_trwg_msue6js7_d8ynry`, oprit deliberat după prima iterație (vezi mai jos de ce).

| Strat | Rezultat |
|---|---|
| `/review` (AIRouter) | 3 constatări, scor static 71 — **toate trei verificate ca false** |
| Tester Vision | **42/100 — a funcționat**, contrar avertismentului din preflight |
| Website Guru | **SĂRIT** (`nested-session-hook-conflict`) → zero fix-uri aplicate |
| Gateway (Tester) | **INCONCLUSIVE** — expirat la 240 s |

**Cele 3 constatări `/review`, verificate una câte una:**
1. *„Dependență `domain` lipsă în `useEffect`, provoacă re-fetch infinit"* (bibliography:30, **high**) —
   afirmația e pe dos: `[]` **previne** re-fetch-ul; adăugarea dependenței l-ar provoca. Intenția
   („o dată la montare") e corectă. Fals.
2. Aceeași clasă pe progress:50. Fals.
3. *„Cheia compusă `verificationToken` ar putea eșua"* (reset-password) — schema are
   `@@unique([identifier, token])`, iar Prisma generează exact numele `identifier_token` folosit
   în cod. Fals.

**Vision merită remarcat**: 42/100 cu motivarea *„pagina publică randează corect, dar toate cele 4
constatări ale auditului sunt neverificabile dintr-o captură a paginii de start"*. Verdict corect —
unealta a fost onestă despre ce poate și ce nu poate vedea. **Preflight-ul prezisese că Vision va
eșua; nu a eșuat.** Presupunerea din L340 se aplică la Guru, nu la Vision.

**De ce am oprit loop-ul după o iterație**: cu Guru sărit nu se aplică niciun fix, deci iterațiile
2-3 ar fi repetat identic aceleași constatări. Iterația 2 confirmase deja: Gateway a primit
`429 Server busy — a test is already running`.

**Constatare de unealtă (Master, nu Tutor)**: plafonul de 240 s al fazei Gateway e mai scurt decât o
rulare Tester reală pe acest proiect. Măsurat direct pe API-ul Tester: `status:"running"`,
`"Executing 62 test scenarios..."`, `durationMs: 299624` — **~5 minute și încă în curs**. Efect în
lanț: rularea expirată rămâne activă pe Tester-ul partajat, iar iterația următoare ia 429, deci
faza Gateway nu poate produce semnal **niciodată** în această configurație. Ocolire imediată:
`--gateway-poll-timeout 900000`. (Am verificat întâi ipoteza greșită că s-ar interoga un endpoint
404 — nu: `trwg-loop.mjs:267` folosește corect `/api/test/:id/status`, iar fix-ul L342 e la locul lui.)

---

## 8. 🟡 Un furnizor de autentificare e mort, și încarcă un script Google pe fiecare pagină

**Găsit abia la final**, recuperând manual rezultatul pe care faza Gateway îl pierduse prin timeout.
Tester-ul raportase 49 de scenarii picate din 62; grupate, motivele erau: **30× „erori de consolă pe
pagină" (2 erori)**, 11× după submit (3), 8× erori netratate (10), 8× mesaj de eroare neafișat.

Am verificat în browser, pe fereastră curată, ca să exclud ipoteza că ar fi tot §1 (NextAuth căzând
pe 429). **Nu e**: o vizită anonimă pe pagina de start produce exact două erori:

```
Loading the stylesheet 'https://accounts.google.com/gsi/style' violates CSP: "style-src 'self' 'unsafe-inline'"
Not signed in with the identity provider.
```

Pe `/auth/signin` se adaugă a treia: `[GSI_LOGGER]: FedCM get() rejects with NetworkError`.

**Cauza**: hardening-ul CSP (`72765fc`, notat în TODO ca „scos unsafe-eval și One Tap") a eliminat
permisiunea One Tap din `style-src` — dar a lăsat pe loc **și furnizorul înregistrat**
(`/api/auth/providers` listează `google-one-tap`), **și scriptul** `accounts.google.com/gsi/client`,
care se încarcă pe fiecare pagină și eșuează de fiecare dată.

**Ce NU e afectat**: autentificarea Google obișnuită. Butonul „Continuă cu Google" e unul propriu
(zero elemente GSI în DOM), iar `/api/auth/signin/google` întoarce 302 corect.

**Ce e afectat**: unul din patru furnizori anunțați nu poate funcționa; fiecare vizitator încarcă
un script terț inutil; iar scriptul pornește **înainte** de alegerea pe bannerul de cookie-uri —
punct relevant pentru o platformă ai cărei utilizatori sunt minori.

**Reparație**: ori permite `accounts.google.com` în `style-src` și repară One Tap, ori scoate
furnizorul + scriptul. Starea de mijloc de acum e cea mai proastă dintre cele trei.

**De reținut ca metodă**: nici auditul de cod, nici journey-ul nu au prins asta — journey-ul
clasificase paginile drept OK fiindcă verifică titluri și conținut, nu consola. Semnalul a venit
exclusiv din faza Gateway, adică fix stratul pe care loop-ul îl pierduse prin timeout (§7).

---

## Ce a mers — enumerat, fiindcă și asta e rezultat

- **Control de acces anonim**: 15/15 rute de administrare → `401`.
- **Escaladare de privilegii**: un ADMIN pe cele 5 rute rezervate SuperAdminului → `403` la toate.
- **Izolare pe domenii**: instructorul din `aviation` vede 24 de întrebări, toate ale lui, zero
  din alt domeniu. Testul cel mai important al platformei.
- **Fluxul pedagogic**: sesiune pe `matematica-v-viii` → 15 întrebări; răspunsul întoarce
  `isCorrect`, `correctAnswer`, `explanation`, `source`, `sourceQuote` — feedback complet.
- **Sprintul livrat azi**: pornește și generează întrebarea următoare pe prod ✅.
- **Gamificare**: `progress`, `xp`, `streak`, `achievements`, `leaderboard` — toate 200 cu date reale.
- **Concurență**: două sesiuni simultane, utilizatori diferiți → 200/200 în 155 ms.
- **Stres**: 10 porniri de sesiune în paralel → 10×200, **zero 5xx**, 310 ms.
- **Journey autentificat**: 18/19 pagini OK (a 19-a e fals pozitiv, vezi mai jos).

---

## Zgomot de unealtă — de ignorat, nu de reparat

Le notez ca să nu fie confundate cu defecte de aplicație la următoarea rulare:

1. **`a11y-scanner` 100/100 nu e dovadă de accesibilitate.** Nu a putut scana nici `/`, nici
   `/dashboard` — CSP-ul i-a blocat injectarea scriptului. Scorul reflectă paginile pe care
   *a apucat* să le vadă. Accesibilitatea celor două pagini principale rămâne **nemăsurată**.
2. **Journey `HAS_ERRORS` pe `/en/terms`** = fals pozitiv: `errorMarkers` a prins numele fișierelor
   Next (`error-ffd342.js`) și sintagma legitimă „freedom from **errors**" din clauza de garanție.
3. **`/review` a produs 4 constatări HIGH/CRITICAL, toate false.** Verificate una câte una:
   - „`z.string().toUpperCase()` e invalid în Zod" → rulat pe Zod 3.25.76: `"abc"`→`"ABC"`, `min(3)`
     tot aplicat. Fals.
   - „identificator nerezolvat la `sprint-session.ts:420`" → fișierul are **410 linii**; `tsc` dă
     zero erori. Halucinație.
   - „`SPRINT_TIMEOUT_ANSWER` importat din locul greșit" → linia 34 îl **re-exportă** explicit. Valid.
   - „`recordCampaignSignup` neașteptat" → linia 130 e `await recordCampaignSignup(...)`. Fals.

   Singurele reale au fost cele două MEDIUM despre bcrypt (§5). **Concluzie de proces: pe acest
   cod, constatările HIGH ale stratului `/review` se verifică una câte una înainte de raportare.**
4. **Trei „eșecuri" din matricea de scenarii erau greșeli ale probei mele**, nu ale aplicației:
   `/api/domains` nu există (doar `/api/domains/public`), iar regexul meu de `<h1>` nu prindea
   titlurile randate pe client. Le-am corectat, nu le-am raportat.

---

## Blocaje — ce n-am putut executa și de ce

1. **3 din 6 conturi de test au parole invalide** (`test_student`, `test_instructor`,
   `test_watcher` — cele din `TODO_PERSISTENT.md` nu mai sunt valabile). Resetarea lor cere
   **scriere de parole în baza de producție**, acțiune **blocată de clasificatorul de securitate** —
   corect blocată; nu am ocolit-o. Am compensat provisionând prin suprafețele proprii ale
   aplicației, ceea ce a acoperit Student/Admin/Instructor. **Rolul WATCHER a rămas netestat.**
   → cere o decizie: fie resetare manuală, fie creare de cont nou prin înregistrare publică.
2. **TWG loop (faza 5) nerulat.** Per L340, straturile Guru + Vision nu funcționează dintr-o
   sesiune Claude Code interactivă (conflict de hook-uri) — ar fi produs „scor 0" fals. Fixul
   pentru §1 e formulat concret mai sus, dar **neaplicat**: atinge calea de autentificare pe
   producție și merită confirmarea ta.
3. **Accesibilitatea paginilor `/` și `/dashboard`** — nemăsurată (vezi zgomot #1). Necesită un
   scaner care injectează scriptul cu nonce-ul paginii.

---

## Artefacte

| Ce | Unde |
|---|---|
| Audit CODE `[7]` | `Tutor/Reports/AUDIT_E2E_2026-08-15.md` |
| Journey `[8]` + capturi | `Tutor/journey-audit-results/tutor/` |
| Tester-Gateway (2 rulări, 32 capturi, network.json) | `Tester-Gateway/reports/tutor/2026-08-15T12-53-07-796Z-k5y0/` |
| Config TG îmbogățit | `Tester-Gateway/apps/tutor.json` — 0→**5 fluxuri critice**, 4→6 publice, 2→9 protejate, 0→3 admin |

---

## Recomandare de ordine

1. **§1 rate-limit** — singurul care afectează elevi reali, azi. Fix mic, dar pe calea de auth.
2. **§2 ținte mobile** — regresie măsurată, produs folosit pe telefon de copii.
3. **§3 titluri hardcodate** — 6 linii, vizibil oricărui utilizator pe engleză.
4. **§4 escapare** — acoperit de CSP azi; de reparat când se atinge zona, ca protecția să nu depindă de o singură directivă.
5. **§5 `.max(72)`** — două linii, când se atinge oricum zona.
