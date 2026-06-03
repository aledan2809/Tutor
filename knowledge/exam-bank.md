# Exam-Bank tier — official exam papers (ground-truth)

## Changelog
- [2026-06-04] v0.5: **Series-2 Mate import — 10 papers**. Toate cele 10 perechi noi din `pro-matematica` importate + LIVE + verificate autentificat (commits `bbc82ff`→`254f214`): 2025 {Simulare, Examen-07, Model, Rezerva-02, Sesiune-Specială-03}, 2026 {Simulare}, 2024 {Examen-07, Model, Rezerva-02, Simulare}. Per pereche: 18 itemi (90+10 oficiu) + 9-11 figuri (PyMuPDF clip-rect, vision-verified montaj) + chei/barem ground-truth + figureUrl + finalAnswer. Prod totals: ExamPaper=12, ExamItem=216. Importere `scripts/import-exam-mate-<year>-<variant>.mjs` (figureUrl+finalAnswer baked în createMany). Figure tooling `scripts/exam-figures/{fig_inspect,extract}.py`. **Playbook repetabil `exam-bank-import-playbook.md`** (9-step per-pair flow). Deploy gotcha: figurile servite de `next start` dau 502 tranzitoriu în fereastra de boot post-`pm2 restart` → verifică după ~6s settle.
- [2026-06-03] v0.4: Slice 4 — **persistență + diferențiere + rezultat-final**. Model `ExamAttempt` (migrare `0018`, userId/paperId ca stringuri fără FK) — ruta de scoring salvează încercarea (`status: submitted`), `PATCH /api/exam-bank/attempt/[id]` recalculează cu self-scores → `finalized`. Diferențiere clară grilă (auto) vs rezolvare/compunere (manuală) + notă **split onest** (grile auto vs rezolvări notate de tine). `ExamItem.finalAnswer` + „rezultat final" tastat la 2 itemi Mate (III.1=14, III.5=90) → auto-check ieftin (gratuit), pre-sugerează self-score maxim (editabil, marcat „scade dacă rezolvarea n-a fost completă"). Fundație pentru verificarea AI (slice 5) + meditator (slice 6). `/code-review`: fix `saved` re-enable + norm comma/°/minus + hint over-scoring.
- [2026-06-03] v0.3: Slice 3 — figuri + ecran elev. (a) Figuri: `ExamItem.figureUrl` (migrare `0017`), 11 figuri Matematică extrase din PDF cu PyMuPDF clip-rect (4uPDF folosește același fitz dar doar pagini întregi → extras direct local) în `public/exam-figures/`, atașate via `scripts/set-exam-figure-urls.mjs`, afișate în admin. (b) Ecran elev `/dashboard/exam-bank` (listă + `[paperId]` take) — itemi **sanitizați fără chei** (`sanitize.ts`), `<ExamBankTake>` (grilă/adevărat-fals/figură/deschis), `POST /api/exam-bank/[paperId]/score` corectează obiectivele server-side + dezvăluie baremul; rezultate cu notă/10 + recalcul live + auto-notare itemi deschiși. Sidebar „Simulări" (RO). **Stateless** (fără persistența încercării — slice 4).
- [2026-06-03] v0.2: Slice 2 — barem scoring engine (`src/lib/exam-bank/score.ts`: `scoreExamPaper` + `classifyPaperPoints`, pur + 11/11 smoke) + admin read-only browser (`/dashboard/admin/exam-bank` listă + `[paperId]` detaliu, RO, nav link „Bancă examene"). Engine: obiective (MCQ/TF_GRID) auto-gradate; deschise = self-score; notă /10 + extrapolare „estimare" pe subset. NU e încă legat de un ecran de elev (slice 3, după figuri).
- [2026-06-03] v0.1: Slice 1 — schema (ExamPaper/ExamPassage/ExamItem) + migration 0016 + import of EN VIII 2026 Model (Matematică + Limba și literatura română).

## Why a separate tier (not the `Question` MCQ bank)
The generated grile live in `Question` (status DRAFT/PUBLISHED, screened by the content-quality mesh, ≥97% confidence). The exam-bank is a **different kind of content**: official exam papers with **100% ground-truth** answers from the published barem — no generation, no mesh gate. Official papers also need structure the `Question` model can't carry:
- **sections** (Subiectul I / al II-lea / al III-lea, plus I.A / I.B for Romanian),
- **per-item barem points** + **sub-points** (e.g. `a) 2p`, `b) 3p`),
- **open-ended** items graded by rubric (not a single correct answer),
- **reading passages** shared by several items (Romanian),
- **figure-dependent** items (geometry) that aren't fully renderable as text yet.

The current exam simulator (`ExamSimulation` + `scoreExam` in `src/lib/exam-engine.ts`) is a *format template* that assembles `Question` rows scored by simple correct-count — it does NOT model barem/sections/sub-points, so the exam-bank gets its own models.

**Isolation guarantee:** the public `/try` demo + practice (`src/app/api/public/practice/{quiz,subjects}/route.ts`) read **only** the `Question` table (`status:PUBLISHED, type:MULTIPLE_CHOICE`). Exam-bank rows live in separate tables → they never leak into the demo.

## Models (`prisma/schema.prisma`, migration `0016_exam_bank`)
- **ExamPaper** — one official paper. Unique by `(examType, year, subjectKey, variant)`. `maxScore` 100, `officeBonus` 10 (puncte din oficiu), `timeLimit` 120. Optional `domainId` for a future "Capacitate" consolidation link.
- **ExamPassage** — reading texts (Romanian: Textul 1/2), referenced by items via `passageRef`.
- **ExamItem** — one exam item. `type ∈ {MCQ, TF_GRID, SHORT, FILL, OPEN}`, `points` from barem, `options` (MCQ, `[{key,text}]`), `correctAnswer` (objective items; null for OPEN), `rubric` (sub-points `[{label,points,answer}]`), `hasFigure` + `figureNote` (description only — we never fabricate the image), `autoGradable` (true only for objective, single-answer, figure-free items). `passageRef` links to `ExamPassage.ref`; for cross-text items (Romanian A.5/A.7) it is a **comma-separated list** (`"Textul 1, Textul 2"`) — consumers must split on `","`.

## First material — EN VIII 2026 Model (edu.ro public)
Source PDFs (subiect + barem) from the official Ministerul Educației / CNCE model variants. Transcribed verbatim; answer keys from the official barem.
- **Matematică** — 18 items: Subiectul I (6 MCQ ×5p), al II-lea (6 MCQ ×5p, all figure-dependent), al III-lea (6 open ×5p, sub-points a/b). autoGradable = 5 (Subiectul I items 1–5; item 6 + all of II are figure-dependent; III is open).
- **Limba și literatura română** — 2 passages (Dansul ursului – Ion D. Sîrbu; interviu Ioana Pârvulescu) + 18 items: I.A (9), I.B (8), Subiectul al II-lea (compunere, 20p). autoGradable = 8 (A2/A3/A4/A5 + B1/B2/B3/B4).
- Both: item points sum to 90 + 10 oficiu = 100.

Import: `node scripts/import-exam-en-viii-2026.mjs [--validate|--dry]` (idempotent — upsert paper by unique key, then replace items/passages). `--validate` runs offline (no DB).

## Deferred (next slices)
- **Figure extraction** — geometry/diagram images for `hasFigure` items (currently description-only `figureNote`).
- **Scoring on barem** — barem-aware scorer (objective auto + open self/compare-to-rubric), raw score → extrapolated 1–10 note (marked "estimare").
- **Mix engine** — assemble a custom test from items across papers/years, preserving each item's barem.
- **Error-pattern tagging** — per-item topic/competency → recurring-mistake detection + deep-link.
- **More material** — pro-matematica.ro (2017→2026, math) + the official subiecte/variante links (see `TODO_PERSISTENT.md` 🏆 item).
- **UI** — student exam-bank view + admin browse/manage (`/dashboard/admin/exam-bank/*`).
