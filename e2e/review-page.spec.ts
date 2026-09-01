import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test('finance user sees all expenses on /review', async ({ page }) => {
  await loginAs(page, 'bob@netcompany.com');

  await expect(page).toHaveURL(/\/review/);
  await expect(page.getByText('All Expenses', { exact: true })).toBeVisible();
  await expect(page.getByText('Showing 10 of 10 expenses', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Client lunch meeting at Restaurant Noma'),
  ).toBeVisible();
  await expect(page.getByText('Coffee and pastries for morning standup')).toBeVisible();
});

test('clicking a row navigates to the expense detail page', async ({ page }) => {
  await loginAs(page, 'bob@netcompany.com');

  await page.getByText('Client lunch meeting at Restaurant Noma').click();

  await expect(page).toHaveURL(
    /\/review\/e1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6/,
  );
  await expect(page.getByText('Expense Detail', { exact: true })).toBeVisible();
  await expect(page.getByText('185.50 DKK')).toBeVisible();
  await expect(page.getByText('Alice Nielsen')).toBeVisible();
});

test('consultant is redirected away from /review', async ({ page }) => {
  await loginAs(page, 'alice@netcompany.com');
  await page.goto('/review');

  await expect(page).toHaveURL(/\/expenses/);
});
