import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test("should display sign-in page", async ({ page }) => {
    await page.goto("/en/auth/signin");
    await expect(page).toHaveURL(/auth\/signin/);
    await expect(page.locator("form")).toBeVisible();
  });

  test("should show login form with email and password", async ({ page }) => {
    await page.goto("/en/auth/signin");
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test("should show validation error for empty form submission", async ({ page }) => {
    await page.goto("/en/auth/signin");
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    // HTML5 validation should prevent submission
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute("required", "");
  });

  test("should redirect unauthenticated users to sign-in", async ({ page }) => {
    await page.goto("/en/dashboard");
    await expect(page).toHaveURL(/auth\/signin/);
  });

  test("should show Google login option", async ({ page }) => {
    await page.goto("/en/auth/signin");
    const googleButton = page.locator('button:has-text("Google"), a:has-text("Google")');
    await expect(googleButton).toBeVisible();
  });

  test("should support locale switching (en/ro)", async ({ page }) => {
    await page.goto("/en/auth/signin");
    await expect(page).toHaveURL(/\/en\//);
    await page.goto("/ro/auth/signin");
    await expect(page).toHaveURL(/\/ro\//);
  });
});

test.describe("Public Pages", () => {
  test("should load landing page", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Tutor/i);
  });

  test("should have proper meta tags", async ({ page }) => {
    await page.goto("/");
    const description = await page.locator('meta[name="description"]').getAttribute("content");
    expect(description).toBeTruthy();
  });
});
