import { test, expect } from "@playwright/test";

test.describe("Security Headers", () => {
  test("should have X-Frame-Options header", async ({ page }) => {
    const response = await page.goto("/");
    const headers = response?.headers();
    expect(headers?.["x-frame-options"]).toBe("SAMEORIGIN");
  });

  test("should have X-Content-Type-Options header", async ({ page }) => {
    const response = await page.goto("/");
    const headers = response?.headers();
    expect(headers?.["x-content-type-options"]).toBe("nosniff");
  });

  test("should have Referrer-Policy header", async ({ page }) => {
    const response = await page.goto("/");
    const headers = response?.headers();
    expect(headers?.["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  });

  test("should have Strict-Transport-Security header", async ({ page }) => {
    const response = await page.goto("/");
    const headers = response?.headers();
    const hsts = headers?.["strict-transport-security"];
    expect(hsts).toContain("max-age=31536000");
  });

  test("should have Content-Security-Policy header", async ({ page }) => {
    const response = await page.goto("/");
    const headers = response?.headers();
    const csp = headers?.["content-security-policy"];
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'self'");
  });

  test("should have Permissions-Policy header", async ({ page }) => {
    const response = await page.goto("/");
    const headers = response?.headers();
    expect(headers?.["permissions-policy"]).toContain("camera=()");
  });
});

test.describe("API Security", () => {
  test("should return 401 for unauthenticated API calls", async ({ request }) => {
    const response = await request.get("/api/student/dashboard");
    expect(response.status()).toBe(401);
  });

  test("should return 401 for admin endpoints without auth", async ({ request }) => {
    const response = await request.get("/api/admin/users");
    expect(response.status()).toBe(401);
  });

  test("should not expose API internals via robots.txt", async ({ request }) => {
    const response = await request.get("/robots.txt");
    const text = await response.text();
    expect(text).toContain("Disallow: /api/");
    expect(text).toContain("Disallow: /dashboard/");
  });
});
