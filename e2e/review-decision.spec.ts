import { test, expect } from '@playwright/test';
import { loginAs, statusBadge, expectDetailPageLoaded } from './helpers';

// Test data notes (see src/mocks/expenses.json):
// - The mock repository is in-memory and re-seeded from the mock JSON on every
//   page load (ADR-0010, extended by ADR-0011), so each test starts from the baseline mock data.
// - The expenses used below all start as "Submitted", a decidable state (ADR-0007):
//   - "Taxi to Copenhagen airport for client visit"  (e2b3c4d5-..., 420.00 DKK, Alice)
//   - "Team dinner at client premises in London"      (e5e6f7a8-..., 156.75 GBP, Tom)
//   - "Uber from office to client site in Amsterdam"  (e8b9c0d1-..., 35.50 EUR, Alice)
// - The /review page now reads from the repository via `getExpenses()` (ADR-0011), so when
//   a decision is recorded, returning to /review shows the updated status immediately
//   without a page reload.

test('finance approves a submitted expense', async ({ page }) => {
  await loginAs(page, 'bob@netcompany.com');

  await page.getByText('Taxi to Copenhagen airport for client visit').click();

  await expect(page).toHaveURL(/\/review\/e2b3c4d5-e6f7-4a8b-9c0d-e2f3a4b5c6d7/);
  await expect(statusBadge(page, 'Submitted')).toBeVisible();

  await page.getByRole('button', { name: 'Approve' }).click();
  await page.getByRole('button', { name: 'Submit Decision' }).click();

  await expect(page.getByText('Approved', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Decision recorded. This expense has been approved.'),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Approve' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Request Changes' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Submit Decision' })).toBeDisabled();
});

test('finance requests changes with a comment', async ({ page }) => {
  await loginAs(page, 'bob@netcompany.com');

  await page.getByText('Team dinner at client premises in London').click();

  await expect(page).toHaveURL(/\/review\/e5e6f7a8-b9c0-4d1e-8f3a-b5c6d7e8f9a0/);
  await expect(statusBadge(page, 'Submitted')).toBeVisible();

  await page.getByRole('button', { name: 'Request Changes' }).click();
  await page
    .getByLabel('Comment')
    .fill('Dinner requires pre-approval. Please add the approval reference.');
  await page.getByRole('button', { name: 'Submit Decision' }).click();

  await expect(page.getByText('Changes Requested', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Changes have been requested. Waiting for the consultant to resubmit.'),
  ).toBeVisible();
  // The comment is stored as internalNotes and rendered under "Internal notes".
  const internalNotes = page.getByText('Internal notes', { exact: true }).locator('..');
  await expect(internalNotes).toContainText(
    'Dinner requires pre-approval. Please add the approval reference.',
  );
  await expect(page.getByRole('button', { name: 'Approve' })).toBeDisabled();
});

test('requesting changes without a comment shows a validation error', async ({ page }) => {
  await loginAs(page, 'bob@netcompany.com');

  await page.getByText('Uber from office to client site in Amsterdam').click();

  await expect(page).toHaveURL(/\/review\/e8b9c0d1-e2f3-4a4b-9c6d-e8f9a0b1c2d3/);

  await page.getByRole('button', { name: 'Request Changes' }).click();
  await page.getByRole('button', { name: 'Submit Decision' }).click();

  await expect(
    page.getByText('Comment is required when requesting changes'),
  ).toBeVisible();
  // The decision was not recorded; the expense is still decidable.
  await expect(statusBadge(page, 'Submitted')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Approve' })).toBeEnabled();
});

test('a recorded decision persists across navigation', async ({ page }) => {
  await loginAs(page, 'bob@netcompany.com');

  await page.getByText('Taxi to Copenhagen airport for client visit').click();
  await page.getByRole('button', { name: 'Approve' }).click();
  await page.getByRole('button', { name: 'Submit Decision' }).click();
  await expect(page.getByText('Approved', { exact: true })).toBeVisible();

  // The repository is in-memory (ADR-0010), so the decision survives SPA
  // navigation within the session. When returning to /review, the list now
  // refetches from the repository (ADR-0011) and shows the updated status.
  await page.getByRole('button', { name: 'Back to All Expenses' }).click();
  await expect(page).toHaveURL(/\/review/);
  await page.getByText('Taxi to Copenhagen airport for client visit').click();
  await expectDetailPageLoaded(page);

  await expect(statusBadge(page, 'Approved')).toBeVisible();
  await expect(
    page.getByText('Decision recorded. This expense has been approved.'),
  ).toBeVisible();
});

test('the expense list shows updated status immediately on return from detail page', async ({ page }) => {
  await loginAs(page, 'bob@netcompany.com');

  // Start on the review list
  await expect(page).toHaveURL(/\/review/);
  const expenseRow = page.getByText('Taxi to Copenhagen airport for client visit');
  await expect(expenseRow).toBeVisible();

  // Navigate to the detail page
  await expenseRow.click();
  await expect(page).toHaveURL(/\/review\/e2b3c4d5-e6f7-4a8b-9c0d-e2f3a4b5c6d7/);

  // Approve the expense
  await page.getByRole('button', { name: 'Approve' }).click();
  await page.getByRole('button', { name: 'Submit Decision' }).click();
  await expect(page.getByText('Approved', { exact: true })).toBeVisible();

  // Return to the list
  await page.getByRole('button', { name: 'Back to All Expenses' }).click();
  await expect(page).toHaveURL(/\/review/);

  // The list should now show the updated status in the row
  const rowWithApproved = page.locator('tbody tr', {
    has: page.getByText('Taxi to Copenhagen airport for client visit'),
  });
  await expect(rowWithApproved.getByText('Approved')).toBeVisible();
});
