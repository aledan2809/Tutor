# Ghid pe pagini — Tutor (pentru orice user)

**Data:** 2026-06-20 · **Total:** 84 pagini · **Platformă:** etutor.ro

> Fiecare pagină descrisă în 2-3 rânduri pe înțelesul oricui: ce e, ce butoane are, ce impact.
> Pagini pe roluri: 🌐 Vizitator public · 🔑 Autentificare · 🎓 Elev · 👨‍👩‍👧 Părinte (Watcher) · 🧑‍🏫 Meditator (Instructor) · 🛠️ Admin · 👑 SuperAdmin.
> Unde o pagină e un simplu „înveliș" subțire peste o componentă, e tot funcțională — am notat onest doar paginile cu adevărat minimale.

---

## 🌐 Pagini publice (nu cer cont)

### `/[locale]` — Pagina principală (Homepage)
Vitrina platformei. Sus de tot ai un **demo de quiz** pe care-l poți încerca pe loc, plus dovezi reale (1.400+ grile, examene RO). Butoane: „Încearcă gratuit", „Creează cont", plus bule către elevi/părinți/profesori. Impact: prima impresie + locul unde un vizitator simte valoarea fără cont.

### `/[locale]/try` — Încearcă fără cont
Aici dai un test real în câteva secunde, fără înregistrare: alegi materia, primești grile și răspunzi imediat. Butoane: alegere materie, „Începe testul", la final share + „fă-ți cont". Impact: momentul „WOW" care convertește curioși în utilizatori.

### `/[locale]/grile` — Catalog de grile
Lista tuturor tipurilor de teste (BAC, Evaluare Națională, admitere), grupate ca să găsești rapid materia ta. Butoane: filtre pe tip de examen, intrare pe fiecare materie. Impact: pagină de descoperire + bună pentru Google (SEO).

### `/[locale]/grile/[subject]` — Pagină de materie (ex: BAC Matematică)
Pagină dedicată pe o materie: descriere, un quiz-exemplu și întrebări frecvente (FAQ). Butoane: „încearcă demo complet", citire FAQ. Impact: aduce trafic din Google pe căutări specifice + îl trimite la `/try`.

### `/[locale]/elev` — Pentru elevi
Explică oferta pentru cel care învață singur (plan Self de la 19,90 lei/materie, probă gratuită). Butoane: spre prețuri + demo. Impact: convinge elevul independent (fără părinte plătitor).

### `/[locale]/parinte` — Pentru părinți
Compară planurile de familie (Family/Duo/Trio, 24,9–49,9 lei), arată cum funcționează alertele de progres și are un demo. Butoane: alegere plan, demo, banner promo (-25% până 31.08.2026). Impact: pagina-cheie pentru plătitorul principal.

### `/[locale]/creatori` — Pentru profesori / creatori (listă de așteptare)
Explică programul de creatori cu comision ~50% perpetuu și are un formular de înscriere (nume, email, materie, experiență, CV). Butoane: trimite aplicația. Impact: recrutează meditatori/creatori de conținut.

### `/[locale]/preturi` — Prețuri
Toate planurile una lângă alta, cu reduceri explicate și diferența gratuit vs. plătit. Butoane: alegere plan / spre înregistrare. Impact: pagina de decizie comercială.

### `/[locale]/ghid-bac` — Ghid BAC (magnet de lead-uri)
Oferă un ghid PDF (greșeli frecvente la BAC Mate) în schimbul emailului. Butoane: formular email + descărcare. Impact: colectează contacte pentru marketing.

### `/[locale]/scor` — Card de scor de partajat
Afișează un scor mare și frumos (din parametri `?s=&t=`) gândit să arate bine când îl pui pe WhatsApp/Facebook. Butoane: invită la platformă. Impact: artefact viral — aduce vizitatori noi prin share.

### `/[locale]/certificat/[id]` — Certificat partajabil
Un certificat-card pentru un rezultat de quiz, cu imagine de preview. Butoane: share WhatsApp, descarcă imagine, „fă-ți cont". Impact: mândrie + share = achiziție organică.

### `/[locale]/duel/[id]` — Provocare la duel
Pagina pe care o vede prietenul provocat: numele și scorul provocatorului + invitația „bate-l". Butoane: încearcă același quiz / conectează-te. Impact: buclă virală 1-la-1 (K-factor).

### `/[locale]/privacy` — Politica de confidențialitate
Text legal standard (drepturi GDPR, cum se folosesc datele). **Pagină minimală** (text juridic ușor). Impact: conformitate.

### `/[locale]/terms` — Termeni și condiții
Text legal standard (16+, proprietate intelectuală, răspundere). **Pagină minimală.** Impact: conformitate.

---

## 🔑 Autentificare

### `/[locale]/auth/signin` — Conectare
Te loghezi cu email+parolă, Google, sau link magic pe email. Butoane: conectare, Google, „trimite link", plus „încearcă fără cont". Impact: poarta de intrare a utilizatorilor existenți.

### `/[locale]/auth/register` — Înregistrare
Creezi cont (email, nume, parolă) și îți alegi materiile; suportă linkuri de campanie (`?exam=bac&voucher=...` pre-completează voucher + materii). Butoane: creează cont, acceptă termeni. Impact: conversia în utilizator + intrarea în pâlnia de plată.

### `/[locale]/auth/forgot-password` — Am uitat parola
Ceri un link de resetare pe email. Buton: trimite link. Impact: recuperare cont.

### `/[locale]/auth/reset-password` — Resetare parolă
Setezi parola nouă (cu token din email). Butoane: parolă nouă + confirmă. Impact: finalizează recuperarea.

### `/[locale]/auth/verify` — Verifică emailul
Mesaj scurt „verifică-ți emailul". **Pagină minimală** (doar confirmare). Impact: pas intermediar la magic link.

---

## 🎓 Elev — Dashboard & învățare

### `/[locale]/dashboard` — Acasă (dashboard)
Centrul de comandă al elevului: comutator de materie, statistici (streak, XP, nivel, acuratețe), acțiuni rapide (Practică/Continuă/Evaluare), zone slabe, sesiuni recente. Butoane: start practică, evaluare, intrare pe materii. Impact: punctul de plecare zilnic.

### `/[locale]/dashboard/activare` — Activare cu voucher
Îți alegi materiile și introduci un cod voucher; dacă rămâne ceva de plată, te duce la checkout. Butoane: selectează materii, aplică voucher, plătește. Impact: monetizare post-înregistrare.

### `/[locale]/dashboard/domains` — Materiile mele
Răsfoiești toate materiile și te înscrii singur la cele dorite (vezi nr. de întrebări + nivel). Buton: înscrie-te. Impact: self-service pe ce înveți.

### `/[locale]/dashboard/practice` — Alege sesiunea de practică
Alegi materia și tipul de sesiune (rapidă/micro/lungă/remediere/recuperare/intensivă) cu statistici + recomandare; are tooltips explicative pe fiecare. Butoane: pornire sesiune. Impact: motorul zilnic de antrenament.

### `/[locale]/dashboard/practice/[sessionId]` — Sesiune de practică activă
Quiz-ul propriu-zis: cronometru, întrebare, feedback, următoarea, XP/streak. Butoane: răspunde, next/prev. Impact: aici se face învățarea efectivă.

### `/[locale]/dashboard/assessment` — Test de nivel (diagnostic)
Test scurt (10 întrebări) care îți spune nivelul (începător/mediu/avansat) + punctele slabe. Butoane: alege materia, start. Impact: calibrează experiența la nivelul real.

### `/[locale]/dashboard/progress` — Progresul meu
Statistici de învățare: acuratețe generală, defalcare pe materii, stăpânire pe capitole, sesiuni recente, zone slabe. Impact: feedback de progres care motivează.

### `/[locale]/dashboard/lessons` — Biblioteca de lecții
Lista lecțiilor cu filtre (materie/capitol/domeniu) și bară de progres pe stăpânire. Butoane: deschide lecție, paginare. Impact: partea de teorie a învățării.

### `/[locale]/dashboard/lessons/[id]` — Lecție (vizualizare)
Conținutul lecției (text formatat), card de stăpânire, „marchează ca finalizat", navigare next/prev, link la întrebări de practică. Butoane: complet, practică. Impact: consum de teorie + legătură cu exercițiile. *(Notă: deocamdată doar text — fără video/audio.)*

### `/[locale]/dashboard/bibliography` — Bibliografie
Lista de surse de lectură pe materie (citări, ISBN/URL, note). Impact: trimite elevul la materiale suplimentare.

### `/[locale]/dashboard/exam-bank` — Banca de examene oficiale
Examenele oficiale grupate pe nivel + materie, cu selector. Buton: alege examen. Impact: acces la subiecte oficiale (BAC/EN).

### `/[locale]/dashboard/exam-bank/[paperId]` — Dă un examen oficial
Lucrarea oficială cu texte-suport, cronometrată, cu corectare automată pe barem. Butoane: răspunde, trimite. Impact: simulare realistă cu notă 1-10.

### `/[locale]/dashboard/exams` — Simulator de examen (hub)
Centrul de simulări: alegi materia, vezi tendințe (încercări/scor mediu/rată de promovare), comuți Practică vs. Real, istoric. Butoane: start examen, vezi istoric. Impact: pregătire pentru examenul real.

### `/[locale]/dashboard/exams/[sessionId]` — Examen în desfășurare
Interfața de examen: navigator de întrebări, marcare pentru revizuire, cronometru (mod Real), feedback (mod Practică), confirmare trimitere. Butoane: navighează, flag, trimite. Impact: experiența completă de examen.

### `/[locale]/dashboard/gamification` — Realizări & clasament
XP, streak (+buton de recuperare streak), provocare zilnică, top-10 clasament, grilă de realizări. Butoane: recuperează streak, daily challenge. Impact: motivație + retenție prin joc.

### `/[locale]/dashboard/calendar` — Planificator + calendar
Conectezi Google Calendar, vezi sloturi libere și programezi sesiuni de studiu; configurezi orele de studiu. Butoane: conectează/deconectează Google, programează, salvează ore. Impact: planificare disciplinată a învățării. *(Apare și pentru meditator dacă are rolul.)*

### `/[locale]/dashboard/referrals` — Invită & Câștigă
Codul tău de referral, voucherul de bun-venit, linkuri de share și statistici (invitați/activi/câștiguri) pentru comision 50% recurent. Butoane: copiază link, share WhatsApp/Facebook. Impact: creșterea organică + venit pasiv pentru utilizator.

### `/[locale]/dashboard/notifications` — Notificări
Lista tuturor notificărilor pe tipuri. Impact: centru de mesaje în-app.

### `/[locale]/dashboard/settings` — Setări
Hub de setări: link spre notificări, configurare Google Calendar, ore de studiu. Butoane: spre subpagini, salvează ore. Impact: control pe cont.

### `/[locale]/dashboard/settings/notifications` — Setări notificări
Activezi push în browser, conectezi Telegram și reglezi fin ce notificări primești. Butoane: abonare push, conectare Telegram, comutatoare. Impact: controlezi cum ești „urmărit" de platformă.

---

## 👨‍👩‍👧 Părinte (Watcher)

### `/[locale]/dashboard/watcher` — Lista copiilor mei
Grilă cu cardurile de progres ale elevilor monitorizați (acuratețe, streak, XP, nivel, zone slabe) + căutare. Butoane: caută, intră pe copil. Impact: vederea de ansamblu a părintelui. *(⚠️ Gap cunoscut: momentan arată elevi din aceeași materie, nu strict copilul propriu — vezi raportul de gap-uri P0.)*

### `/[locale]/dashboard/watcher/[id]` — Detalii copil
Profil detaliat al copilului pe fiecare materie: statistici, zone slabe, sesiuni recente, istoric examene. Impact: vederea „în adâncime" pe un copil.

### `/[locale]/dashboard/watcher/notifications` — Alertele părintelui
Inbox de alerte (escaladare/streak/obiective/sesiuni) cu filtre citit/necitit. Butoane: marchează citit / toate citite. Impact: părintele află când copilul nu mai învață.

---

## 🧑‍🏫 Meditator (Instructor)

### `/[locale]/dashboard/instructor` — Acasă meditator
Sumar cu statistici (elevi, grupe, obiective active, mesaje necitite) + acțiuni rapide + activitate recentă. Impact: tabloul de bord al profesorului.

### `/[locale]/dashboard/instructor/students` — Elevii mei
Lista elevilor cu căutare, sortare pe risc/acuratețe/nume și scor de risc de abandon (cu tendință ↑↓→). Butoane: deschide elev. Impact: identifică rapid elevii în pericol.

### `/[locale]/dashboard/instructor/students/[id]` — Detalii elev (vedere meditator)
Profil detaliat al unui elev din perspectiva meditatorului (similar cu vederea părintelui). Impact: urmărire individuală.

### `/[locale]/dashboard/instructor/groups` — Grupe / clase
Lista grupelor cu nr. de membri + acțiuni în masă (șterge/exportă). Butoane: creează grup, selectează+acțiune. Impact: organizarea elevilor pe clase.

### `/[locale]/dashboard/instructor/groups/[id]` — Detalii grup
Gestionezi un grup și lista lui de elevi. Butoane: editează, gestionează membri. Impact: administrarea unei clase.

### `/[locale]/dashboard/instructor/groups/new` — Grup nou
Formular de creare grup (nume, descriere, materie, elevi). Buton: creează. Impact: configurare clasă.

### `/[locale]/dashboard/instructor/analytics` — Analiză predictivă
Carduri de sumar (cu risc/în declin/în creștere) + predicții per elev. Butoane: filtre. Impact: previne abandonul înainte să se întâmple.

### `/[locale]/dashboard/instructor/goals` — Obiective
Setezi obiective de învățare per elev. Impact: țintă clară de urmărit.

### `/[locale]/dashboard/instructor/messages` — Mesaje
Inbox de comunicare cu elevii (multi-canal: în-app/WhatsApp/SMS/email). Butoane: trimite mesaj. Impact: contact direct cu elevii/părinții.

### `/[locale]/dashboard/instructor/questions` — Întrebările mele
Banca de întrebări a meditatorului pe domeniul lui. Impact: conținut propriu.

### `/[locale]/dashboard/instructor/reports` — Rapoarte
Generează/descarcă rapoarte despre elevi. Impact: dovezi de progres pentru părinți.

### `/[locale]/dashboard/instructor/settings` — Setări meditator
Setări proprii (calendar, ore de studiu, preferințe). Impact: configurare cont meditator.

---

## 🛠️ Admin — Conținut & platformă

### `/[locale]/dashboard/admin` — Tablou admin
Centrul de comandă al operatorului: statistici întrebări (total/draft/aprobate/publicate), pipeline conținut (manual vs. generat %), acțiuni rapide, tabel domenii, întrebări recente. Impact: gestionarea conținutului platformei.

### `/[locale]/dashboard/admin/domains` — Domenii (materii)
Tabel de gestionare a domeniilor/materiilor. Impact: structura ofertei educaționale.

### `/[locale]/dashboard/admin/domains/new` — Domeniu nou
Formular de creare domeniu. Impact: adaugă o materie nouă.

### `/[locale]/dashboard/admin/domains/[id]` — Editează domeniu
Formular + configurare pentru un domeniu existent. Impact: ajustarea unei materii.

### `/[locale]/dashboard/admin/questions` — Banca de întrebări
Tabel filtrabil cu toate întrebările. Butoane: filtrare, editare. Impact: managementul întregului conținut de grile.

### `/[locale]/dashboard/admin/questions/new` — Întrebare nouă (manual)
Formular de creare manuală a unei întrebări. Impact: conținut scris de om.

### `/[locale]/dashboard/admin/questions/[id]/edit` — Editează întrebare
Formular + previzualizare pentru o întrebare. Impact: corectarea conținutului.

### `/[locale]/dashboard/admin/questions/generate` — Generare automată
Generează întrebări pornind de la parametri. Impact: producție rapidă de conținut (intră în coada de verificare).

### `/[locale]/dashboard/admin/questions/from-content` — Generare din text
Lipești material → se produc întrebări ancorate în text (trecute prin filtrul de calitate). Impact: transformă manuale/lecții în grile.

### `/[locale]/dashboard/admin/questions/import` — Import în masă
Încărcare fișier (PDF/DOCX/CSV/imagine) → întrebări. Impact: alimentare rapidă a băncii.

### `/[locale]/dashboard/admin/questions/import-book` — Import din carte
Import specializat care păstrează ordinea fizică din carte. Impact: instructorii pot urmări cartea pas cu pas.

### `/[locale]/dashboard/admin/questions/review` — Verificare (Review Queue)
Coada de aprobare DRAFT→APROBAT→PUBLICAT, cu scor de încredere + flaguri de la filtrul de calitate + buton Auto-Fix; cele semnalate apar primele. Butoane: aprobă, fix automat. Impact: poarta de calitate a conținutului.

### `/[locale]/dashboard/admin/exam-bank` — Examene oficiale (admin)
Tabel de gestionare a lucrărilor oficiale. Impact: managementul băncii de examene.

### `/[locale]/dashboard/admin/exam-bank/[paperId]` — Editează lucrare
Editor de lucrare + itemi. Impact: corectarea examenelor oficiale.

### `/[locale]/dashboard/admin/exam-formats` — Formate de examen
Configurezi formatele (timp, nr. itemi, prag de promovare). Impact: definește regulile simulărilor.

### `/[locale]/dashboard/admin/bibliography` — Bibliografie (admin)
Gestionarea referințelor bibliografice. Impact: materiale de lectură pe materie.

### `/[locale]/dashboard/admin/lessons` — Lecții (admin)
CRUD pe lecții. Impact: managementul teoriei.

### `/[locale]/dashboard/admin/subjects` — Subiecte
Date master pe subiecte/capitole. Impact: taxonomia conținutului.

### `/[locale]/dashboard/admin/tags` — Etichete (tags)
Gestionarea etichetelor de clasificare. Impact: organizarea/filtrarea conținutului.

### `/[locale]/dashboard/admin/templates` — Șabloane
Șabloane reutilizabile pentru întrebări (înveliș subțire peste componenta de șabloane — funcțional). Impact: standardizarea creării.

### `/[locale]/dashboard/admin/creatori` — Gestionare creatori
Vezi înscrierile pe lista de așteptare de creatori + descarcă CV-uri (panou SuperAdmin-gated). Impact: trierea aplicanților creator.

### `/[locale]/dashboard/admin/aviation/seed-demo` — Seed demo (Aviation)
**Unealtă de test/dev** care populează date demo pe domeniul Aviation. Impact: doar pentru demonstrații/testare, nu pentru utilizatori reali.

---

## 👑 SuperAdmin — Finanțe, audit, campanii

### `/[locale]/dashboard/admin/superadmin` — Hub SuperAdmin
Punctul de plecare al super-administratorului (statistici + navigare). Impact: control la cel mai înalt nivel.

### `/[locale]/dashboard/admin/superadmin/users` — Utilizatori
Tabel de utilizatori + roluri. Impact: managementul conturilor + permisiunilor.

### `/[locale]/dashboard/admin/superadmin/audit` — Jurnal de audit
Jurnal de activitate (cine a făcut ce) — înveliș peste componenta AuditLog, funcțional. Impact: trasabilitate + securitate.

### `/[locale]/dashboard/admin/superadmin/revenue` — Venituri
Tablou financiar de venituri — înveliș peste RevenueDashboard, funcțional. Impact: vizibilitate pe încasări.

### `/[locale]/dashboard/admin/superadmin/plans` — Planuri de abonament
CRUD pe planurile SaaS. Impact: definirea ofertei de prețuri.

### `/[locale]/dashboard/admin/superadmin/vouchers` — Vouchere
Administrarea codurilor de reducere. Impact: campanii + promoții.

### `/[locale]/dashboard/admin/superadmin/campaigns` — Campanii marketing
Urmărirea campaniilor (semnături, conversie). Impact: măsoară eficiența marketingului.

### `/[locale]/dashboard/admin/superadmin/ads` — Reclame (ad spend)
Urmărirea cheltuielilor/plasamentelor de reclame. Impact: management buget achiziție.

---

## Rezumat onest pe stare

- **~78 pagini complet funcționale** (logică reală, date din DB, interacțiuni).
- **3 pagini cu adevărat minimale:** `/privacy`, `/terms`, `/auth/verify` (text/confirmare scurtă) — corect așa.
- **1 unealtă de dev:** `/dashboard/admin/aviation/seed-demo` (doar testare).
- Paginile „înveliș subțire" (audit, revenue, templates) NU sunt stub-uri — sunt funcționale, doar că logica stă în componente.
- **Lecțiile** sunt funcționale dar momentan doar text (fără video/audio — vezi raportul de gap-uri, Faza 1).

---

*Generat read-only pe 2026-06-20. Toate paginile au fost citite sau verificate; căi reale citate.*
