import { test, expect } from '@playwright/test';
import { loginAs, loginAsSpa, statusBadge, expectDetailPageLoaded } from './helpers';

// Test data notes (see src/mocks/expenses.json):
// - All expenses below were submitted by Alice (u1, consultant):
//   - "Client lunch meeting at Restaurant Noma"    (e1a2b3c4-..., 185.50 DKK, Approved)
//   - "Taxi to Copenhagen airport for client visit" (e2b3c4d5-..., 420.00 DKK, Submitted)
//   - "Working breakfast with stakeholders"         (e4d5e6f7-..., 45.00 EUR, Changes Requested)
//   - "Train ticket Copenhagen to Malmö"            (e6f7a8b9-..., 289.00 DKK, Resubmitted)
//   - "Uber from office to client site in Amsterdam" (e8b9c0d1-..., 35.50 EUR, Submitted)
// - The mock repository is in-memory and re-seeded from the mock JSON on every
//   full page load (ADR-0010), so each test starts from the baseline mock data.
//   SPA navigation within a test (detail → list → detail, logout → login) keeps
//   the in-memory state, which the last test relies on.
// - After each list → detail navigation, `expectDetailPageLoaded` waits for the
//   detail card to render before asserting on the (unscoped) status badge, since
//   the URL updates via pushState before React re-renders the route.

test('consultant edits and resubmits a Submitted expense', async ({ page }) => {
  await loginAs(page, 'alice@netcompany.com');
  await expect(page).toHaveURL(/\/expenses/);

  await page.getByText('Taxi to Copenhagen airport for client visit').click();
  await expect(page).toHaveURL(/\/expenses\/e2b3c4d5-e6f7-4a8b-9c0d-e2f3a4b5c6d7/);
  await expectDetailPageLoaded(page);
  await expect(statusBadge(page, 'Submitted')).toBeVisible();

  // A Submitted expense is editable by its submitter (ADR-0013).
  await expect(page.getByLabel('Amount')).toBeEnabled();
  await expect(page.getByLabel('Description')).toBeEnabled();

  await page.getByLabel('Amount').fill('415');
  await page.getByRole('button', { name: 'Resubmit' }).click();

  await expect(page.getByText('Expense resubmitted successfully.')).toBeVisible();
  await expect(statusBadge(page, 'Resubmitted')).toBeVisible();
  await expect(page.getByLabel('Amount')).toHaveValue('415');

  await page.getByRole('button', { name: 'Back to Expenses' }).click();
  await expect(page).toHaveURL(/\/expenses/);

  // The list refetches from the repository (ADR-0011) and shows the update.
  const row = page.locator('tbody tr', {
    has: page.getByText('Taxi to Copenhagen airport for client visit'),
  });
  await expect(row.getByText('Resubmitted')).toBeVisible();
  await expect(row.getByText('415.00 DKK')).toBeVisible();
});

test('consultant addresses finance feedback on a Changes Requested expense', async ({
  page,
}) => {
  await loginAs(page, 'alice@netcompany.com');

  await page.getByText('Working breakfast with stakeholders').click();
  await expect(page).toHaveURL(/\/expenses\/e4d5e6f7-a8b9-4c0d-9e2f-a4b5c6d7e8f9/);
  await expectDetailPageLoaded(page);
  await expect(statusBadge(page, 'Changes Requested')).toBeVisible();

  // The finance feedback is visible to the consultant (internal notes).
  await expect(
    page.getByText(
      'Receipt missing VAT breakdown. Please resubmit with itemized receipt showing VAT.',
    ),
  ).toBeVisible();

  // Edit the description to address the feedback, then resubmit.
  await page
    .getByLabel('Description')
    .fill('Working breakfast with stakeholders (itemized receipt with VAT breakdown attached)');
  await page.getByRole('button', { name: 'Resubmit' }).click();

  await expect(page.getByText('Expense resubmitted successfully.')).toBeVisible();
  await expect(statusBadge(page, 'Resubmitted')).toBeVisible();
});

test('consultant can edit a Resubmitted expense again before finance re-reviews', async ({
  page,
}) => {
  await loginAs(page, 'alice@netcompany.com');

  await page.getByText('Train ticket Copenhagen to Malmö').click();
  await expect(page).toHaveURL(/\/expenses\/e6f7a8b9-c0d1-4e2f-9a4b-c6d7e8f9a0b1/);
  await expectDetailPageLoaded(page);
  await expect(statusBadge(page, 'Resubmitted')).toBeVisible();
  await expect(page.getByLabel('Amount')).toBeEnabled();

  // First edit on a Resubmitted expense.
  await page.getByLabel('Amount').fill('300');
  await page.getByRole('button', { name: 'Resubmit' }).click();
  await expect(page.getByText('Expense resubmitted successfully.')).toBeVisible();
  await expect(statusBadge(page, 'Resubmitted')).toBeVisible();

  // Back to the list and reopen the same expense: it is still editable while
  // awaiting finance re-review.
  await page.getByRole('button', { name: 'Back to Expenses' }).click();
  await expect(page).toHaveURL(/\/expenses/);
  await page.getByText('Train ticket Copenhagen to Malmö').click();
  await expect(page).toHaveURL(/\/expenses\/e6f7a8b9-c0d1-4e2f-9a4b-c6d7e8f9a0b1/);
  await expectDetailPageLoaded(page);
  await expect(statusBadge(page, 'Resubmitted')).toBeVisible();
  await expect(page.getByLabel('Amount')).toHaveValue('300');
  await expect(page.getByLabel('Amount')).toBeEnabled();

  // Second edit; the status stays Resubmitted.
  await page.getByLabel('Amount').fill('295');
  await page.getByRole('button', { name: 'Resubmit' }).click();
  await expect(page.getByText('Expense resubmitted successfully.')).toBeVisible();
  await expect(statusBadge(page, 'Resubmitted')).toBeVisible();
  await expect(page.getByLabel('Amount')).toHaveValue('295');
});

test('consultant cannot edit an Approved expense', async ({ page }) => {
  await loginAs(page, 'alice@netcompany.com');

  await page.getByText('Client lunch meeting at Restaurant Noma').click();
  await expect(page).toHaveURL(/\/expenses\/e1a2b3c4-d5e6-4f7a-8b9c-d1e2f3a4b5c6/);
  await expectDetailPageLoaded(page);
  await expect(statusBadge(page, 'Approved')).toBeVisible();

  // Approved is terminal: every form field is disabled...
  await expect(page.getByLabel('Amount')).toBeDisabled();
  await expect(page.getByLabel('Currency')).toBeDisabled();
  await expect(page.getByLabel('Type')).toBeDisabled();
  await expect(page.getByLabel('Receipt date')).toBeDisabled();
  await expect(page.getByLabel('Region')).toBeDisabled();
  await expect(page.getByLabel('Project')).toBeDisabled();
  await expect(page.getByLabel('Description')).toBeDisabled();

  // ...and there is no way to submit (no Resubmit button).
  await expect(page.getByRole('button', { name: 'Resubmit' })).toHaveCount(0);
});

test('consultant recovers from an invalid resubmission and retries', async ({ page }) => {
  await loginAs(page, 'alice@netcompany.com');

  await page.getByText('Uber from office to client site in Amsterdam').click();
  await expect(page).toHaveURL(/\/expenses\/e8b9c0d1-e2f3-4a4b-9c6d-e8f9a0b1c2d3/);
  await expectDetailPageLoaded(page);
  await expect(statusBadge(page, 'Submitted')).toBeVisible();

  // An empty amount is invalid; the schema requires a positive number. The
  // inline error reserves its space, so it appearing on the button's own
  // mousedown blur does not shift the form and the click still lands.
  await page.getByLabel('Amount').fill('');
  await page.getByRole('button', { name: 'Resubmit' }).click();

  // The failed submission is not recorded; the error and status persist.
  await expect(page.getByText('Amount must be a number')).toBeVisible();
  await expect(statusBadge(page, 'Submitted')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Resubmit' })).toBeEnabled();

  // Correct the issue and retry.
  await page.getByLabel('Amount').fill('36');
  await page.getByRole('button', { name: 'Resubmit' }).click();
  await expect(page.getByText('Expense resubmitted successfully.')).toBeVisible();
  await expect(statusBadge(page, 'Resubmitted')).toBeVisible();
  await expect(page.getByLabel('Amount')).toHaveValue('36');
});

test('finance re-reviews and approves a Resubmitted expense, locking it for the consultant', async ({
  page,
}) => {
  // Finance side: the Resubmitted expense is decidable again.
  await loginAs(page, 'bob@netcompany.com');
  await expect(page).toHaveURL(/\/review/);

  await page.getByText('Train ticket Copenhagen to Malmö').click();
  await expect(page).toHaveURL(/\/review\/e6f7a8b9-c0d1-4e2f-9a4b-c6d7e8f9a0b1/);
  await expectDetailPageLoaded(page);
  await expect(statusBadge(page, 'Resubmitted')).toBeVisible();

  // Finance cannot edit the expense...
  await expect(page.getByLabel('Amount')).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Resubmit' })).toHaveCount(0);

  // ...but the review decision form is present and decidable. (CardTitle is a
  // plain div, not a heading, so match by text.)
  await expect(page.getByText('Review Decision', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Approve' })).toBeEnabled();

  await page.getByRole('button', { name: 'Approve' }).click();
  await page.getByRole('button', { name: 'Submit Decision' }).click();

  await expect(page.getByText('Approved', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Decision recorded. This expense has been approved.'),
  ).toBeVisible();

  // Consultant side: on a subsequent visit the approved expense is read-only.
  // The SPA logout → login keeps the in-memory repository state (ADR-0010), so
  // the approval is still in effect when the consultant opens the expense.
  await page.getByRole('button', { name: 'Logout' }).click();
  await expect(page).toHaveURL(/\/login/);
  await loginAsSpa(page, 'alice@netcompany.com');
  await expect(page).toHaveURL(/\/expenses/);

  await page.getByText('Train ticket Copenhagen to Malmö').click();
  await expect(page).toHaveURL(/\/expenses\/e6f7a8b9-c0d1-4e2f-9a4b-c6d7e8f9a0b1/);
  await expectDetailPageLoaded(page);
  await expect(statusBadge(page, 'Approved')).toBeVisible();
  await expect(page.getByLabel('Amount')).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Resubmit' })).toHaveCount(0);
});
