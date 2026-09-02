import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

// Test data notes (see src/mocks/expenses.json):
// - Alice Nielsen (u1, consultant) submitted 6 of the 10 mock expenses:
//   - "Client lunch meeting at Restaurant Noma"  (e1a2b3c4-..., 185.50 DKK, Approved, receipt 2025-07-15)
//   - "Taxi to Copenhagen airport for client visit" (e2b3c4d5-..., 420.00 DKK, Submitted, receipt 2025-07-18)
//   - "Working breakfast with stakeholders"      (e4d5e6f7-..., 45.00 EUR, Changes Requested, receipt 2025-07-20)
//   - "Train ticket Copenhagen to Malmö"         (e6f7a8b9-..., 289.00 DKK, Resubmitted, receipt 2025-07-22)
//   - "Uber from office to client site in Amsterdam" (e8b9c0d1-..., 35.50 EUR, Submitted, receipt 2025-07-28)
//   - "Coffee and pastries for morning standup"  (e0d1e2f3-..., 28.90 EUR, Resubmitted, receipt 2025-07-30)
// - "Hotel stay during Berlin conference" (e3c4d5e6-...) was submitted by u3 (Tom), not Alice.
// - The mock repository is in-memory and re-seeded from the mock JSON on every
//   page load (ADR-0010), so each test starts from the baseline mock data.

test('consultant list is scoped to own expenses and filters narrow it', async ({ page }) => {
  await loginAs(page, 'alice@netcompany.com');

  await expect(page).toHaveURL(/\/expenses/);
  await expect(page.getByText('Showing 6 of 6 expenses', { exact: true })).toBeVisible();
  // Only Alice's expenses are listed.
  await expect(page.getByText('Client lunch meeting at Restaurant Noma')).toBeVisible();
  await expect(page.getByText('Hotel stay during Berlin conference')).toHaveCount(0);
  // The submitter filter is hidden on the consultant list (showSubmitterFilter={false}).
  await expect(page.getByRole('combobox')).toHaveCount(0);

  // Status filter: only one of Alice's expenses is Approved.
  await page.getByRole('checkbox', { name: 'Approved' }).check();
  await page.getByRole('button', { name: 'Apply Filters' }).click();
  await expect(page.getByText('Showing 1 of 6 expenses', { exact: true })).toBeVisible();
  await expect(page.getByText('Client lunch meeting at Restaurant Noma')).toBeVisible();
  await page.getByRole('button', { name: 'Clear Filters' }).click();

  // Type filter: three of Alice's expenses are Transport.
  await page.getByRole('checkbox', { name: 'Transport' }).check();
  await page.getByRole('button', { name: 'Apply Filters' }).click();
  await expect(page.getByText('Showing 3 of 6 expenses', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Clear Filters' }).click();

  // Date range: two of Alice's receipt dates fall in 18–20 July.
  await page.getByLabel('From date').fill('2025-07-18');
  await page.getByLabel('To date').fill('2025-07-20');
  await page.getByRole('button', { name: 'Apply Filters' }).click();
  await expect(page.getByText('Showing 2 of 6 expenses', { exact: true })).toBeVisible();
});

test('consultant opens own expense detail, fields are read-only, back returns to list', async ({
  page,
}) => {
  await loginAs(page, 'alice@netcompany.com');

  await page.getByText('Client lunch meeting at Restaurant Noma').click();

  await expect(page).toHaveURL(
    /\/expenses\/e1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6/,
  );
  await expect(page.getByRole('heading', { name: 'Expense Detail' })).toBeVisible();

  // All fields render with the expense's values.
  await expect(page.getByLabel('Amount')).toHaveValue('185.5');
  await expect(page.getByLabel('Currency')).toHaveValue('DKK');
  // The select trigger's text includes the chevron glyph, so match a substring.
  await expect(page.getByLabel('Type')).toContainText('Lunch');
  await expect(page.getByLabel('Receipt date')).toHaveValue('2025-07-15');
  await expect(page.getByLabel('Region')).toHaveValue('Nordics');
  await expect(page.getByLabel('Project')).toHaveValue('Greenfield ERP');
  await expect(page.getByLabel('Description')).toHaveValue(
    'Client lunch meeting at Restaurant Noma',
  );
  // Scoped to <main> because the header also renders the user's name.
  await expect(page.locator('main').getByText('Alice Nielsen')).toBeVisible();
  await expect(page.getByText('No notes yet')).toBeVisible();
  await expect(page.getByText('Receipt not yet uploaded')).toBeVisible();

  // Every editable field is disabled (read-only in phase 1).
  await expect(page.getByLabel('Amount')).toBeDisabled();
  await expect(page.getByLabel('Currency')).toBeDisabled();
  await expect(page.getByLabel('Type')).toBeDisabled();
  await expect(page.getByLabel('Receipt date')).toBeDisabled();
  await expect(page.getByLabel('Region')).toBeDisabled();
  await expect(page.getByLabel('Project')).toBeDisabled();
  await expect(page.getByLabel('Description')).toBeDisabled();

  // Consultants do not see the finance review form.
  await expect(page.getByRole('heading', { name: 'Review Decision' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Approve' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Back to My Expenses' }).click();
  await expect(page).toHaveURL(/\/expenses/);
});

test('consultant cannot view an expense they did not submit', async ({ page }) => {
  await loginAs(page, 'alice@netcompany.com');

  // e3c4d5e6-... was submitted by u3 (Tom), not Alice. The ownership check renders
  // the same 404 as an unknown id (ADR-0012) so the response doesn't reveal
  // that the expense exists.
  await page.goto('/expenses/e3c4d5e6-f7a8-b9c0-d1e2-f3a4b5c6d7e8');

  await expect(page.getByText('404')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
});
