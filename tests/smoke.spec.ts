import { test, expect } from '@playwright/test';

test('home page loads with login form', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Thea');
  await expect(page.getByPlaceholder('Email address')).toBeVisible();
});
