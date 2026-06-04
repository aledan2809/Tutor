# Exam-Bank Import Playbook — repeatable per-paper process

> Written 2026-06-04 while importing series 2 Matematică (10 new pairs). This is the
> canonical, repeatable recipe — follow it identically for every new exam paper.
> Companion: `knowledge/exam-bank.md` (feature changelog + rationale).

## 0. Ground rules (do NOT skip)
- **All exam-bank text is Romanian only** (student-facing + admin).
- **No "AI" word visible to the student** anywhere on exam-bank screens.
- **Answer keys are GROUND-TRUTH** — transcribed verbatim from the official barem PDF.
  Never invent a key, never paraphrase a rubric point. If the barem is ambiguous, flag it.
- **Rights**: the user confirmed everything they upload is official/public (edu.ro, CNCE,
  pro-matematica). `license = "edu.ro public (Ministerul Educației și Cercetării / CNCE)"`.
- **Honest reporting** (memory `feedback_honest_reporting_no_overstating`): "imported" ≠
  "verified live". Each pair is done only after authenticated HTML verify on etutor.ro.
- **Real E2E** (memory `feedback_real_e2e_not_synthetic`): re-run the actual student take
  flow logged-in, not a synthetic curl.

## 1. Data model (prisma/schema.prisma lines ~1019-1109)
- **ExamPaper** — one paper. Unique `(examType, year, subjectKey, variant)`.
  Fields: `source, examType, year, subjectKey ("matematica"|"limba_romana"), subjectName,
  grade(8), variant, maxScore(100), officeBonus(10), timeLimit(120), language("ro"),
  sourceUrl?, license?, isActive(true)`. Relations: `items[]`, `passages[]`.
- **ExamPassage** — reading text (Română only). `ref ("Textul 1"), title?, author?,
  sourceNote?, body, orderIndex`. Items link via `passageRef` (comma-separated for
  cross-text items, split on ",").
- **ExamItem** — one item.
  - `section` ("Subiectul I" / "Subiectul al II-lea" / "Subiectul al III-lea"; Română adds I.A/I.B)
  - `label` ("1", "A.2", "III.4"), `orderIndex`, `points`
  - `type ∈ { MCQ, TF_GRID, SHORT, FILL, OPEN }`
  - `content` (full question text, math notation inline)
  - `options` Json `[{key:"a",text:"17"}, ...]` (MCQ only)
  - `correctAnswer` (MCQ/SHORT/TF_GRID; null for OPEN)
  - `rubric` Json `[{label:"a)", points:2, answer:"..."}]` (open items, sub-points)
  - `hasFigure` + `figureNote` (description only — never fabricate the image)
  - `figureUrl` (set in figure step), `finalAnswer` (clean numeric result, set in final-answer step)
  - `autoGradable` = **true ONLY if** objective (MCQ/TF_GRID) AND `!hasFigure`
  - `topic?` (e.g. "Ordinea operațiilor")
- **ExamAttempt** (slice 4) — `userId, paperId` (strings, no FK), `objectiveAnswers Json,
  selfScores Json?, rawPoints, note10, isEstimate, status ("submitted"|"finalized")`.

### EN VIII Matematică canonical shape (every Mate paper follows this)
- **Subiectul I**: 6 × MCQ ×5p. Items 1–5 usually figure-free → `autoGradable:true`.
  Some papers have a chart/diagram on one item (e.g. 2026 Model item 6) → `hasFigure:true`.
- **Subiectul al II-lea**: 6 × MCQ ×5p — **all figure-dependent** (geometry) →
  `hasFigure:true`, `autoGradable:false`.
- **Subiectul al III-lea**: 6 × OPEN ×5p — sub-points a/b/c, graded by `rubric` →
  `type:"OPEN"`, `autoGradable:false`. Several have figures (graphs/3D).
- Item points sum to **90** + **10** oficiu = **100**. `timeLimit` 120.

## 2. Per-pair workflow (9 steps)
For each (Subiect PDF, Barem PDF) pair:

1. **Read both PDFs** — `Read` tool on the subiect + barem PDFs in
   `~/Downloads/Temp/tutor eval nat/pro-matematica/`. Transcribe every item verbatim
   (content, options, points) from the subiect; extract every key + sub-point from the barem.
2. **Create the import script** — copy the slice-1 template
   `scripts/import-exam-en-viii-2026.mjs` → `scripts/import-exam-mate-<year>-<variant>.mjs`.
   Replace the `MATH` object with this paper's metadata + items. Drop the `RO` object for
   Mate-only papers. Keep the idempotent upsert logic (upsert paper by unique key → delete
   existing items/passages → recreate). Variant slugs: `model`, `simulare`, `examen` (or
   `examen-07`), `rezerva` (or `rezerva-02`), `sesiune-speciala` (or `sesiune-speciala-03`).
   `examType` stays `EN_VIII`. `source` e.g. `"EN VIII 2025 Simulare (edu.ro)"`.
3. **Validate offline** — `node scripts/import-exam-mate-<year>-<variant>.mjs --validate`
   (required fields, unique labels, MCQ options+keys present, points sum to 90).
4. **Dry run** — `node scripts/...mjs --dry` (connects DB, reports upsert + counts, no writes).
   **Use the prod DB** (127.0.0.1:5432/tutor on VPS2) when importing for live — local PG is
   separate. For local work, local DATABASE_URL. Confirm which DB before applying.
5. **Apply** — `node scripts/...mjs` (idempotent; safe to re-run).
6. **Extract figures** — for every `hasFigure` item, render the region to a PNG in
   `public/exam-figures/`. **Two interchangeable methods** (identical fitz `get_pixmap(clip,zoom)` math):
   - **(a) 4uPDF backend `/api/extract-region`** (preferred when validating 4uPDF — it's the deployed
     Pro hi-DPI region render). Locate the bbox with `fig_inspect.py` (raster IMG xref), convert to
     page fractions `(fx0,fy0,fx1,fy1)=(x0/W, y0/H, x1/W, y1/H)` (A4 W=595 H=842, top-left origin),
     POST multipart `file,page,fx0..fy1,dpi` with a Bearer token from a **silver/gold/custom** user
     (the `smart_tools` gate). Run the backend locally (venv + stub `rapidocr_onnxruntime`; register a
     user via `/api/auth/register` then flip `plan='custom'` in `data/4updf.db`) or hit prod with a Pro
     account. Returns the clipped PNG. Verified 2026-06-04 on Test_03 (9/9 @ 300 DPI).
   - **(b) local PyMuPDF/fitz** — `page.get_pixmap(clip=rect, matrix=fitz.Matrix(zoom,zoom))`. No auth,
     no backend; fallback when 4uPDF is unavailable.

   **Naming convention (series 2 — include variant to avoid
   collisions):** `en-viii-<year>-mate-<variant>-<section-abbr>-<label>.png`
   (section-abbr: s1/s2/s3). E.g. `en-viii-2025-mate-simulare-s2-1.png`.
   **Verify** the clips with a montage-grid image (all figures in one PNG) before wiring —
   a wrong clip rect is the #1 silent error.
7. **Wire figureUrl** — add this paper's (section,label)→file MAP to a
   `scripts/set-exam-figure-urls-<year>-<variant>.mjs` (copy of `set-exam-figure-urls.mjs`)
   and run it. Sets `ExamItem.figureUrl = "/exam-figures/<file>"`. **Key on item id where
   the (section,label) pair can repeat (L204).**
8. **Set final answers** — for items with a clean numeric result, set `finalAnswer`
   (copy `set-exam-final-answers.mjs` pattern). Enables the free auto-check + self-score
   pre-fill on the student result screen.
9. **Deploy + verify authenticated** — deploy to VPS2 (see §3), then log in as SuperAdmin
   and open `/dashboard/admin/exam-bank/[paperId]` (all items + figures render) AND walk the
   student take `/dashboard/exam-bank/[paperId]` → submit → finalize → result. Verify the
   live HTML, authenticated. Only then mark the pair done.

## 3. Deploy (Tutor → VPS2 etutor.ro :3013)
- **L202**: assert `VPS_HEAD == local HEAD` BEFORE build. Docs-only commits ahead locally are OK.
- **L201**: migration-bearing deploy = backup DB → `prisma migrate deploy` → `prisma generate`.
  (No new migration needed for pure data imports — schema already has the columns.)
- Command: `cd /var/www/tutor && git pull && npm run build && pm2 restart tutor --update-env`.
- For data imports the rows are written by running the import script **against the prod DB**
  (DATABASE_URL=127.0.0.1:5432/tutor on VPS2), and figures are committed to the repo
  (`public/exam-figures/`) so they ship with `git pull`.
- Backups: `/root/backups/tutor-pre-exambank-*.dump`. Take a fresh dump before bulk DB writes.

## 4. Key files (absolute)
- Schema: `prisma/schema.prisma` (~1019-1109)
- Import template: `scripts/import-exam-en-viii-2026.mjs`
- Figure wiring: `scripts/set-exam-figure-urls.mjs`
- Final answers: `scripts/set-exam-final-answers.mjs`
- Scoring: `src/lib/exam-bank/score.ts` (+ `score.smoke.ts`)
- Sanitize (strip keys for student): `src/lib/exam-bank/sanitize.ts`
- Admin: `src/app/[locale]/dashboard/admin/exam-bank/page.tsx` + `[paperId]/page.tsx`
- Student: `src/app/[locale]/dashboard/exam-bank/page.tsx` + `[paperId]/page.tsx`
  + `src/components/exam-bank/exam-bank-take.tsx`
- API: `src/app/api/exam-bank/[paperId]/score/route.ts` + `attempt/[attemptId]/route.ts`
- Figures dir: `public/exam-figures/`

## 5. Scoring recap (score.ts)
- AnswerInput kinds: `objective {value}` (MCQ letter/text), `grid {cells[]}` (TF_GRID),
  `self {awardedPoints}` (open items, human-assigned).
- MCQ: normalized compare → all-or-nothing. TF_GRID: per-cell rubric points, clamp to item.points.
  Open: self-score clamped `[0, points]`.
- `note10 = (rawPoints + officeBonus) / (maxScore/10)`; partial attempts extrapolate +
  `isEstimate:true`. Clamp [1.00,10.00].
- `classifyPaperPoints` → `{autoPoints, figurePoints, manualPoints, total}` (admin badges).

## 6. Series 2 Matematică import queue (this campaign)
Folder `~/Downloads/Temp/tutor eval nat/pro-matematica/` — 11 pairs, SKIP `2026_Model`
(already at MVP). 10 new pairs:
- 2025: Simulare, Model, Examen_07, Rezerva_02, Sesiunea_Speciala_03
- 2024: Simulare, Model, Examen_07, Rezerva_02
- 2026: Simulare
Recommended order: fresh first (2025 Simulare, 2026 Simulare), then the rest.
Română is a later focus (after Mate).

## 7. Lessons that bit us (apply every time)
- **L201** migration deploy: backup → migrate deploy → generate (generate is NOT implied).
- **L202** assert VPS_HEAD==local before build (avoids deploying behind HEAD).
- **L204** key figure/answer wiring on item **id**, not (section,label) — labels repeat.
- Figure clip rect is the #1 silent error → always montage-verify before wiring.
- Variant MUST be in the figure filename for series 2 (same year, multiple papers).
- **Transient 502 after `pm2 restart`**: figures served by `next start` return 502 for a few seconds
  during the boot window after restart. Always `sleep ~6` before the figure-200 + authenticated verify,
  or you get false failures. (Observed every deploy in the series-2 run.)
- **Vector vs raster I.6 charts**: bar charts are sometimes embedded raster (get_image_info shows an
  xref) and sometimes vector (no xref on the page). Vector charts get clipped by estimated bbox and
  always need a tighten pass (drop item-text bleed + include all axis labels).
- **finalAnswer policy**: set it only for clean scalar results a student types as-is (integers, simple
  decimals `1,8`, clean fractions `1/3`, coordinate pairs `(7,0)`). SKIP for radicals (`9√3/2`, `2√5`),
  multi-value answers (`n∈{−1,3}`), and proofs — the score-route `norm` (spaces stripped, `,`→`.`)
  can't match those, so they'd only cause false-negative auto-checks.

## 8. Series-2 Mate run (2026-06-04) — reference index
10 papers imported + live-verified (`bbc82ff`→`254f214`), each `scripts/import-exam-mate-<year>-<variant>.mjs`:
2025 simulare/examen-07/model/rezerva-02/sesiune-speciala-03 · 2026 simulare · 2024 examen-07/model/rezerva-02/simulare.
Every pair verified authenticated: 12 MCQ → 60/60 rawPoints + finalCheck pass + figures-200. Prod total: 12 papers / 216 items.
