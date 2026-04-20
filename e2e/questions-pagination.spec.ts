import { test, expect, Page } from "@playwright/test";

const ADMIN_EMAIL = process.env.TUTOR_TEST_ADMIN_EMAIL!;
const ADMIN_PW = process.env.TUTOR_TEST_ADMIN_PASSWORD!;
const INSTRUCTOR_EMAIL = process.env.TUTOR_TEST_INSTRUCTOR_EMAIL!;
const INSTRUCTOR_PW = process.env.TUTOR_TEST_INSTRUCTOR_PASSWORD!;

if (!ADMIN_EMAIL || !ADMIN_PW || !INSTRUCTOR_EMAIL || !INSTRUCTOR_PW) {
  throw new Error("Missing TUTOR_TEST_* env vars — source credentials/tutor-test-users.env");
}

test.describe.configure({ mode: "serial", retries: 0 });

async function login(page: Page, email: string, password: string) {
  await page.goto("/en/auth/signin");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/en\/dashboard(?:\?.*)?(?:#.*)?$/, { timeout: 20_000 });
}

test("Admin — /admin/questions pagination (URL + UI click)", async ({ page }) => {
  await login(page, ADMIN_EMAIL, ADMIN_PW);

  await page.goto("/en/dashboard/admin/questions?page=2");
  await page.waitForLoadState("networkidle");
  const urlDirectP2 = page.url();
  console.log(`[admin] direct ?page=2 URL: ${urlDirectP2}`);
  expect(urlDirectP2).toMatch(/[?&]page=2\b/);

  await page.goto("/en/dashboard/admin/questions");
  await page.waitForLoadState("networkidle");

  const pagerBtn2 = page.locator("button", { hasText: /^2$/ }).first();
  await expect(pagerBtn2).toBeVisible({ timeout: 5_000 });
  await pagerBtn2.click();
  await page.waitForURL(/[?&]page=2\b/, { timeout: 10_000 });

  const urlAfterClick = page.url();
  console.log(`[admin] after pager click, URL: ${urlAfterClick}`);
  expect(urlAfterClick).toMatch(/[?&]page=2\b/);

  await expect(page.getByRole("link", { name: /\+ New Question/i })).toBeVisible();
});

test("Instructor — blocked from /admin/* + /instructor/questions read-only + pagination", async ({ page }) => {
  await login(page, INSTRUCTOR_EMAIL, INSTRUCTOR_PW);

  // (1) Instructor must be blocked from /admin/questions
  await page.goto("/en/dashboard/admin/questions");
  await page.waitForLoadState("networkidle");
  const urlAdmin = page.url();
  console.log(`[instructor] /admin/questions → ${urlAdmin}`);
  expect(urlAdmin, "[instructor] must be redirected away from /admin/*").not.toMatch(
    /\/dashboard\/admin\/questions/
  );

  // (2) /instructor/questions must render
  await page.goto("/en/dashboard/instructor/questions");
  await page.waitForLoadState("networkidle");
  expect(page.url()).toMatch(/\/en\/dashboard\/instructor\/questions/);

  // (3) Read-only: create/edit toolbars hidden
  await expect(page.getByRole("link", { name: /\+ New Question/i })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /^Import$/ })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /AI Generate/i })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /questions/i }).first()).toBeVisible();

  // (4) Pagination works on instructor route
  const pagerBtn2 = page.locator("button", { hasText: /^2$/ }).first();
  await expect(pagerBtn2).toBeVisible({ timeout: 5_000 });
  await pagerBtn2.click();
  await page.waitForURL(/[?&]page=2\b/, { timeout: 10_000 });
  const urlP2 = page.url();
  console.log(`[instructor] after pager click: ${urlP2}`);
  expect(urlP2).toMatch(/[?&]page=2\b/);
});
