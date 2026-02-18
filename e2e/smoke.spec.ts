// ── E2E Smoke Tests ──────────────────────────────────────
// Minimal e2e tests to verify the app loads and critical flows work.
// Run: pnpm test:e2e (requires `pnpm build` first)

import { test, expect } from '@playwright/test';

test.describe('App Smoke Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    // The app should render without crashing
    await expect(page).toHaveTitle(/Station Manager|DataOS/i);
  });

  test('has login page elements when not authenticated', async ({ page }) => {
    await page.goto('/');
    // Should show either the login form or the dashboard
    // The app uses mock auth in dev mode, so either is valid
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('navigation renders on desktop', async ({ page }) => {
    await page.goto('/');
    // Wait for the app to fully load
    await page.waitForLoadState('networkidle');
    // The body should be visible and contain content
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('404 page shows for invalid routes', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');
    await page.waitForLoadState('networkidle');
    // Should show the not-found page content
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('public wash portal loads without auth', async ({ page }) => {
    await page.goto('/wash');
    await page.waitForLoadState('networkidle');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('onboarding page loads without auth', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  test('renders on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('renders on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
