#!/bin/bash
# Post-deployment validation for Tutor on VPS2
# Usage: bash scripts/validate-deployment.sh [BASE_URL]

set -euo pipefail

BASE_URL="${1:-https://tutor.knowbest.ro}"
PASS=0
FAIL=0

check() {
  local desc="$1"
  local url="$2"
  local expected_code="${3:-200}"
  local method="${4:-GET}"

  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$url" 2>/dev/null || echo "000")

  if [ "$HTTP_CODE" = "$expected_code" ]; then
    echo "  ✓ $desc (HTTP $HTTP_CODE)"
    PASS=$((PASS + 1))
  else
    echo "  ✗ $desc (expected $expected_code, got $HTTP_CODE)"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== Post-Deployment Validation ==="
echo "Target: $BASE_URL"
echo "Date: $(date)"
echo ""

echo "--- Health Check ---"
check "Health endpoint" "$BASE_URL/api/health"

echo ""
echo "--- Auth Endpoints ---"
check "Auth signin page" "$BASE_URL/en/auth/signin"

echo ""
echo "--- Security Validations ---"

# C03: Domain cross-access - should reject unauthenticated
check "Session answer (unauth)" "$BASE_URL/api/test-domain/session/answer" "401" "POST"

# C04: Exam submit (unauth)
check "Exam submit (unauth)" "$BASE_URL/api/test-domain/exam/submit" "401" "POST"

# C07: Open redirect - should not redirect to external URLs
REDIRECT_CODE=$(curl -s -o /dev/null -w "%{http_code}" -L --max-redirs 0 "$BASE_URL/en/auth/signin?callbackUrl=https://evil.com" 2>/dev/null || echo "000")
if [ "$REDIRECT_CODE" != "302" ] || ! curl -s -D - "$BASE_URL/en/auth/signin?callbackUrl=https://evil.com" 2>/dev/null | grep -qi "location:.*evil.com"; then
  echo "  ✓ Open redirect protection (no redirect to external URL)"
  PASS=$((PASS + 1))
else
  echo "  ✗ Open redirect protection FAILED"
  FAIL=$((FAIL + 1))
fi

echo ""
echo "--- Admin/Instructor Endpoints ---"

# C05: Group ownership - should reject unauthenticated
check "Groups endpoint (unauth)" "$BASE_URL/api/dashboard/instructor/groups" "401"

# C06: Impersonation (unauth)
check "Impersonate (unauth)" "$BASE_URL/api/admin/users/fake-id/impersonate" "401" "POST"

# H01: Instructor messages (unauth)
check "Instructor messages (unauth)" "$BASE_URL/api/dashboard/instructor/messages" "401"

# H02: Thresholds (unauth)
check "Thresholds (unauth)" "$BASE_URL/api/dashboard/instructor/thresholds" "401"

# H04: CRON escalation (no secret)
check "CRON escalation (no secret)" "$BASE_URL/api/cron/escalation" "401"

echo ""
echo "--- Security Headers ---"
HEADERS=$(curl -s -D - -o /dev/null "$BASE_URL/" 2>/dev/null)
for HEADER in "x-frame-options" "x-content-type-options" "referrer-policy"; do
  if echo "$HEADERS" | grep -qi "$HEADER"; then
    echo "  ✓ $HEADER header present"
    PASS=$((PASS + 1))
  else
    echo "  ✗ $HEADER header missing"
    FAIL=$((FAIL + 1))
  fi
done

echo ""
echo "--- API Rate Limiting ---"
# Send rapid requests to check rate limiting is active
RATE_LIMITED=false
for i in $(seq 1 30); do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health" 2>/dev/null || echo "000")
  if [ "$CODE" = "429" ]; then
    RATE_LIMITED=true
    break
  fi
done
if [ "$RATE_LIMITED" = true ]; then
  echo "  ✓ Rate limiting active (429 after rapid requests)"
  PASS=$((PASS + 1))
else
  echo "  ~ Rate limiting not triggered (may need more requests or different endpoint)"
fi

echo ""
echo "=== Results ==="
echo "Passed: $PASS"
echo "Failed: $FAIL"

if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "⚠ Some checks failed. Review the output above."
  exit 1
else
  echo ""
  echo "All checks passed."
fi
