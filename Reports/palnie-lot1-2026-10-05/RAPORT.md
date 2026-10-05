# Pâlnia — lotul 1 (pașii 1–5 din `TRUE-E2E-FULL-2026-10-05.md` §6) — 2026-10-05

**Stare:** commit local pe `master`, verificat pe stiva QA (build de producție + bază locală). **Nelivrat pe etutor.ro** — livrarea așteaptă OK-ul lui Alex.

## Ce s-a schimbat

| Pas | Ce | Unde |
|---|---|---|
| 1 | Bannerul de cookie-uri: o bandă de 57 px jos (era un card de 214 px, 450–664 px pe iPhone). Își publică înălțimea în `--cookie-banner-h`; pagina primește spațiu jos, iar butonul WhatsApp, meniul de jos și bara fixă de pe `/parinte` stau deasupra ei. Ce se înregistrează nu s-a schimbat (același POST `/api/v1/consent/record`, `type: COOKIES`). | `CookieConsentBanner.tsx`, `globals.css`, `cookie-consent.ts`, `WhatsAppCta.tsx`, `mobile-bottom-nav.tsx`, `parent-landing.module.css` |
| 1 | `/ro`: pe telefon, butoanele imediat sub titlu (339 px și 399 px, erau la 625 px sub banner); titlul și spațiile mai strânse pe telefon. `/ro/parinte`: pe telefon fotografia are 230 px (avea 470), cu fața încadrată; butonul principal e la 435 px (era la 636). Pagina de cont: butonul „Creează cont” are 48 px (avea 36) și e deasupra bandei. | `[locale]/page.tsx`, `parent-landing.*`, `auth/register/page.tsx` |
| 2 | „Încearcă o grilă acum — fără cont” → `/try`: butonul principal pe `/ro`, pe `/ro/grile`, pe fiecare `/ro/grile/*` și pe `/ro/parinte`. La finalul demo-ului, un singur buton, „Salvează progresul — fă-ți cont (gratuit)”, chiar sub scor, nu sub lista de răspunsuri. | `page.tsx`, `grile/*`, `parent-landing.tsx`, `landing-copy.ts`, `SubjectQuizDemo.tsx` |
| 3 | Pagina de intrare: buton mare „Cont nou gratuit” (în locul textului de 28 px „Fă-ți unul”); când vizitatorul vine dintr-un link spre panou (`?callbackUrl=`), butonul e primul, iar „Am deja cont” vine după. Titlurile, unificate pe tot site-ul la „… \| eTutor.ro”, în limba paginii: `/ro/auth/register` „Cont nou gratuit \| eTutor.ro” (era „Sign In - Tutor”), `/ro/try` „Încearcă o grilă — gratuit, fără cont \| eTutor.ro”, `/ro` „Mii de grile reale pe materia ta \| eTutor.ro” (era „Tutor - … \| etutor.ro \| Tutor”). | `layout.tsx`, `auth/layout.tsx`, `auth/register/layout.tsx`, `try/layout.tsx`, `auth/signin/page.tsx` și titlurile paginilor |
| 4 | Evenimente Umami (`trackEvent`): `cta_try`, `cta_register`, `cta_parinte_fara_card`, `register_done`, `first_question` (în demo o dată pe sesiune; în cont la primul răspuns din acel browser). Datele spun doar de unde vine apăsarea (`from: home / parinte / grile / signin / demo_end …`). | `lib/funnel-events.ts`, `components/TrackedLink.tsx` |
| 5 | S1: numele invitatorului e escapat în e-mailul de invitație (și ținut pe un rând scurt); plafoane: 10 invitații pe zi per cont, 2 e-mailuri de invitație pe zi per adresă, numărate în bază; 429 cu mesaj în română. S2: înscrierea are un plafon de 5 conturi pe oră per adresă IP (rezervare sincronă, deci nici cererile trimise simultan nu trec); plafon zilnic pe tot site-ul de 100 de e-mailuri de acord al părintelui (motivul `site-busy`). | `family-invite.ts`, `api/dashboard/family/invite`, `api/auth/register`, `lib/signup-limit.ts`, `parent-consent*.ts`, `api/me/age`, `api/me/parent-consent` |

## Dovezi (stiva QA: `next build` + `next start` pe :3113, bază locală, cutie poștală falsă pe :2525)

- **Sonda** (`funnel/sonda-palnie-qa.mjs`, iPhone 13 390×664 + desktop 1366×768, CSP activ):
  - *înainte*: pe telefon, banner `top=450 h=214`; acoperite: „Fă-ți cont gratuit” 625–677 (`/ro`), „Începe cu 24,90 lei/lună” 636–690 (`/ro/parinte`), „Creează cont” 561–597 (register).
  - *după*: banner `top=607 h=57`; pe telefon toate OK: `/ro`, `/ro/parinte`, `/ro/auth/register`, signin cu `callbackUrl`, `/ro/grile`, `/ro/grile/*`. `/family/join` („Verifică codul” la 252 px) și `/acces/<cod>` („Intră la curs” la 468 px) sunt libere.
- **Pâlnia cap-coadă pe telefon**: `/ro` → o atingere → `/ro/try` → 5 întrebări → rezultat (butonul final la 184–256 px, singurul buton de cont) → formular → `/ro/dashboard`. Evenimente prinse în ordine: `cta_try{from:home}`, `first_question{where:demo}`, `cta_register{from:demo_end}`, `register_done{role:PARENT,minor:false}`. 0 erori în pagină.
- **Accept** pe banner: banda dispare, spațiul de jos revine la 0, POST-ul de consimțământ pleacă neschimbat, iar după reîncărcare banner-ul nu mai apare.
- **Pasul 5 prin API**:
  - conturi de pe același IP: `201×5, 429` (`reason: signup-ip`); 15 cereri simultane: 5×201, 10×429;
  - aceeași adresă de invitație: `201, 201, 429` (`address`); per invitator: a 11-a invitație din zi primește 429 (`inviter`);
  - în cutia poștală, numele `<a href=…><img onerror=…>` apare escapat (`&lt;a href=&quot;…`); e-mailul de acord pentru minor a plecat normal.
- **Teste**: vitest 1.391 → **1.408** (17 noi, în `tests/unit/funnel-lot1-security.test.ts` și `funnel-events.test.ts`); `tsc` curat; eslint curat pe fișierele atinse.
- **Revizuire independentă** (1 agent): două constatări, ambele reparate (plafonul pe IP putea fi ocolit cu cereri în paralel; cererile fără IP cunoscut împărțeau același contor).

## De știut / rămas

- **Umami real nu e verificat**: din mediul în care s-a lucrat, `analytics.knowbest.ro` nu e accesibil. Evenimentele s-au verificat cu un tracker-înlocuitor în pagină. După livrare: Umami → site etutor.ro → Events.
- **Decizie de confirmat**: 5 conturi/oră per IP poate opri o clasă întreagă care își face conturi de pe Wi-Fi-ul școlii (o singură adresă publică). Pragul se schimbă dintr-o constantă (`SIGNUPS_PER_IP_PER_HOUR`).
- **Desktop, register și signin**: linkul secundar mic „încearcă fără cont”, de la capătul formularului, e pe jumătate sub bandă până la derulare; butonul principal e liber.
- **`/ro/preturi` pe telefon**: încă nu are niciun buton pe primul ecran — asta e pasul 9 (sesiune următoare).
- **Schema vs. migrări (găsit pe drum)**: o bază făcută doar din `prisma/migrations` n-are coloanele `Question.sourceReference`, `bookOrder`, `bookPage`, `chapterIndex`, `pdfPage`, `qNumberInBook`, `imageUrl`, `explanationVideoUrl` (pe prod există — adăugate cândva fără migrare). Demo-ul public dă 0 întrebări pe o astfel de bază. Pe QA s-au adăugat local; e nevoie de o migrare „doar adaugă” (`IF NOT EXISTS`). Trecut în TODO.
- **Capturile** nu sunt comise (ca la audit). Se refac cu `BASE=… node Reports/true-e2e-2026-10-05/funnel/sonda-palnie-qa.mjs` (`DEV=1` pentru `next dev`).
