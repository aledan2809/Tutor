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
