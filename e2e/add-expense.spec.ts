import { test, expect } from '@playwright/test';
import { loginAs, statusBadge, expectDetailPageLoaded } from './helpers';

// Test data notes:
// - Alice Nielsen (alice@netcompany.com, u1) is a consultant; Bob Madsen
//   (bob@netcompany.com, u2) is finance. See src/mocks/users.json.
// - The mock repository is in-memory and re-seeded from the mock JSON on every
//   full page load (ADR-0010), so each test starts from the baseline mock data.
// - The create form's defaults come from the template in ExpenseCreatePage:
//   today's date (YYYY-MM-DD), USD currency, amount 0, type Breakfast,
//   Submitted status, submitter = current user.
// - The detail page for a newly created expense is the same role-aware
//   ExpenseDetailPage as the edit flow; `expectDetailPageLoaded` and
//   `statusBadge` from helpers.ts apply.
// - Scope: the repository-failure error path is intentionally NOT covered here.
//   MockExpenseRepository.createExpense() has no user-triggerable failure in the
//   create flow, so simulating it would require a test-only seam in production
//   code (rejected — see the scope decision in
//   plans/add-new-expense/tickets/04-e2e-tests-full-workflow.md). Repository
//   failure/retry is covered at the RTL layer in
//   src/pages/ExpenseCreatePage.test.tsx (injected mock repository). This spec
//   covers the user-triggerable validation error path instead, matching the
//   pattern in expenses-consultant-edit.spec.ts.

test('consultant creates a new expense and lands on the detail page', async ({ page }) => {
  await loginAs(page, 'alice@netcompany.com');
  await expect(page).toHaveURL(/\/expenses/);

  // Discover the creation page from the list's "New Expense" button.
  await page.getByRole('button', { name: 'New Expense' }).click();
  await expect(page).toHaveURL(/\/expenses\/new/);
  await expect(page.getByRole('heading', { name: 'New Expense' })).toBeVisible();

  // The form shows the template defaults.
  await expect(page.getByLabel('Amount')).toHaveValue('0');
  await expect(page.getByLabel('Currency')).toHaveValue('USD');
  await expect(page.getByLabel('Receipt date')).toHaveValue(
    new Date().toISOString().slice(0, 10),
  );
  // The select trigger's text includes the chevron glyph, so match a substring.
  await expect(page.getByLabel('Type')).toContainText('Breakfast');
  await expect(page.getByLabel('Region')).toHaveValue('');
  await expect(page.getByLabel('Project')).toHaveValue('');
  await expect(page.getByLabel('Description')).toHaveValue('');
  // The template is initialized with Submitted status and the current user.
  await expect(statusBadge(page, 'Submitted')).toBeVisible();
  await expect(page.locator('main').getByText('Alice Nielsen')).toBeVisible();

  // Fill all required fields (amount, description, region, project are
  // required by the schema; currency and receipt date keep their defaults).
  await page.getByLabel('Amount').fill('150');
  await page.getByLabel('Region').fill('Nordics');
  await page.getByLabel('Project').fill('Greenfield ERP');
  await page.getByLabel('Description').fill('E2E test expense for the create workflow');

  await page.getByRole('button', { name: 'Submit' }).click();

  // The success message appears, then the page navigates to the detail page
  // after a short delay (ExpenseCreatePage.handleCreate).
  await expect(page.getByText('Expense submitted successfully.')).toBeVisible();
  await expect(page).toHaveURL(/\/expenses\/[0-9a-f-]{36}/);
  await expectDetailPageLoaded(page);

  // The detail page shows the created expense with its values and status.
  await expect(statusBadge(page, 'Submitted')).toBeVisible();
  await expect(page.getByLabel('Amount')).toHaveValue('150');
  await expect(page.getByLabel('Currency')).toHaveValue('USD');
  await expect(page.getByLabel('Region')).toHaveValue('Nordics');
  await expect(page.getByLabel('Project')).toHaveValue('Greenfield ERP');
  await expect(page.getByLabel('Description')).toHaveValue(
    'E2E test expense for the create workflow',
  );
});

test('consultant recovers from an invalid submission and retries', async ({ page }) => {
  await loginAs(page, 'alice@netcompany.com');
  await expect(page).toHaveURL(/\/expenses/);

  await page.getByRole('button', { name: 'New Expense' }).click();
  await expect(page).toHaveURL(/\/expenses\/new/);

  // Fill everything except the amount, which is left at its invalid default
  // of 0 (the schema requires a positive number).
  await page.getByLabel('Region').fill('Nordics');
  await page.getByLabel('Project').fill('Greenfield ERP');
  await page.getByLabel('Description').fill('E2E test expense with an invalid amount');

  await page.getByRole('button', { name: 'Submit' }).click();

  // The failed submission is not recorded; the inline error shows and the
  // form data persists.
  await expect(page.getByText('Amount must be greater than 0')).toBeVisible();
  await expect(page).toHaveURL(/\/expenses\/new/);
  await expect(page.getByLabel('Region')).toHaveValue('Nordics');
  await expect(page.getByLabel('Project')).toHaveValue('Greenfield ERP');
  await expect(page.getByLabel('Description')).toHaveValue(
    'E2E test expense with an invalid amount',
  );
  await expect(page.getByRole('button', { name: 'Submit' })).toBeEnabled();

  // Correct the issue and retry.
  await page.getByLabel('Amount').fill('75');
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(page.getByText('Expense submitted successfully.')).toBeVisible();
  await expect(page).toHaveURL(/\/expenses\/[0-9a-f-]{36}/);
  await expectDetailPageLoaded(page);
  await expect(statusBadge(page, 'Submitted')).toBeVisible();
  await expect(page.getByLabel('Amount')).toHaveValue('75');
});

test('unauthenticated user is redirected to login from the new expense page', async ({
  page,
}) => {
  await page.goto('/expenses/new');

  await expect(page).toHaveURL(/\/login/);
  // The login card's title is a CardTitle (a plain div, not a heading), so
  // match by text.
  await expect(page.getByText('Netco Expense', { exact: true })).toBeVisible();
});

test('finance user is redirected away from the new expense page', async ({ page }) => {
  await loginAs(page, 'bob@netcompany.com');
  await expect(page).toHaveURL(/\/review/);

  await page.goto('/expenses/new');

  // The route guard redirects to the finance user's role home, not /login.
  await expect(page).toHaveURL(/\/review/);
  await expect(page.getByRole('heading', { name: 'All Expenses' })).toBeVisible();
});
