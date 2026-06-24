# 00 — SUMMARY (pe limbaj simplu) — Tutor

**Data:** 2026-06-20 · **Proiect:** Tutor / etutor.ro · **Tip:** introspecție read-only (analiză, zero modificări de cod; orice fix așteaptă review-ul tău)
**Rapoarte detaliate:** `01` (strategie vs. cod) · `02` (ghid pe pagini) · `03` (deep research / WOW) · `04` (audit funcțional/UX/SEO/a11y) · `04b` (securitate)

---

## ✅ Verdict (în 5 rânduri)

Tutor e un **produs mai matur decât crede propria strategie**. Ai deja un motor de învățare adaptivă, un strat viral complet, un sistem de retenție pe 6 trepte și **conținut BAC/Evaluare Națională real** (281 grile Matematică + 47 simulări + 75 grile Română, verificate manual). Tehnic stai excelent: **viteză 100/100, mobil 100/100, securitate 95/100**. Ce te ține pe loc nu sunt funcții lipsă de inventat, ci **câteva „țevi nelegate"**: legătura părinte↔copil (vândută dar neconstruită + cu scurgere de date pe minori), motorul de retenție construit dar **oprit**, și conformitatea GDPR/cookie-uri pe un public de minori. **Nu se taie nimic — se conectează ce există.**

---

## 📈 Cât de avansată e platforma

**Foarte avansată pe motor + achiziție; incompletă pe „infrastructura de business" + relații de familie.**

- **84 pagini, 122 rute API, 55 modele de date, ~40 module de logică.** Nu e un MVP — e o platformă bogată.
- **Peste medie față de concurență** pe gamification (XP/streak/leaderboard/achievements LIVE) și **unică** pe localizare RO (BAC/EN cu bareme oficiale — niciun lider global nu face asta).
- **Sub medie** pe: payout către promotori (lipsește), facturare RO/SmartBill (lipsește), marketplace de meditatori (lipsește), AI tutor pentru elev (doar stub admin).
- **Construit dar OPRIT:** motorul de escaladare/retenție (un comutator pe `false` + „ceasul" de 15 min neprogramat pe server).

---

## 💸 Ce te costă cel mai mult (top 3)

1. **Motorul de retenție e în garaj (dormant).** Ai cumpărat o mașină scumpă care readuce elevii la învățat și o ții oprită. Activarea controlată = **cel mai ieftin câștig mare disponibil** (reactivarea costă -60-70% vs. achiziție nouă — `03`).
2. **Vinzi planuri Family/Duo/Trio fără mecanica de bază** (legătura părinte↔copil). Pe lângă funcția lipsă, e și o **scurgere de date despre minori** (vezi Securitate). Blochează scalarea planurilor de familie + risc legal.
3. **Trust slab pe homepage (40/100) + GDPR (20/100).** Părinți gata să plătească pleacă pentru că lipsesc contact/About/testimoniale, iar tracking-ul fără banner de cookie-uri pe minori e risc de amendă.

---

## 🔐 Securitate (pe scurt)

**Fundamente solide, o problemă gravă de intimitate pe minori.**

- **3 critice/high:** (1) 🔴 **Watcher leak** — un părinte vede TOȚI elevii de la o materie, nu doar copilul lui (date despre minori expuse, inclusiv emailuri); (2) 🔴 GDPR — Google Analytics fără consimțământ pe public de minori; (3) 🔴 dependența `next` cu CVE critic (bypass de middleware).
- **4 medium:** dependențe vulnerabile (nodemailer/xmldom/postcss/next-intl) · CSP cu `unsafe-inline/unsafe-eval` · rutele `[domain]/*` nu verifică înscrierea · privacy nedescoperit din homepage.
- **3 low/info:** email placeholder · `escalation/ack` intenționat neautentificat (risc neglijabil) · cron acoperit de secret.
- **Bine:** parole criptate, zero SQL raw periculos, zero XSS exploatabil, HSTS/CSP/X-Frame complete, rate-limiting (20/min pe login), webhook-uri fail-closed, autorizare corectă pe `admin/*` + `instructor/*`.

➡️ Detalii complete + propuneri: `04b-security-audit.md`.

---

## ✨ Efect WOW (din `03` — idei pe ce ai deja)

- **WOW-1:** „Cardul de progres săptămânal" partajabil al copilului, pentru părinte („Maria a urcat de la 6 la 8, streak 12 zile") — refolosește `/api/og/score` → buclă virală nouă + mândria părintelui.
- **WOW-4:** „Adu-ți clasa în 2 minute" — meditatorul generează un cod de grup, îl trimite pe WhatsApp, 10 elevi intră instant (K-factor exploziv). Refolosește `Group`/`GroupMember` + bucla de referral.
- **WOW-2/3:** „Modul examen real" cu numărătoare inversă până la BAC + „garanția de progres" (predicție de notă live — motorul predictiv există deja pe instructor).

---

## 🧩 Matrice cerut-vs-livrat (esențial)

| Promis (strategie / vândut public) | În cod azi | Stare |
|---|---|---|
| Învățare adaptivă + simulări examen | LIVE | ✅ |
| Strat viral (quiz public, duel, card scor, referral) | LIVE | ✅ |
| Escaladare retenție 6 trepte + Telegram gratuit | Construit | ⚠️ **dormant (oprit)** |
| Conținut BAC/EN real (Mate M1/M2/M3 + Română) | LIVE | ✅ |
| **Family Pack — legătură Părinte→Copil** | **Lipsește** | 🔴 **vândut, neconstruit** |
| **Watcher vede DOAR copilul lui** | **Filtrare pe domeniu** | 🔴 **scurgere date minori** |
| Payout comisioane (promotori/creatori) | Se acumulează, nu se plătește | 🔴 lipsă Stripe Connect |
| Facturare RO automată (SmartBill) | Lipsește | 🔴 |
| Marketplace meditatori (profil/booking/reviews) | Lipsește | 🔴 |
| AI tutor / scanner temă pentru elev | Doar stub admin | 🔴 |
| Banner cookie + GDPR pe minori | Lipsește banner | 🔴 risc legal |
| Viteză / mobil / securitate tehnică | 100 / 100 / 95 | ✅ |

---

## 🛠️ Ordine de fix — PROPUNERI (așteaptă review-ul tău)

> Nimic nu s-a aplicat. Aceasta e ordinea recomandată; tu decizi ce și când.

1. **🔴 Watcher leak (date minori)** — model `Guardian`/`FamilyGroup` + restrânge vederea watcher-ului la proprii copii. *Securitate + deblochează planurile de familie deja vândute.* (`04b` A1/E3, `01` P0-1/P0-2)
2. **🔴 GDPR/cookie consent pe minori** — banner care blochează GA până la accept (folosind Legal Hub existent). *Risc de amendă cât timp e neacoperit.* (`04b` E1, `04` GDPR)
3. **🟠 Pornire controlată a motorului de retenție** — activează comutatorul + programează cron-ul de 15 min cu grijă (fără furtună retroactivă pe elevi reali). *Cel mai ieftin câștig mare.* (`01` P0-3, `03`)
4. **🔴 Upgrade `next` (CVE critic) + `npm audit fix`** — cu testare build/auth. (`04b` D1/D2)
5. **🟠 Trust pe homepage** — contact vizibil + pagină About + testimoniale; H1 în română; link Privacy/Terms în footer. (`04` Trust, `04b` E2)
6. **🟠 Întăriri** — CSP fără `unsafe-inline/eval`; `requireDomainAccess` pe `[domain]/*`; date structurate schema.org; skip-link + navigare tastatură. (`04`, `04b` C3/A2)
7. **🟡 Bani în ambele sensuri** — Stripe Connect/payout + facturare SmartBill (deblochează plata promotorilor/creatorilor). (`01` P1)

---

## 👤 Ce ai TU de făcut (acțiuni care cer decizia/mâna ta)

1. **Aprobi designul legăturii părinte↔copil** (`Guardian`/`FamilyGroup`)? Schimbare de schemă + migrare DB — cere undă verde înainte de implementare.
2. **Decizie GDPR pe minori:** folosim Legal Hub existent pentru banner/consent? Posibil aviz juridic dat fiind publicul minor.
3. **Aprobi fereastra de upgrade Next.js** (CVE critic) + testare? Pot exista breaking changes.
4. **Aprobi `npm audit fix`** pentru dependențele non-breaking (nodemailer/xmldom/postcss/next-intl)?
5. **Activarea motorului de retenție:** confirmi că pornim cron-ul + comutatorul, cu fereastră mărginită ca să nu trimită mesaje pe spate la elevi reali? (necesită cont de test + verificare TWG)
6. **Conținut de trust:** îmi dai datele reale (telefon/email/adresă de contact, povestea „Despre noi", 2-3 testimoniale) ca să le pot propune în footer/homepage?
7. **Curățenie minoră:** confirmi ce email real pun în loc de placeholder-ul `you@example.com`?

---

**Pe scurt:** ai un produs **matur și rapid**, cu un fundament de securitate bun. Cele 3 lucruri care contează acum — etanșarea scurgerii de date pe minori, conformitatea GDPR pe minori și pornirea motorului de retenție — **nu sunt construcție, sunt conectare + finisare.** Toate fix-urile sunt propuneri; **niciuna nu s-a aplicat.**
