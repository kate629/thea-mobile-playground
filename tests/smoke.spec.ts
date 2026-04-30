import { test, expect } from '@playwright/test';

test('home page renders the marketing landing', async ({ page }) => {
  await page.goto('/');
  // Match any title starting with "Thea" so seasonal/campaign suffixes
  // (e.g. "Thea — Personalized Mother's Day Gifts") don't break the smoke.
  await expect(page).toHaveTitle(/^Thea/);
  await expect(page.getByText('Find gift ideas for')).toBeVisible();
});
