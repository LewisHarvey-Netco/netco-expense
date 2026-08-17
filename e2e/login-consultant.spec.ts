import { test, expect } from '@playwright/test';

test('logs in as consultant and lands on expenses page', async ({ page }) => {
  await page.goto('/login');
  await page.waitForTimeout(1500);

  await page.fill('input[name="email"]', 'alice@netcompany.com');
  await page.waitForTimeout(1000);
  await page.fill('input[name="password"]', 'password123');
  await page.waitForTimeout(1000);
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/\/expenses/);
  await expect(page.getByText('Expenses')).toBeVisible();
  await expect(page.getByText('Alice Nielsen')).toBeVisible();
  await page.waitForTimeout(2000);
});
