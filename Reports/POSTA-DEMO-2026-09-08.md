# Demo Poșta Română — ce s-a construit, cum se reface, ce lipsește

**Data:** 8 septembrie 2026
**Cerut de:** proprietar, pentru o prezentare la Poșta Română
**Stare:** pagina publică LIVE · cele 3 cursuri publicate · prezentarea trimisă ca pagină separată

---

## Ce este

O demonstrație de vânzare. Poșta Română vrea să concureze firmele de curierat, iar pe lângă
sisteme trebuie schimbată și mentalitatea oamenilor. Am construit ce se poate construi **fără
niciun document de la ei**: trei trasee de curs pe cele trei roluri care ating clientul, plus
o pagină de prezentare cu login.

**Regula care ține totul în picioare:** fiecare loc în care a trebuit să presupunem ceva e marcat
vizibil în corpul lecției, în forma

> **Ipoteză de lucru.** Presupunem că … — se înlocuiește cu procedura voastră.

Nu e o notă de subsol, e mecanismul comercial: fiecare astfel de rând e o linie de contract care
se șterge în ziua în care primim documentul.

---

## Cele trei trasee

| materie (privată) | curs | module |
|---|---|---|
| `posta-factor` | Ultima sută de metri | Prima încercare care reușește · Banii din mână și dovada · Omul de la ușă ești tu |
| `posta-ghiseu` | La geam | Sala, nu doar geamul · Coletul în două minute · Prețul, termenul și omul supărat |
| `posta-oficiu` | Oficiul tău, în cinci numere | Cinci numere pe o foaie · Coada de prânz și reclamația · Primul client din oraș |

Toate trei aparțin organizației `posta-romana-demo`. Fiecare are **codul ei de acces** (50 de
folosiri, 30 de zile) — în implementarea reală fiecare rol primește codul lui, exact așa.

**De ce o materie per rol și nu una cu trei cursuri:** `courseTopicsFor` ia doar primul curs
publicat al unei materii (`findFirst`), deci într-o materie cu trei cursuri testele ultimelor două
nu s-ar deschide niciodată, tăcut. Defectul e notat separat în `TODO_PERSISTENT.md`.

---

## Cum s-au scris lecțiile

Trei treceri, cu metode diferite, pentru că o singură metodă vede o singură clasă de defecte
(lecția L38 din sesiunea anterioară):

1. **Recunoaștere** — patru agenți pe surse publice: piața de curierat (ANCOM), Poșta ca
   organizație (rapoartele proprii), ziua de lucru reală a celor trei roluri (mărturii din presă),
   și precedente europene de modernizare poștală. 149 de constatări, fiecare marcată
   *verificat / plauzibil / presupunere*.
2. **Schiță + critică** — o schiță per rol, fiecare trecută prin trei lentile independente: un om
   de la Poștă cu 15 ani vechime, decidentul care semnează, și un verificator de fapte. Toate trei
   schițele au ieșit `DE_CORECTAT`, cu 12-15 probleme fiecare.
3. **Scriere + verificare** — 9 lecții, fiecare verificată de trei critici (fapte / limbă / ce
   ne-ar face de râs) și corectată. **382 de constatări ridicate, 213 aplicate, 65 respinse motivat.**

### Ce au tăiat criticii, și bine au făcut
- **comparația cu un curier privat pe reclamații** (noi 7%, el ~49%): cifrele ANCOM nu sunt
  raportate la volumul livrat, deci comparația e nedreaptă și se poate întoarce împotriva noastră
- **trimiterea la dosare penale** pe mandate — argumentul stă fără ea
- **anti-exemplul luat din presă** (un angajat care amenință clientul cu poliția) → rescris ca
  situație posibilă, la persoana a doua

### Ce au adăugat
- ce faci **când aparatul nu poate**: fără semnal, baterie moartă
- **câinele liber, omul agresiv, scara întunecată** — cu regula spusă simplu: nicio trimitere nu
  merită să te pui în pericol
- **situațiile în care nu depinde de tine**: interfon stricat, poartă încuiată, adresă greșită
- costul în timp, spus pe față (telefonul dinainte ≈ 10-15 min la 15 colete) **și** ce trebuie să
  decidă compania în scris ca să fie posibil
- oficiul cu **posturi vacante**: ce faci realist când ești doi, nu patru

### Reguli respectate în tot materialul
Nicio cifră în afara listei permise (ANCOM 2025 pentru 2024, comunicate Poșta Română, Correos,
DHL), fiecare cu sursa în paranteză lângă ea. Zero anglicisme nemarcate — „centru de sortare" nu
hub, „serviciul de relații cu clienții" nu call center. Zero apariții ale cuvântului „AI".
Verificat automat la final pe toate cele 9 lecții.

---

## Cum se reface demo-ul de la zero

```
node scripts/seed-posta-demo.mjs                      # simulare
node scripts/seed-posta-demo.mjs --apply              # organizație + materii + cursuri + coduri
node scripts/seed-posta-demo.mjs --apply --questions --only posta-factor   # grilele (lent)
node scripts/seed-posta-demo.mjs --apply --publish --only posta-factor     # publicarea
```

Conținutul stă în `scripts/data/posta-demo.json`; scriptul nu știe nimic despre Poștă, doar despre
pași. Totul trece prin **API-ul aplicației**, nu prin scriere directă în bază: fiecare pas ia
aceleași verificări și lasă urmă în jurnalul de audit, ca și cum l-ar fi făcut un om din panou.

⚠️ **Ruta de import creează un curs NOU la fiecare apel.** Prima re-rulare a dublat cursurile pe
toate cele trei materii (curățate în aceeași zi). De aceea scriptul ține minte ce a creat, în
`scripts/data/posta-demo.state.json` — **gitignorat, conține codurile de acces**. Tot de acolo știe
să nu rotească un cod deja împărțit oamenilor.

Credențialele contului demo și codurile: `Master/credentials/tutor-test-users.env`.

---

## Verificat pe producție

- `etutor.ro/posta` → 307 → `/ro/posta` → 200; `/en/posta` → 200. Restul site-ului neatins.
- materiile sunt **PRIVATE**: pentru un cont neînscris, rutele pe slug răspund **404**, identic cu
  o materie inexistentă (`/api/posta-factor/progress`, `session/start`).
- contul demo, înscris în toate trei, primește 200 pe aceleași rute.

**Găsit pe drum, notat în TODO:** rutele care primesc `domainId` în loc de slug răspund **403**, nu
404 — deci confirmă că materia există. Exploatarea cere un cuid, care nu se ghicește și nu apare
nicăieri pentru un neînscris, dar cele două căi ar trebui să răspundă la fel.

---

## Ce rămâne

- **de decis de proprietar:** dacă pagina `/posta` primește o adresă de contact (acum are doar
  „Autentificare" și „Creează cont" — n-am inventat o adresă de e-mail).
- codurile expiră la 30 de zile de la emitere (7 octombrie 2026). Se rotesc din Admin → Materii.
- dacă demonstrația merge mai departe: primul pas nu e scrisul, ci **cele șapte documente** din
  capitolul „Ce vă cerem" al prezentării.
