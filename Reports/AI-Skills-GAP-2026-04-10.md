# AI Skills GAP Analysis — Tutor
**Data**: 2026-04-10
**Proiect**: Tutor (Educational AI-Powered Learning Platform)
**Stack**: Next.js 15, TypeScript, React 19, Tailwind, PostgreSQL (Neon), Prisma, NextAuth v5
**Deploy**: VPS2 (72.62.155.74), PM2, tutor.knowbest.ro
**Modele DB**: 40+, 86 API endpoints, 263 fișiere TS, 103 unit tests

---

## 1. AI Skills Existente

| Skill | Status | Detalii |
|-------|--------|---------|
| AI question generation | DA — ACTIV | `src/lib/ai-tutor.ts` — Claude default, Gemini+Mistral fallback |
| AI Router integration | DA — ACTIV | via ai-router, JSON mode |
| AI admin UI | DA | `components/admin/ai-generate-form.tsx` — formular generare |
| DRAFT workflow | DA | AI content → DRAFT → review manual → APPROVED |
| CLAUDE.md | DA | Prezent |
| SM-2 spaced repetition | DA (non-AI) | Algoritm adaptiv, 6 tipuri sesiuni |
| Predictive analytics | DA (rule-based) | Failure risk scoring, dar fără ML |

**Total AI skills existente: 4/10**

---

## 2. AI Skills Necesare

| # | Skill AI | Prioritate | Complexitate | Impact |
|---|----------|-----------|--------------|--------|
| 1 | AI answer grading (open questions) | **CRITICĂ** | Medie | +30% acuratețe vs regex |
| 2 | Dynamic feedback generation | **CRITICĂ** | Mică | Feedback personalizat per răspuns |
| 3 | Conversational tutor (chatbot) | **ÎNALTĂ** | Medie | 24/7 on-demand help |
| 4 | Intelligent session recommendation | **ÎNALTĂ** | Medie | Predicție next-best session type |
| 5 | Lesson content generation | MEDIE | Medie | -80% timp creare conținut |
| 6 | Exam difficulty auto-calibration | MEDIE | Medie | Fairness bazat pe performanță |
| 7 | AI question review (auto-validation) | MEDIE | Mică | Faster admin review |
| 8 | Misconception detection | OPȚIONAL | Mare | Previne knowledge gaps |
| 9 | Learning path optimization (ML) | OPȚIONAL | Mare | Spacing intervals personalizate |

---

## 3. GAP Analysis

### GAP-uri CRITICE

| # | Gap | Ce lipsește | Efort estimat |
|---|-----|------------|---------------|
| G1 | Answer grading AI | `answer-checker.ts` e regex-based — trebuie Claude semantic matching | 3-4h |
| G2 | Dynamic feedback | Feedback static din DB — trebuie generat contextual | 2-3h |

### GAP-uri HIGH VALUE

| # | Gap | Beneficiu | Efort estimat |
|---|-----|----------|---------------|
| G3 | Conversational tutor | Chatbot contextual pe lecție/topic | 6-8h |
| G4 | Smart session type | AI alege repair/intensive/deep bazat pe trajectory | 3-4h |
| G5 | Lesson generation | Auto-creare lecții din weak areas | 4-5h |
| G6 | Question auto-review | Validare automată calitate questions AI-generated | 2-3h |

### GAP-uri de COMPLETARE

| # | Gap | Ce lipsește |
|---|-----|------------|
| G7 | Stripe integration | SECRET_KEY gol — monetizare incompletă |
| G8 | Google OAuth | Env vars not set pe VPS |
| G9 | Email magic links | Resend API neconfig |

---

## 4. Recomandări

### Acțiuni imediate (WG fix):
1. **AI answer grading** — înlocuiește regex cu Claude semantic matching în `answer-checker.ts`
2. **Dynamic feedback** — generare feedback contextual la fiecare răspuns greșit

### Acțiuni viitoare:
1. G1 — Answer grading (3-4h, impact imediat pe calitatea învățării)
2. G2 — Dynamic feedback (2-3h, personalizare)
3. G6 — Question auto-review (2-3h, eficiență admin)
4. G4 — Smart session (3-4h, adaptivitate)
5. G3 — Conversational tutor (6-8h, diferențiator major)

---

## 5. Scor AI Readiness

| Criteriu | Scor | Max |
|----------|------|-----|
| CLAUDE.md prezent | 2 | 2 |
| AI Router integrat | 2 | 2 |
| AI features implementate | 1 | 3 |
| Teste pentru AI features | 0.5 | 2 |
| Documentație AI usage | 0.5 | 1 |
| **TOTAL** | **6/10** | 10 |

**Verdict**: Platformă EdTech matură (40+ modele, 103 teste, CI/CD, SM-2 algorithm) cu o singură AI feature (question generation). Gap-urile critice sunt AI grading și dynamic feedback — ar transforma radical calitatea învățării. Infrastructura (ai-router, Prisma, API routes) e gata pentru expansiune AI.
