# Lessons Learned — Tutor

> Capture incident root causes here. One entry per lesson: L## — YYYY-MM-DD — <short title>.
> Format: **Symptom / Root cause / Fix / Prevention**.

## L01 — 2026-06-01 — Route-handler redirect leaks internal host behind nginx

**Symptom:** `GET /r/<CODE>` returned `307 Location: https://localhost:3013/ro/try` on prod (etutor.ro) — a browser would follow it to the dead internal address. Caught by live behavioral E2E, not by build/tests.

**Root cause:** `new URL("/ro/try", req.url)` in an App Router route handler. Behind nginx, the backend `Host` header is the upstream address (`localhost:3013`), so `req.url` / `req.nextUrl.origin` reflect the internal origin, not the public one. The vhost did not `proxy_set_header Host $host`.

**Fix:** Build redirect targets from the canonical public origin: `const base = process.env.AUTH_URL || req.nextUrl.origin; new URL(path, base)`. (`AUTH_URL=https://etutor.ro` on prod; falls back to request origin for local dev.) The Set-Cookie was already correct — cookies bind to the host the browser requested, independent of `req.url`.

**Prevention:** Never derive a redirect/absolute URL from `req.url`/`req.nextUrl.origin` in a route handler that runs behind a reverse proxy — use `AUTH_URL` or `x-forwarded-host`. Verify redirects with a live `curl -I` (the Location header), not just a green build.

## L02 — 2026-06-03 — Free-tier AI grader plateaus ~87%; a Claude-class judge (CLI on VPS, $0) reaches 97%+

**Symptom:** the Tier 5 Content Quality Mesh (generation + 3-lens screening, all on Groq llama-3.3-70b) plateaued at ~87–95% teacher-quality on the auto-keep ("high-confidence") bucket across 4 calibration iterations. Subtle defects kept slipping: multiple-correct ("25% din 3000" where two methods both compute it; "inversa fracției" where two definitions are both valid), incomplete-option sets, and garbled-source groundings. Adding stricter Groq lenses + an ensemble didn't break the ceiling — and a quick manual eyeball over-estimated quality at "95%" vs the strong judge's measured 86.9%.

**Root cause:** when the SAME free-tier model both generates and judges, it shares the generator's blind spots — it can't reliably catch the subtle correctness cases (per-option uniqueness, equivalence of two options). The grader's own confidence score (`meshConfidence`, often 1.0) is optimistic vs human/strong-AI judgment. A clean single-pass run is NOT validation (L194 in Master).

**Fix:** add a **stage-3 strong judge = Claude** as the final gate. Claude is available on the VPS at **$0 API credit** via the Claude CLI subprocess (`/usr/bin/claude`, subscription/keychain auth) — spawn `claude -p <prompt> --output-format json --model sonnet`, **strip `ANTHROPIC_API_KEY` from the spawn env** to force subscription auth (not metered API), parse a strict `RESULT: KEEP|DROP` line. Wired into `content-quality-mesh.ts:finalJudge` (Groq 2-judge ensemble kept as fallback; `MESH_CLAUDE_JUDGE=0` disables). A one-time Claude prune of the existing bucket dropped 17/130 (→ verified ≥97%); in-pipeline, a fresh chunk produced 10/10 clean.

**Prevention:** for quality-critical AI gates, don't let the generator be its own judge on a free tier — put a stronger, independent model on the final gate. Measure with an adversarial/strong judge + sampling, never with the grader's own score or a quick eyeball. On the VPS, Claude CLI subprocess (subscription, $0) is the strong judge; cost is latency (~3–5s/item), gated behind a flag. Cross-ref: Master L194 (mesh grader not validated without negative-control), `feedback_prefer_claude_cli_subscription`.

## L03 — 2026-06-04 — 4uPDF /api/extract-region page param = physical PDF page (no offset); renders vector figures too

**Symptom:** during the 2021 exam-bank batch (Test_14), the first figure-extraction loop wrote 10 visually-wrong crops — montage showed the temperature table where a square figure was expected, graph crops landed on the wrong items. fig_inspect.py reports figures under "PAGE 3", "PAGE 4" etc. but the extraction loop had passed `page=1, 2, 4, ...` (an ad-hoc offset, treating the cover/SI pages as a shift).

**Root cause:** the 4uPDF `/api/extract-region` `page` field is **1-based on the physical PDF** — i.e. exactly the fig_inspect "PAGE N" number (cover = page 1). There is no offset. Subtracting 2 for SII and a different amount for SIII mapped every figure to the wrong page. Separately, a `set -- $spec` bash loop silently failed to word-split (wrote files with the whole spec string as the slug → 10 junk 89-byte PNGs); switching to `read slug page x0 y0 x1 y1 <<< "$spec"` fixed it.

**Fix:** pass `page` = fig_inspect PAGE number verbatim. Always montage-verify (3×N grid, Read the PNG) before commit — the wrong-page crops are obvious at a glance. Delete junk files with `find ... -name "...* *.png" -delete` (space in name) before staging.

**Prevention:** the extract-region page is the physical page; never offset. Vector figures (e.g. the Test_15 SI.6 pie chart, which has NO raster IMG xref) render correctly via extract-region — estimate their bbox from `page.get_drawings()` union and pass the same fractions. Montage-verify is the cheap catch for any bbox/page mistake. Cross-ref: `knowledge/exam-bank-import-playbook.md` §2.6, memory `project_tutor_exam_bank_import`.

## L04 — 2026-06-04 — Official barem answer-key can be wrong; math-prove every MCQ key, override + document a typo

**Symptom:** importing 2022 Test_04, the official barem prints `SII.6 = a)` (= "8 dm"), but item 6 (regular pyramid VABCD, square base AB=2, triangle VBD equilateral, sum of the 4 lateral edges) is provably **8√2 dm = option b**: square diagonal BD=2√2, VBD equilateral ⇒ VB=VD=BD=2√2, regular pyramid ⇒ all 4 lateral edges = 2√2, sum = 4·2√2 = 8√2. Option a (8) would require each lateral edge = 2 = the base side, contradicting the equilateral condition.

**Root cause:** the official CNCE barem has a typo in the answer letter (or the OCR of the barem flipped a→b). Blindly transcribing the printed key would have given students a *wrong* auto-grade key — a student who correctly answers 8√2 (b) would be marked wrong. The "answer keys are GROUND-TRUTH from the barem" rule exists to stop *me inventing* keys, not to force-copy a provable typo.

**Fix:** use the **mathematically-proven** answer (b), set it as `correctAnswer`, and **document the discrepancy prominently** in the script header (`⚠️ BAREM-DISCREPANCY: barem prints "a" but correct is 8√2=b, <derivation>`) + flag it to the user. The `/review` mesh math verifier independently re-derived 8√2 and confirmed b — that adversarial second opinion is what makes the override safe.

**Prevention:** every MCQ key gets an independent math re-derivation in the `/review` mesh pass; never ship a key on the barem's word alone. When math contradicts a single printed barem letter and the math matches a *specific option*, prefer the math + document (don't silently copy, don't silently change). Cross-ref: `knowledge/exam-bank-import-playbook.md` §0 ground-rules + §7.

## L05 — 2026-06-04 — A "geometrically impossible" MCQ usually means a dropped √ (or symbol) in OCR — back-solve before trusting the text

**Symptom:** 2022 Test_05 SII.4 (rectangle, O = midpoint of diagonal AC, P on DC with PO⊥AC, "AP=3", "BC=5", find AB; barem key b = AB=5) is geometrically **impossible** as first read: PO⊥AC through the midpoint ⇒ PA=PC, and A→P (P on the side opposite AB) forces PA ≥ height = BC = 5, so PA=3 < 5 can't happen for any AB.

**Root cause:** the PDF text rendered `BC = √5 cm` but the first OCR pass dropped the radical, reading `BC = 5 cm`. With the true `BC = √5`: PA²=AD²+DP² ⇒ 9 = 5 + (AB−3)² ⇒ AB = 5 (rejecting AB=1 since PC=3 > DC=1). Everything is consistent and the barem key b=5 is correct.

**Fix:** when an MCQ looks impossible, **back-solve from the barem answer** to find what input value makes it consistent — it instantly revealed `BC` had to be √5, not 5. Re-read the PDF's secondary rendering (the layout block, not just the first text block) which showed `√5`. Transcribe `BC = √5 cm`.

**Prevention:** treat "impossible problem" as an OCR-symbol-loss signal (most often a dropped `√`, exponent, or sign), not a flawed source — official CNCE items are sound. Back-solving from the known key + re-reading both PDF text renderings recovers the true value. The `/review` math verifier re-derives with the corrected value and confirms. Cross-ref: `knowledge/exam-bank-import-playbook.md` §0.

## L06 — 2026-06-04 — Limba română import: 3 lessons (figure-restart, accent-render, verbatim-via-fitz)

Importing the 8 official EN VIII Limba română papers surfaced three reusable lessons.

**(a) Figure-bearing papers need `pm2 restart tutor` after data import — data-only imports don't.**
Tutor runs plain `next start` (NOT standalone). `next start` enumerates `public/` at server boot, so a newly committed+pulled figure (`public/exam-figures/*.png`) returns **404 until a restart**, even though the file is on disk. Pure-text paper imports (the 7 figure-less RO papers) render immediately with no restart — the app reads ExamPaper/ExamItem/ExamPassage rows from the DB at request time. Only the 2025 Model paper (Erasmus chart on A.3) needed `pm2 restart tutor --update-env` + ~8s boot wait (L67 transient 502) before its figure went 200. An existing Mate figure (present at the last `npm run build`) stayed 200 throughout — proof the difference is "present at boot" not "build vs no-build".

**(b) Accentuation MCQs lose their accent marks in fitz text extraction — render the region visually + re-encode with acute vowels.**
2025 Simulare B.1 ("corect accentuate") printed all four options as the same string `culturile; era` because the distinguishing accent (bold+underline on the stressed syllable) is a glyph attribute fitz drops. Rendered page-region to PNG, read it visually, encoded the stress with acute-accented vowels (`cúlturile`/`cultúrile`, `éra`/`erá`) so the student sees the distinction in HTML. **Ground-truth trap caught in the same item:** the verb `era` (imperfect of "a fi", 3sg) is stressed on the **final** syllable — `e-RÁ` (like `el cântá`) — NOT `éra` (that's the noun "epoch"). The barem key `d` (cultúrile; erá) is correct; my first intuition ("éra") was wrong. Verify stress against grammar, not gut, before encoding.

**(c) `fitz` (PyMuPDF) `get_text()` IS the verbatim source for prose/poetry — far safer than visual transcription.**
For figure-free Romanian literary texts, `python -c "import fitz; ..."` extracted both passages verbatim (including the long ~1-page nonfiction Text 2), which I cleaned (normalize `ş/ţ` cedilla → `ș/ț` comma-below; keep `[...]` ellipses + archaic spellings like Creangă's `mieu`, `sara`, `lacrâmi` verbatim) and pasted into the import script. No OCR symbol-loss risk for plain text (unlike the Mate radical-drop in L05) — the loss only hits glyph attributes (accents/bold), handled per (b). Verification: authenticated HTML render check greps for first+last line of each passage to confirm the full text shipped.

**Reusable tooling produced:** `/tmp/verify-ro-paper.mjs` (NextAuth login → POST score → assert auto rawPoints == sum-of-autoGradable-points + attempt persisted; handles MCQ-objective + TF_GRID-grid, variable points) + `/tmp/verify-ro-html2.mjs` (authenticated GET of the student take page → grep distinctive content). Cross-ref: `knowledge/exam-bank-import-playbook.md`.
