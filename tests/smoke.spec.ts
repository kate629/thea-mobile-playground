import { test, expect } from '@playwright/test';

test('home page renders the marketing landing', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Thea');
  await expect(page.getByText('Find gift ideas for')).toBeVisible();
});
