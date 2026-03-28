import { test, expect } from "@playwright/test";

test.describe("PWA Features", () => {
  test("should serve manifest.json", async ({ page }) => {
    const response = await page.goto("/manifest.json");
    expect(response?.status()).toBe(200);
    const manifest = await response?.json();
    expect(manifest.name).toBe("Tutor - Adaptive Learning Platform");
    expect(manifest.short_name).toBe("Tutor");
    expect(manifest.display).toBe("standalone");
  });

  test("should have manifest link in page head", async ({ page }) => {
    await page.goto("/");
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute("href", "/manifest.json");
  });

  test("should serve service worker", async ({ page }) => {
    const response = await page.goto("/sw.js");
    expect(response?.status()).toBe(200);
    const contentType = response?.headers()["content-type"];
    expect(contentType).toContain("javascript");
  });

  test("should have PWA icons", async ({ page }) => {
    const icon192 = await page.goto("/icons/icon-192x192.png");
    expect(icon192?.status()).toBe(200);

    const icon512 = await page.goto("/icons/icon-512x512.png");
    expect(icon512?.status()).toBe(200);
  });

  test("should have theme-color meta tag", async ({ page }) => {
    await page.goto("/");
    const themeColor = await page.locator('meta[name="theme-color"]').getAttribute("content");
    expect(themeColor).toBeTruthy();
  });
});
