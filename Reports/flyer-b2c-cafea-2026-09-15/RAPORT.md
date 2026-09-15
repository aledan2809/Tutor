# Flyer B2C „cafea" — eTUTOR.ro

Locație: `Tutor/Reports/flyer-b2c-cafea-2026-09-15/`

---

## 0. v2 (15.09 seara) — feedback-ul tău aplicat

| Ce ai cerut | Ce am făcut |
|---|---|
| Nu respectă 10,5×14cm | Fișierele vechi erau doar formatul CU bleed (115×150mm, normal pentru tipar — bleed = marginea în plus pe care tipografia o taie). Acum sunt **două seturi**, clar denumite: `...-105x140mm-FARA-bleed-...` (măsurat, exact 1241×1654px la 300dpi = 10,5×14cm — asta verifici tu pe ecran) și `...-115x150mm-CU-bleed-...` (pentru tipografie, dacă cere bleed). |
| Poză reală de femeie, nu ilustrație | Înlocuită ilustrația vectorială cu o fotografie reală (sursă + licență mai jos). |
| Ecuson dreptunghiular, mai jos | „7 ZILE GRATUITE" e acum un dreptunghi, așezat pe colțul pozei, sub logo — nu-l mai atinge. |
| Promoție 33→25 lei, cod V126S, QR cu codul inclus | Am găsit prețul real (33,20 lei, nu 33 rotund) și am ales 25% reducere = **24,90 lei** (nu exact 25 — am preferat cifra reală pe care chiar o va plăti cineva, nu una rotunjită fals). Cod **V126S**. QR-ul duce la `etutor.ro/cafea` — o rută nouă, scurtă, care **completează automat codul** la înscriere, fără să-l mai tasteze nimeni. **Detalii tehnice + ce rămâne de făcut de tine, în §4 de mai jos — e important, nu doar cosmetic.** |
| Poză cu băiat la teme, între preț și logo | Adăugată, bandă orizontală sub caseta de preț (sursă + licență mai jos). |

---

## 1. Analiză scurtă — de ce arată așa

Un flyer în cutia poștală are ~3 secunde înainte să fie aruncat. Reguli aplicate:

- **Un singur mesaj central** — „vezi progresul copilului, cât o cafea pe lună". Nu am înșirat toate funcțiile (streak-uri, gamification, simulări BAC etc.) — ar dilua mesajul.
- **Scrii pentru cea care cumpără, nu pentru cel care folosește** — tot copy-ul e la persoana a II-a, către mamă („tu vezi", „liniștea ta"), exact tonul deja folosit pe `/parinte` în aplicație.
- **Specificitate, nu superlative** — „vezi la ce capitol a greșit" e verificabil; „cel mai bun/inteligent" nu spune nimic și sună fals pe un flyer aruncat în cutia poștală.
- **Ancoră de preț vizuală** — cifra e într-o casetă separată, cu iconița cafelei alături, nu îngropată într-o propoziție.
- **Dovadă, nu promisiune** — „vezi negru pe alb ce a lucrat azi" (deja limbaj din aplicație) bate „va învăța mai bine", care nu poate fi verificat de nimeni.
- **O singură obiecție tratată explicit** — cea mai probabilă reacție la un abonament nou, plătit, e „încă un cost / o să-l uite copilul de el". Răspunsul e „7 zile gratuite, fără card" (ștampilă, vizibil pe față) + „dacă se oprește, afli pe WhatsApp" (verso) — nu tu ești cea care verifică.
- **Un singur CTA** — scanează codul QR. Link scurt scris și pentru cine nu vrea să scaneze. Nu am pus și telefon și email și „vino la sediu" — ar fragmenta atenția.
- **Format skim, nu paragrafe** — titlu + un subtitlu + o casetă de preț pe față; 3 puncte + QR pe verso. Nimic mai lung de 2 rânduri.

---

## 2. Variante de titlu (headline)

Toate three sunt varianta „mamă + cafea + telefon", cu unghiuri emoționale diferite. **Am folosit varianta A** pe flyer (cea mai apropiată de formularea ta din brief); le las pe toate trei ca să poți schimba rapid dacă preferi alta — schimbarea e o singură linie în `flyer.html` (caută `class="headline"`).

**A — directă, ancorată pe preț (folosită pe flyer):**
> **Liniștea ta, cât o cafea pe lună.**
> Vezi exact ce lucrează copilul tău azi, direct din telefon — nu doar ce-ți spune el.

**B — grijă/întrebare (deschide cu îndoiala pe care o are deja):**
> **Chiar învață, sau doar stă cu manualul deschis?**
> Cu o cafea pe lună, afli sigur — negru pe alb, în fiecare zi.

**C — ritual cald, aspirațională:**
> **Cafeaua ta de dimineață. Liniștea ta toată luna.**
> eTUTOR.ro îți arată exact ce a lucrat copilul — și te anunță dacă se oprește.

Recomandare dacă vrei să testezi: A e cea mai "sigură" (spune exact oferta); B agață mai tare pe cineva care deja are anxietatea asta; C e cea mai caldă/emoțională dar spune mai puțin concret în titlu. Pentru un tiraj mic aș păstra A.

---

## 3. Verificare de adevăr — ce am confirmat direct în codul Tutor

Nu am pus nimic pe flyer fără să-l găsesc scris în `src/`. Sursele exacte:

| Afirmație pe flyer | Fișier / dovadă |
|---|---|
| 7 zile gratuite, fără card | `src/app/[locale]/preturi/page.tsx` (`"Trial 7 zile cu cont gratuit"`, `"fără card"` repetat pe `/parinte`, `/preturi`, homepage) |
| „Vezi azi ce a lucrat: la ce capitol, câte exerciții, unde a greșit" | `src/components/parinte/parent-funnel.tsx`: *"Vezi negru pe alb: câte exerciții a făcut azi, la ce capitol și unde a greșit."* |
| „Duminica primești un raport scurt — sau zilnic, dacă preferi" | `src/app/[locale]/parinte/page.tsx` linia 114: *"Duminică primești un raport scurt: ce a lucrat, unde stă bine, unde s-a împotmolit. Îl poți primi și zilnic, dacă vrei."* — cod real în spate: `src/components/watcher/reports-manager.tsx` |
| „Dacă se oprește din exerciții, afli pe WhatsApp" | `parent-funnel.tsx`: *"primești un semnal pe WhatsApp — la timp"* + pasul 2-3 din „Cum funcționează" pe `/parinte` |
| Structura de discount (materie a 2-a −15%, a 3-a+ −25%; copil al 2-lea −20%, al 3-lea+ −30%; anual = 2 luni gratis) | `src/app/[locale]/preturi/page.tsx`, secțiunea `discountsList` |
| Wordmark „eTUTOR.ro" (e mic, TUTOR mare, .ro mic) + culoarea albastră | `src/components/Brand.tsx` — copiat exact tratamentul |
| Verde-emerald = culoarea „părinte" în aplicație | `src/components/SiteHeader.tsx` — `AUDIENCE.parinte` |
| Operator B2C: Class RDA Impex SRL, CUI 29867320, J40/2439/2012, Str. Pridvorului nr. 5, bl. 6, ap. 1, București, neplătitoare TVA | `src/lib/firme-emitente.ts` |
| Contact `office@etutor.ro` | `src/lib/posta-copy.ts` (`CONTACT_MAIL`) |
| Nu există o durată fixă de „lecție" | `src/lib/session-engine.ts` — sesiunile variază 2-20 minute (Micro/Quick/Deep/Repair/etc.) — de-asta flyerul v2 NU mai afirmă nicio durată exactă (v1 avea „5–7 minute" pe banda cu băiatul; scos în v2) |

**QR-ul v2 (schimbat față de v1)**: nu mai duce direct pe `/ro/parinte?utm_...`, ci pe **`etutor.ro/cafea`** — o rută nouă (`Tutor@` fișier nou `src/app/cafea/route.ts`), pe modelul deja existent `/evaluare` din cod. Motivul: trebuia oricum o rută care completează automat codul de voucher (cerința ta „QR-ul ar trebui să introducă voucherul by default"), și ruta asta face ȘI atribuirea de campanie (cookie, la fel ca `/evaluare`) — deci urmărirea conversiilor nu s-a pierdut, doar s-a mutat pe alt mecanism, testat pe cod existent, nu inventat. L-am decodat înapoi cu OpenCV, de două ori — o dată din SVG-ul izolat, o dată din fișierul PNG final de tipar — și confirmă exact `https://etutor.ro/cafea`.

---

## 4. 🔴 De decis cu tine — cel mai important punct

**Brief-ul zicea 19,90 lei. Am pus 33,20 lei pe flyer. Iată de ce, ca să confirmi sau să corectezi:**

Am găsit `src/lib/pricing.ts`:
```
PROMO_FACTOR = 0.75           // prețurile afișate pe /preturi și /parinte sunt PROMO (−25%)
PROMO_END = 2026-09-01        // "promo valid până la 31.08.2026"
isPromoActive(now) → now < PROMO_END
```
Azi e **2026-09-15** — promoția s-a încheiat pe 1 septembrie, acum două săptămâni. Codul comută **automat** pe prețul normal după acea dată (fără nicio intervenție manuală) — deci site-ul live afișează chiar acum prețul normal, nu 19,90.

Al doilea lucru: 19,90 lei e prețul planului **„Elev/Student"** — copilul plătește singur, **fără cont de părinte, fără ca tu să vezi ceva**. Planul care chiar face ce arată flyer-ul (tu vezi progresul copilului pe telefon) e planul **„Family"**, care costă mai mult:

| Plan | Preț promo (expirat) | Preț normal (azi, 2026-09-15) | Ce include |
|---|---|---|---|
| Elev/Student | 19,90 lei | **26,53 lei** | copilul singur, TU nu vezi nimic |
| **Family** (părinte + copil) | 24,90 lei | **33,20 lei** | exact ce arată flyer-ul: tu vezi progresul |

Am pus **33,20 lei** (Family) pentru că altfel flyer-ul ar promite o funcție (vizibilitate pentru părinte) pe care prețul afișat n-o include — ar fi o momeală, chiar dacă neintenționată. Am păstrat totuși spiritul „cât o cafea" din brief, dar ancorat pe **zi**, nu pe lună — 33,20 lei / 30 zile ≈ **1,1 lei/zi**, ceea ce e adevărat indiferent cum socotești o „cafea bună" (asta apare pe flyer ca linie secundară, sub prețul mare).

**Rezolvat prin cererea ta din v2**: în loc să repornesc promoția site-wide, ai cerut un voucher dedicat flyer-ului (33→25 lei, cod V126S) — mai curat, fiindcă nu atinge prețul afișat tuturor celorlalți vizitatori, doar celor cu flyer-ul în mână. Vezi §4b mai jos pentru mecanism + ce rămâne de făcut.

**Rămas deschis, tot la tine:**
2. Ancora „cât o cafea" pe 33,20 lei/lună (o cafea specialty) — am păstrat-o în titlu; spune dacă vrei să scot mențiunea „cafea" din caseta de preț.
3. Vrei un telefon de contact pe flyer? N-am găsit unul dedicat pentru eTUTOR (am pus doar `office@etutor.ro` + site + QR).

Nimic din research-ul de mai sus nu e pe internet/presupunere — e din `src/lib/pricing.ts` + `src/app/[locale]/preturi/page.tsx`, verificat citind fișierele, nu ghicit.

---

## 4b. 🔴 Voucherul V126S — cum funcționează + ce rămâne de făcut de tine

**Găsit pe drum, nu doar cosmetic**: mecanismul de voucher parțial (sub 100%) exista deja complet în cod (checkout Stripe real cu cupon procentual, prin brokerul `stripe.knowbest.ro`), dar fluxul de înscriere redirecționa spre o pagină veche care doar afișa „plata vine în curând" — nu ducea nicăieri. Am reparat rutarea (`Tutor@78892e4`) ca să ducă la pagina reală de abonare (`/dashboard/packages`), care chiar știe să proceseze un voucher parțial. Am mai adăugat o rută scurtă `etutor.ro/cafea` (`Tutor` — fișier nou, necomis încă separat, vezi mai jos) care duce direct la înscriere cu codul V126S deja completat — exact ce ai cerut („QR-ul ar trebui să introducă voucherul by default").

**Ce trebuie să faci tu, în ordine:**
1. **Aștepți deploy-ul** — codul de mai sus (ruta nouă + fix-ul de rutare) e doar push-uit, nu e încă pe etutor.ro. E în coada de deploy alături de alte două reparații de azi.
2. **Creezi voucherul în panoul de admin** (`etutor.ro/dashboard/admin/superadmin/vouchers` → „Creează voucher"): cod `V126S`, reducere `25` (%) — asta dă exact 24,90 lei din 33,20. Alege tu data de expirare și numărul maxim de folosiri (eu n-am vrut să inventez o limită de campanie — e decizia ta comercială, nu tehnică).
3. **Testezi o dată tu însuți** înainte de tipar: `etutor.ro/cafea` → ar trebui să te ducă la înscriere cu codul deja scris → după cont, la `/dashboard/packages` cu prețul redus vizibil.

**Notă tehnică mică, dar reală**: voucherul e valabil pe ORICE plan din pagina de abonare (Elev, Family, Duo etc.), nu doar pe Family — sistemul de azi nu poate restrânge un cod la un singur plan. Probabil e chiar mai bine (mai flexibil pentru cine scanează), dar dacă vrei altfel, spune-mi.

---

## 5. Ce am construit — pozele (v2)

v1 avea o ilustrație vectorială proprie (fără poze externe). În v2 ai cerut poze reale, deci:

- **Femeie + cafea + telefon**: `foto-mama-cafea-telefon.jpg` — Pexels, autor Los Muertos Crew (Cristian Rojas), [pexels.com/photo/a-woman-sitting-at-the-table-7487539](https://www.pexels.com/photo/a-woman-sitting-at-the-table-7487539/), licența Pexels (uz comercial voie, fără atribuire obligatorie). Am ales-o din ~8 candidate verificate vizual — majoritatea aveau doar telefon SAU doar cafea, nu ambele + fața vizibilă + o expresie caldă.
- **Băiat la teme**: `foto-baiat-tema.jpg` — Unsplash, autor Vitaly Gariev ([@silverkblack](https://unsplash.com/@silverkblack)), [unsplash.com/photos/young-boy-doing-homework-at-a-desk-Vdoz_CbxB4g](https://unsplash.com/photos/young-boy-doing-homework-at-a-desk-Vdoz_CbxB4g), licența Unsplash (uz comercial voie, fără atribuire obligatorie).
- Fișierele sunt referențiate ca `<img src="foto-....jpg">` (fișiere separate, nu base64) — dacă muți `flyer.html` în alt folder, mută și pozele odată cu el.
- **Fonturi**: neschimbat, doar stive de sistem, niciun `<link>` extern.

---

## 6. Fișiere livrate

Toate în `Tutor/Reports/flyer-b2c-cafea-2026-09-15/`:

| Fișier | Ce e |
|---|---|
| `flyer.html` | Sursa — HTML+CSS+2 poze, 105×140mm + bleed 5mm × 2 pagini (față/verso) |
| `foto-mama-cafea-telefon.jpg` / `foto-baiat-tema.jpg` | Pozele reale (sursă+licență mai sus) |
| `qr-cafea.svg` | QR-ul generat pentru `etutor.ro/cafea`, sursă vectorială |
| `eTUTOR-flyer-{fata,verso}-105x140mm-FARA-bleed-RGB-300dpi.png` | **Format real 10,5×14cm** (1241×1654px, verificat) — asta deschizi tu ca să verifici dimensiunea pe ecran |
| `eTUTOR-flyer-{fata,verso}-115x150mm-CU-bleed-RGB-300dpi.png` | Cu bleed 5mm (1359×1772px) — pentru tipografie, dacă cere bleed |
| `eTUTOR-flyer-{fata,verso}-115x150mm-CU-bleed-CMYK-300dpi.jpg` | Ca mai sus, dar CMYK — pentru tipar |
| `eTUTOR-flyer-fata-verso-105x140-bleed5-300dpi.pdf` | Ambele pagini într-un PDF (115×150mm/pagină, CU bleed) |
| `export-print-files.mjs` | Scriptul care generează toate fișierele de mai sus — rulează-l din nou după orice modificare în `flyer.html` |

**Verificat înainte de livrare** (nu doar generat, ci măsurat):
- Fișierele FĂRĂ bleed: exact 1241×1654px = 10,5×14cm la 300dpi (măsurat cu `file`, nu presupus).
- Fișierele CU bleed: exact 1359×1772px = 11,5×15cm la 300dpi.
- JPG-urile sunt cu adevărat CMYK (4 canale, verificat cu `file` și cu `sharp`), nu doar redenumite.
- PDF-ul are exact 2 pagini.
- Codul QR a fost decodat înapoi (OpenCV) din SVG-ul izolat ȘI din fișierul PNG final de tipar — confirmă `https://etutor.ro/cafea` de fiecare dată.

**O mică diferență față de modelul REAL, ca să știi**: JPG-urile mele au un profil ICC generic „CMYK" atașat (REAL nu avea niciunul deloc). Am dat peste un comportament al bibliotecii (`sharp`) care, fără un profil atașat, revenea tăcut la RGB quando setam rezoluția de 300dpi — soluția a fost să atașez un profil CMYK generic. Majoritatea tipografiilor citesc asta fără probleme; dacă a ta cere explicit „fără profil" sau un profil anume (ISO Coated v2 / FOGRA39 / SWOP), spune-mi și schimb linia din script.

### Cum re-exporți după ce modifici textul/culorile
```bash
cd "/Users/danciulescu/Projects/Tutor/Reports/flyer-b2c-cafea-2026-09-15"
node export-print-files.mjs
```
Scriptul folosește `playwright` + `sharp`, care nu sunt dependențe ale Tutor — le împrumută (doar citire) din `node_modules` al proiectului REAL, unde sunt deja instalate. Dacă proiectul REAL nu mai există la un moment dat, capul fișierului `export-print-files.mjs` explică exact ce să instalezi în loc.

---

## 7. Rezumat „de făcut/decis cu Alex" (v2)

**De făcut, în ordine, înainte de tipar:**
1. Aștepți deploy-ul Tutor (rutarea nouă `/cafea` + fix-ul de voucher nu sunt live încă).
2. Creezi voucherul `V126S` (25%) în panoul de admin — vezi §4b pentru pașii exacți.
3. Testezi tu însuți `etutor.ro/cafea` → înscriere → preț redus vizibil.
4. Deschizi fișierele `...-105x140mm-FARA-bleed-...` și confirmi că arată bine la 10,5×14cm.

**De decis:**
5. Ancora „cât o cafea" la 33,20 lei — rămâne în titlu, sau o scot din caseta de preț?
6. Telefon de contact pe flyer — da/nu (n-am găsit unul oficial pentru eTUTOR în cod).
7. Voucherul e valabil pe orice plan (Elev/Family/Duo etc.), nu doar Family — OK, sau vrei restricționat?
8. Expirare + număr maxim de folosiri pentru V126S — alegere comercială, nu tehnică.
