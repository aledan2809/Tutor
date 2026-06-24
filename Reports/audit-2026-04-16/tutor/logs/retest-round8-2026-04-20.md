# Retest Round 8 — 2026-04-20

## Scope
Full retest of all previously OPEN/PARTIAL findings from rounds 1-7.

## Findings Verified as FIXED

### AUDIT-005 (CRITICAL) — Domain enrollment checks
- **Status**: FULLY RESOLVED
- **Evidence**: All 19 domain-scoped routes under `src/app/api/[domain]/` have explicit `requireEnrollment()` calls
- Routes verified: achievements, bibliography, calendar/connect, calendar/events, calendar/free-slots, calendar/status, daily-challenge, exam/[examId], exam/formats, exam/history, exam/start, exam/submit, exam/verify, leaderboard, progress, session/[sessionId], session/answer, session/complete, session/next, session/start, streak, streak/recover, vouchers/redeem, xp

### AUDIT-009 (HIGH) — Assessment returns correct answers
- **Status**: FIXED
- **Evidence**: `src/app/api/student/assessment/route.ts` lines 146-154 — POST response returns only `questionId`, `isCorrect`. No `correctAnswer` or `explanation` in response.

### AUDIT-010 (HIGH) — Session answer returns correct answer
- **Status**: FIXED
- **Evidence**: `src/app/api/[domain]/session/answer/route.ts` lines 161-166 — POST response returns only `attemptId`, `isCorrect`, `nextReview`, `xpAwarded`. No `correctAnswer`, `explanation`, or `quality` in response.

### AUDIT-014 (MEDIUM) — Inconsistent answer-checking
- **Status**: FIXED
- **Evidence**: All consumers use centralized `checkAnswer()` from `src/lib/answer-checker.ts`:
  - `session/answer/route.ts:72`
  - `exam-engine.ts:152` (scoreExam)
  - `exam/verify/route.ts:93`
  - `student/assessment/route.ts:68`

### AUDIT-020 (MEDIUM) — Duplicate rate limiting
- **Status**: FIXED
- **Evidence**: `src/middleware.ts:4` imports `checkRateLimit`, `buildRateLimitKey`, `getRateLimitConfigForPath`, `getRateLimitHeaders` from `@/lib/rate-limit`. Single store, single module.

### AUDIT-031 (MEDIUM) — Missing indexes on 4 models
- **Status**: FIXED
- **Evidence**: Added indexes to `prisma/schema.prisma`:
  - `Account`: `@@index([userId])`
  - `ContentSource`: `@@index([domainId])`
  - `ExamSimulation`: `@@index([domainId])`
  - `StudySession`: `@@index([userId, domainId])`, `@@index([startTime])`
- **Migration**: `0009_audit_missing_indexes`

### New Findings (from deep audit)
- AUDIT-032 (HIGH) — Tautological tests in security test suites (no prod risk, test quality issue)
- AUDIT-033 (MEDIUM) — CSRF race condition on initial page load

## Schema/Migrations
- `0008_audit_stripe_invoice_unique`: `stripeInvoiceId` @unique (AUDIT-004)
- `0009_audit_missing_indexes`: 5 indexes across 4 models (AUDIT-031)

## Test Results
```
Test Files  17 passed (17)
     Tests  203 passed (203)
  Duration  598ms
```

## Remaining
- AUDIT-027 (LOW) — 6 pre-existing `react-hooks/exhaustive-deps` warnings. No functional impact.
- AUDIT-032 (HIGH) — Tautological tests. No production risk — tests pass but don't exercise real code.
- AUDIT-033 (MEDIUM) — CSRF token race on page load. Low practical risk (requires exact timing).
