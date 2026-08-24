import { test, expect } from '@playwright/test';

test('logs in as finance and lands on review page', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'bob@netcompany.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/\/review/);
  await expect(page.getByText('All Expenses', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Client lunch meeting at Restaurant Noma'),
  ).toBeVisible();
  await expect(page.getByRole('banner').getByText('Bob Madsen')).toBeVisible();
});
