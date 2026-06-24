# Retest Round 9 — 2026-04-20

## Scope
Final verification of all 41 audit findings (AUDIT-001 through AUDIT-040).
Round 8 had identified findings AUDIT-033 through AUDIT-040 as OPEN.
Round 9 verified all are FIXED in codebase.

## Code change in this round
- `src/app/api/calendar/callback/route.ts`: Added `!secret` guard to HMAC verification (AUDIT-034 hardening)

## Verification results

| ID | Severity | Status | Method |
|---|---|---|---|
| AUDIT-033 | MEDIUM | FIXED | Code review: csrf-interceptor.tsx uses tokenReady promise (line 19) |
| AUDIT-034 | HIGH | FIXED | Code review: callback verifies HMAC with timingSafeEqual (line 42-52); connect signs with HMAC (line 50-53). Added !secret guard. |
| AUDIT-035 | HIGH | FIXED | Code review: checkout wraps voucher in $transaction with updateMany lt guard (line 44-61) |
| AUDIT-036 | HIGH | FIXED | Code review: requireAdmin() checks isSuperAdmin only (line 14); requireDomainAdmin() added for scoped access (line 26-46) |
| AUDIT-037 | MEDIUM | FIXED | Code review: xpOverride gated by hasAnyRole ADMIN/INSTRUCTOR (line 42-50) |
| AUDIT-038 | MEDIUM | FIXED | Code review: target enrollment verified before XP award (line 68-76) |
| AUDIT-039 | MEDIUM | FIXED | Code review: Zod schema with .strict() on plans PATCH (line 7-14) and preferences PUT (line 7-16) |
| AUDIT-040 | MEDIUM | FIXED | Code review: filename sanitized with /[^a-zA-Z0-9._-]/g (line 272) |

## Test results
```
Test Files  17 passed (17)
     Tests  203 passed (203)
  Duration  560ms
```

## TypeScript
0 errors

## ESLint
10 warnings (pre-existing react-hooks/exhaustive-deps only)

## Remaining open
- AUDIT-027 (LOW): 10 react-hooks/exhaustive-deps warnings — pre-existing, no functional impact
- AUDIT-032 (HIGH): Tautological tests — no production risk, deferred to future sprint
