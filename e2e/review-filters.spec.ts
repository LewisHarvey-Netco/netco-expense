import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test('filters narrow the table, clear restores it', async ({ page }) => {
  await loginAs(page, 'bob@netcompany.com');

  await page.getByRole('checkbox', { name: 'Approved' }).check();
  await page.getByRole('button', { name: 'Apply Filters' }).click();
  await expect(page.getByText('Showing 3 of 10 expenses', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Clear Filters' }).click();

  await page.getByRole('combobox').click();
  await page.getByRole('option', { name: 'Alice Nielsen' }).click();
  await page.getByRole('button', { name: 'Apply Filters' }).click();
  await expect(page.getByText('Showing 6 of 10 expenses', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Clear Filters' }).click();

  await page.getByRole('checkbox', { name: 'Transport' }).check();
  await page.getByRole('button', { name: 'Apply Filters' }).click();
  await expect(page.getByText('Showing 4 of 10 expenses', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Clear Filters' }).click();

  await page.getByLabel('From date').fill('2025-07-10');
  await page.getByLabel('To date').fill('2025-07-12');
  await page.getByRole('button', { name: 'Apply Filters' }).click();
  await expect(page.getByText('Showing 2 of 10 expenses', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Clear Filters' }).click();

  await page.getByRole('checkbox', { name: 'Approved' }).check();
  await page.getByRole('checkbox', { name: 'Transport' }).check();
  await page.getByRole('button', { name: 'Apply Filters' }).click();
  await expect(page.getByText('Showing 1 of 10 expenses', { exact: true })).toBeVisible();
});
