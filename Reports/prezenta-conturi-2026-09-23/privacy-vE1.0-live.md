# Politica de Confidențialitate

**Operator de date**: {entity_name} · **Jurisdicție**: {entity_jurisdiction}
**CUI / VAT**: {entity_cui} · **Adresă**: {entity_address}
**Versiune**: {version} · **În vigoare din**: {effective_date}

---

Prezenta Politică de Confidențialitate descrie modul în care **{entity_name}** colectează, utilizează, stochează și protejează datele tale cu caracter personal în cadrul aplicației **{app_name}**, în conformitate cu **Regulamentul (UE) 2016/679** (GDPR) și legislația română în vigoare.

Te rugăm să citești cu atenție acest document. Dacă ai întrebări, poți contacta Responsabilul nostru cu Protecția Datelor (DPO) la **{entity_dpo_email}**.

---

## 1. Cine este operatorul tău de date

**{entity_name}** este operatorul de date cu caracter personal colectate prin **{app_name}**.

| | |
|---|---|
| **Denumire** | {entity_name} |
| **Sediu** | {entity_address} |
| **CUI / VAT** | {entity_cui} |
| **Jurisdicție** | {entity_jurisdiction} |
| **DPO** | {entity_dpo_email} |

În funcție de reședința ta sau de aplicația utilizată, operatorul tău efectiv poate diferi. În acest caz, vei fi notificat la înregistrare cu privire la entitatea care îți operează datele, conform regulilor de rutare a entității din sistemul nostru.

## 2. Responsabilul cu Protecția Datelor (DPO)

Am desemnat un DPO intern pentru a asigura respectarea GDPR. Poți contacta DPO-ul la orice oră la **{entity_dpo_email}** pentru:

- exercitarea drepturilor tale (acces, ștergere, portabilitate etc.);
- întrebări despre modul în care prelucrăm datele tale;
- sesizări sau plângeri privind protecția datelor.

## 3. Ce date colectăm

### 3.1 Date de identificare și cont

La crearea contului colectăm: **nume și prenume, adresă de e-mail, număr de telefon** (opțional), **parola** (stocată în formă hash, niciodată în clar). Dacă te autentifici prin SSO (Single Sign-On) din altă aplicație din ecosistemul 4PRO, primim tokenul de sesiune și datele de profil aferente.

### 3.2 Date de utilizare a serviciului

Colectăm automat: **log-uri de acces** (adresă IP, User-Agent, timestamp), **evenimentele de navigare** în aplicație (paginile vizitate, funcțiile utilizate), **preferințele setate** în cont și **istoricul acțiunilor** efectuate.

### 3.3 Date de comunicare

Dacă optezi pentru notificări prin WhatsApp, SMS sau e-mail: **numărul de telefon WhatsApp/SMS** și **preferințele de notificare**.

### 3.4 Date de plată

Plățile sunt procesate de furnizori terți certificați (Stripe, Revolut Business etc.). **Nu stocăm date ale cardului bancar.** Primim doar confirmarea tranzacției și un identificator de abonament.

### 3.5 Date tehnice și cookie-uri

**Adresa IP, tipul de browser, sistemul de operare, rezoluția ecranului**, date de sesiune și cookie-uri — conform [Politicii de Cookie-uri](/ro/cookies/{app_slug}).

## 4. Scopurile și temeiurile juridice ale prelucrării

| Scop | Categorii de date | Temei juridic (GDPR) |
|---|---|---|
| Crearea și gestionarea contului | Date de identificare | Art. 6(1)(b) — executarea contractului |
| Furnizarea funcționalităților de bază ale {app_name} | Date de utilizare, date cont | Art. 6(1)(b) — executarea contractului |
| Trimiterea notificărilor (push, WhatsApp, e-mail) | Date de contact, preferințe | Art. 6(1)(a) — consimțământ; sau Art. 6(1)(b) pentru notificări esențiale legate de cont |
| Procesarea plăților și managementul abonamentului | Date de tranzacție | Art. 6(1)(b) — executarea contractului |
| Securitate, prevenirea fraudei și abuzului | Date tehnice, log-uri | Art. 6(1)(f) — interes legitim |
| Îmbunătățirea produsului și analiza utilizării | Date de utilizare (anonimizate sau pseudonimizate) | Art. 6(1)(f) — interes legitim; sau Art. 6(1)(a) — consimțământ, pentru date personalizate |
| Respectarea obligațiilor legale (contabilitate, audit) | Date de identificare, tranzacție | Art. 6(1)(c) — obligație legală |
| Soluționarea litigiilor și apărarea drepturilor noastre | Date relevante litigiului | Art. 6(1)(f) — interes legitim |

**Interesele noastre legitime** (Art. 6(1)(f)) sunt evaluate prin test de proporționalitate (balancing test) și nu depășesc drepturile tale fundamentale. Poți solicita o copie a testului de balansare relevant contactând DPO-ul.

## 5. Destinatari și procesatori de date

Putem partaja datele tale cu terți exclusiv în contextele de mai jos:

### 5.1 Procesatori (acționează în numele nostru)

| Procesator | Rol | Locație | Garanție pentru transfer |
|---|---|---|---|
| Furnizor hosting (VPS / cloud) | Infrastructură server | UE/SEE | Nu se aplică (prelucrare în SEE) |
| Stripe / Revolut Business | Procesare plăți | UE/SEE și SUA | SUA: Clauze Contractuale Standard, Decizia (UE) 2021/914; EU-US Data Privacy Framework acolo unde furnizorul este certificat |
| Meta Platforms (WhatsApp Business API) | Notificări WhatsApp | SUA | Clauze Contractuale Standard, Decizia (UE) 2021/914; EU-US Data Privacy Framework acolo unde Meta este certificată |
| Furnizori AI (ex: Google Gemini, Anthropic, Groq) | Prelucrare automatizată în cadrul serviciului | UE/SEE și SUA | SUA: Clauze Contractuale Standard, Decizia (UE) 2021/914; EU-US Data Privacy Framework acolo unde furnizorul este certificat |
| Serviciu e-mail tranzacțional | Trimitere e-mailuri de sistem | UE/SEE și, după caz, SUA | SUA: Clauze Contractuale Standard, Decizia (UE) 2021/914; EU-US Data Privacy Framework acolo unde furnizorul este certificat |

Toți procesatorii sunt obligați contractual să respecte GDPR prin Acorduri de Prelucrare a Datelor (DPA).

### 5.2 Autorități publice

Partajăm date cu autorități publice exclusiv când avem obligație legală (ex: ANAF, instanțe judecătorești), în limita strictă a cererii.

### 5.3 Alți operatori din ecosistemul 4PRO

Dacă folosești mai multe aplicații din ecosistemul 4PRO (ex: 4PRO Client, 4PRO Pro), datele de cont pot fi partajate prin mecanismul SSO pentru autentificare unificată. Fiecare aplicație operează propriile funcționalități în calitate de **operator distinct**.

Acolo unde două sau mai multe aplicații stabilesc împreună scopurile și mijloacele unei prelucrări, acestea acționează ca **operatori asociați** în sensul Art. 26 GDPR. În acest caz, esența acordului dintre operatorii asociați (repartizarea responsabilităților privind îndeplinirea obligațiilor GDPR, în special exercitarea drepturilor tale, și **un punct unic de contact** pentru exercitarea drepturilor) îți este pusă la dispoziție, iar îți poți exercita drepturile față de oricare dintre operatorii asociați.

**Nu vindem datele tale personale.**

## 6. Transferuri internaționale de date

Operatorul tău de date este o entitate stabilită în România/UE; nu există un transfer internațional la nivelul operatorului. Anumiți destinatari și subîmputerniciți (procesatori) prelucrează însă date în afara Spațiului Economic European (SEE) — în special furnizorii de IA și de comunicații menționați mai jos. Garantăm că aceste transferuri se efectuează exclusiv pe baza unui mecanism legal valid conform Art. 46 GDPR:

- **Stripe / Revolut Business** (procesare plăți, SUA) — **Clauze Contractuale Standard**, Decizia (UE) 2021/914, completate de **EU-US Data Privacy Framework** acolo unde furnizorul este certificat;
- **Meta Platforms / WhatsApp** (notificări, SUA) — **Clauze Contractuale Standard**, Decizia (UE) 2021/914, completate de **EU-US Data Privacy Framework** acolo unde Meta este certificată;
- **Furnizori AI** — ex. Google Gemini, Anthropic, Groq (SUA) — **Clauze Contractuale Standard**, Decizia (UE) 2021/914, completate de **EU-US Data Privacy Framework** acolo unde furnizorul este certificat;
- **Serviciu e-mail tranzacțional / hosting** — acolo unde implică prelucrare în afara SEE — **Clauze Contractuale Standard**, Decizia (UE) 2021/914, sau decizie de adecvare a Comisiei Europene.

Pentru destinatarii din țări cu **decizie de adecvare** a Comisiei Europene, transferul se bazează pe respectiva decizie de adecvare. Poți solicita o copie a garanțiilor aplicabile contactând DPO-ul la **{entity_dpo_email}**.

## 7. Perioadele de retenție

| Categorie de date | Perioadă de retenție |
|---|---|
| Date de cont (activ) | Pe durata contului activ + 90 de zile după ștergere |
| Log-uri de acces și securitate | 12 luni |
| Date de tranzacție și facturare | 10 ani (obligație legală — legislația fiscală) |
| Comunicări cu DPO | 5 ani (apărarea drepturilor legale) |
| Date de marketing (cu consimțământ) | Până la retragerea consimțământului |
| Conturi inactive | 24 luni inactivitate → notificare → 30 de zile → ștergere |

La expirarea perioadei de retenție, datele sunt șterse definitiv sau anonimizate ireversibil.

## 8. Drepturile tale conform GDPR

Conform GDPR, ai următoarele drepturi, pe care le poți exercita contactând **{entity_dpo_email}**:

**Dreptul de acces (Art. 15)**: Poți solicita o copie a datelor tale personale pe care le prelucrăm și informații despre modul de prelucrare.

**Dreptul la rectificare (Art. 16)**: Poți solicita corectarea datelor inexacte sau completarea celor incomplete.

**Dreptul la ștergere — „dreptul de a fi uitat" (Art. 17)**: Poți solicita ștergerea datelor tale atunci când: scopul prelucrării a încetat, ți-ai retras consimțământul, ai obiectat la prelucrare și nu există motive legitime prevalente, prelucrarea a fost ilegală, sau există o obligație legală de ștergere. Excepții: date necesare pentru obligații legale sau apărarea drepturilor în instanță.

**Dreptul la restricționarea prelucrării (Art. 18)**: Poți solicita restricționarea prelucrării în anumite situații (de ex. contestarea exactității datelor).

**Dreptul la portabilitate (Art. 20)**: Poți primi datele furnizate de tine în format structurat, utilizat în mod curent, citibil automat (JSON/CSV), și le poți transmite altui operator, atunci când prelucrarea se bazează pe consimțământ sau contract și este efectuată prin mijloace automatizate.

**Dreptul la opoziție (Art. 21)**: Poți obiecta oricând la prelucrarea bazată pe interese legitime. Vom înceta prelucrarea dacă nu demonstrăm motive legitime imperative care prevalează. Ai dreptul necondiționat de opoziție la prelucrarea în scopuri de marketing direct.

**Dreptul de a retrage consimțământul (Art. 7(3))**: Consimțământul poate fi retras oricând, la fel de ușor cum a fost acordat, fără a afecta legalitatea prelucrării anterioare. Retragerea se poate face din Setări → Contul meu sau contactând DPO-ul.

**Dreptul de a nu face obiectul unei decizii automate (Art. 22)**: Nu aplicăm decizii automate cu efect juridic semnificativ bazate exclusiv pe prelucrare automatizată fără implicare umană. Recomandările IA sunt **consultative** și nu produc efecte juridice.

**Timp de răspuns**: Îți vom răspunde la cerere în termen de **30 de zile calendaristice** de la primire. Termenul poate fi prelungit cu 60 de zile în cazuri complexe, cu notificarea ta prealabilă.

## 9. Securitatea datelor

Implementăm măsuri tehnice și organizatorice adecvate pentru protejarea datelor tale:

- **Transmisie criptată**: toate comunicațiile utilizează TLS 1.2+;
- **Stocare securizată**: parolele sunt stocate hash cu bcrypt (cost factor ≥ 12); datele sensibile sunt criptate în repaus;
- **Acces limitat**: principiul necesității de cunoaștere (need-to-know) pentru angajați și contractori;
- **Monitorizare**: log-uri de acces și sisteme de detectare a intruziunilor;
- **Proceduri de notificare a breșelor**: în caz de incident care afectează drepturile tale, te notificăm în termen de 72 de ore de la descoperire (sau imediat ce este posibil), conform Art. 33-34 GDPR.

## 10. Cookie-uri

Utilizăm cookie-uri conform [Politicii de Cookie-uri](/ro/cookies/{app_slug}), care face parte integrantă din prezenta Politică de Confidențialitate.

## 11. Copii și minori

eTutor este construit pentru elevi, iar materiile sale principale, Matematică și Română pentru clasa a VIII-a, pregătesc un examen susținut la 14 ani. Prelucrăm așadar, cu bună știință, date personale ale minorilor: acesta este scopul serviciului, nu un accident. O spunem explicit pentru că afirmația contrară, obișnuită în politicile de confidențialitate, ar fi falsă în cazul nostru.

Temeiul prelucrării depinde de vârstă. Pentru elevii sub 16 ani, consimțământul este dat sau autorizat de titularul răspunderii părintești, potrivit art. 8 GDPR și Legii nr. 190/2018, iar contul este deschis de părinte; o parte din prelucrare este, în plus, necesară pentru executarea contractului încheiat de părinte în beneficiul copilului. De la 16 ani, elevul își poate da singur consimțământul. Indiferent de vârstă, prelucrăm un minim de date pentru securitatea contului și pentru îndeplinirea obligațiilor noastre legale.

Colectăm despre un elev doar ce este necesar pentru pregătire: numele, adresa de e-mail, materiile alese, răspunsurile la exerciții, scorurile, sesiunile de studiu, progresul și preferințele de notificare. Nu cerem CNP, adresă de domiciliu, date biometrice sau date privind sănătatea. Analizăm răspunsurile pentru a adapta exercițiile la nivelul elevului: este o personalizare pedagogică, nu o decizie automată care să producă efecte juridice sau efecte similare semnificative în sensul art. 22 GDPR, iar rezultatele rămân orientative, la aprecierea profesorului și a părintelui. Nu facem publicitate comportamentală către minori și nu vindem și nu punem la dispoziția terților datele elevilor în scopuri de marketing.

Drepturile descrise în această politică, adică accesul, rectificarea, ștergerea, restricționarea, portabilitatea, opoziția și retragerea consimțământului, se exercită pentru elevii sub 16 ani de către părinte sau reprezentantul legal; la cerere, explicăm și copilului, pe înțelesul lui, ce date deținem despre el. Retragerea consimțământului nu afectează legalitatea prelucrării efectuate anterior. Dacă ești părinte și constați că un copil al tău și-a creat cont fără acordul tău, scrie-ne la **{entity_dpo_email}**: verificăm situația și, la alegerea ta, îți dăm control asupra contului sau ștergem datele.

## 12. Modificări ale politicii

Această Politică poate fi actualizată periodic. Modificările semnificative vor fi comunicate prin banner în aplicație și/sau e-mail cu minimum **14 zile** înainte de intrarea în vigoare. Data ultimei actualizări este indicată în antetul documentului.

Continuarea utilizării Serviciului după intrarea în vigoare a modificărilor constituie acceptarea noii Politici.

## 13. Dreptul de a depune plângere la autoritatea de supraveghere

Dacă consideri că datele tale sunt prelucrate cu încălcarea GDPR, ai dreptul de a depune plângere la autoritatea de supraveghere competentă:

**România — ANSPDCP (Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal)**
Bd. G-ral. Gheorghe Magheru, nr. 28-30, Sector 1, București, Cod poștal 010336
Telefon: +40.318.059.211
E-mail: anspdcp@dataprotection.ro
Web: https://www.dataprotection.ro

Ai și dreptul de a contacta autoritatea de supraveghere din statul UE în care îți ai reședința obișnuită, locul de muncă sau locul presupusei încălcări.

Exercitarea acestui drept nu aduce atingere dreptului tău de a recurge la căi de atac judiciare.

## Contact

**{entity_name}**
{entity_address}
**E-mail DPO**: {entity_dpo_email}

---

*Versiune {version} · În vigoare din {effective_date}*
