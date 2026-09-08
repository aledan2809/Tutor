# Cum funcționează o materie privată, de la zero până la primul om care învață

Scris 2026-09-08, ca răspuns la întrebarea „zi cum se folosește tot domeniul în cazul
unui nou user dedicat pe anumite domenii care nu se pun public".

Totul de mai jos e verificat pe producție, nu descris din memorie.

---

## Ce înseamnă „privată"

O materie e **publică** sau **privată** — nu există stări intermediare. Diferența e
una singură, dar e absolută:

- **publică** — apare în catalog, oricine se poate înscrie singur;
- **privată** — nu apare nicăieri. Orice adresă a ei răspunde **404** cuiva neînscris:
  nu „nu ai voie", ci „nu există". Cine nu e înscris nu poate afla nici măcar că
  materia există, chiar dacă îi ghicește numele.

`Aviation` (materialul lui Rareș) și `agent-imobiliar` (REAL) sunt private. Materiile
de bacalaureat sunt publice.

**„Publicat" e altceva decât „public".** O lecție publicată înseamnă doar „nu mai e
ciornă" — devine vizibilă *pentru cei înscriși*. Materia rămâne privată. Cele două
comutatoare nu au legătură între ele.

---

## Cele patru piese

| piesa | ce ține | unde se vede |
|---|---|---|
| **Materia** (`Domain`) | numele, dacă e publică sau privată, dacă e pornită | Admin → Materii |
| **Organizația** | firma căreia îi aparține materia | Admin → Organizații |
| **Cursul** | modulele, lecțiile, testele | Admin → Cursuri |
| **Înscrierea** | ce om are acces și cu ce rol | Admin → Utilizatori |

Materia poate exista fără curs (doar grile, ca la bacalaureat). Cursul nu poate
exista fără materie.

---

## Drumul complet, pas cu pas

### 1. Faci materia și o pui pe privat
Admin → Materii → materie nouă. Comutatorul public/privat e acolo, cu confirmare
explicită — schimbarea lui se scrie în jurnalul de audit, fiindcă mută conținut între
„oricine îl vede" și „nimeni nu știe că există".

### 2. O legi de organizație (dacă e a unei firme)
Admin → Organizații → alegi materia. De aici decurg două lucruri care contează:

- **administratorul firmei** poate crea conținut și utilizatori, dar **numai** în
  materiile firmei lui. Nu vede și nu atinge nimic din restul platformei.
- **cursanții firmei nu sunt clienți de consum**: nu li se cere abonament ca să
  deschidă lecțiile materiei respective. Firma plătește, nu omul.

O materie fără organizație rămâne pe regulile obișnuite — abonamentul individual
decide ce funcții are elevul.

### 3. Pui conținutul
Fie scrii cursul de mână, fie îl generezi din prompt (Admin → Cursuri → curs nou).
Totul intră ca **ciornă**: lecțiile, grilele, cursul însuși. Nimic nu ajunge la
cineva până nu apeși „publică".

Grilele generate trec prin trei verificări înainte de a fi stocate: un judecător de
corectitudine, un filtru determinist de indicii (lungime, poziție), și un al doilea
judecător care **nu vede enunțul** — dacă poate ghici răspunsul doar din variante,
grila e aruncată.

### 4. Publici
Un singur buton: publică deodată cursul, lecțiile și grilele. Le retrage tot deodată.
Nimic nu se șterge la retragere.

### 5. Dai accesul

**Două căi, alege după situație:**

| | cod de acces | înscriere de către admin |
|---|---|---|
| când | ai mai mulți oameni și nu vrei să-i introduci pe fiecare | ai câțiva, sau vrei roluri speciale |
| cum | Admin → Materii → *Emite cod*, îl dai oamenilor; ei îl introduc la Domenii | Admin → Utilizatori → înscrie în materie |
| rolul primit | întotdeauna **elev** | orice rol alegi |
| control | expiră (implicit 30 de zile), număr maxim de folosiri, se poate roti sau retrage oricând | per om |
| urmă | fiecare intrare pe cod se scrie în jurnal | înscrierea se vede în Utilizatori |

Codul dă **numai** acces de elev. Dacă cineva a avut cândva rol de administrator pe
materie și i s-a retras, folosirea codului **nu i-l redă** — un cod de elev dă acces
de elev, punct.

### 6. Omul învață
Vede materia în lista lui, deschide **Lecții**, citește. La capătul lecției se
marchează singură ca parcursă.

**Testul se deschide pe măsură ce citește.** Un modul intră în test doar după ce
lecția lui e terminată — ca la un elev de clasa a VIII-a, care nu e testat din
capitolele la care clasa n-a ajuns. Dacă n-a terminat nicio lecție, testul nu spune
„nu există întrebări", ci îl trimite la lecții.

---

## Ce vede fiecare

| | materia privată | lecțiile | grilele | administrare |
|---|---|---|---|---|
| **om neînscris** | 404 — nici nu știe că există | 404 | 404 | — |
| **cursant înscris** | da | cele publicate | doar din modulele parcurse | — |
| **admin de firmă** | doar materiile firmei lui | toate, inclusiv ciornele | toate | creează conținut și utilizatori, în firma lui |
| **superadmin** | toate | toate | toate | tot |

---

## Ce se scrie în jurnalul de audit

Nu tot, ci exact lucrurile care schimbă **cine ajunge la conținut**:

- schimbarea public ↔ privat
- oprirea sau repornirea unei materii
- emiterea, rotirea și retragerea codului de acces
- **fiecare intrare cu cod** — cine, când, dacă era o reactivare
- publicarea și retragerea unui curs
- acordarea și retragerea rolului de administrator de firmă

Redenumirea unei materii sau schimbarea descrierii **nu** se auditează — nu mută pe
nimeni nicăieri.

---

## Trei lucruri care se greșesc ușor

1. **„Am publicat, dar nu vede nimeni."** Publicarea nu înscrie pe nimeni. Sunt două
   operații: publici conținutul (iese din ciornă) și dai accesul (cod sau înscriere).
2. **Materie oprită ≠ materie privată.** O materie oprită nu se deschide nici de cei
   înscriși — e pentru mentenanță, nu pentru confidențialitate.
3. **Cheia care leagă grilele de modul nu e titlul.** Titlul modulului se poate
   schimba oricând; cheia internă rămâne. Dacă cineva o rescrie, testul modulului se
   golește fără ca nimic să dea eroare.
