import { test, expect } from './demo';
import { loginAsSpa, statusBadge, expectDetailPageLoaded } from './helpers';

// A continuous, narrated end-to-end demo: one test drives six tasks in
// sequence. The fixed banner (injected by the `test` fixture in ./demo) shows
// the current task and flips to "SUCCESS" as each completes, so a live
// audience following a headed run ($env:PLAYWRIGHT_SLOW_MO=800;
// npm run test:e2e:headed) sees the whole story play out.
//
// The in-memory mock repository persists across SPA logout → login (ADR-0010),
// so the consultant's mutations (tasks 2–3) are still in effect when finance
// logs in (tasks 5–6).
test('presentation: consultant + finance full cycle', async ({
  page,
  setTask,
  markSuccess,
}) => {
  // With PLAYWRIGHT_SLOW_MO set (presented runs), every action is delayed and
  // each markSuccess holds ~2s, so the test needs far more than the default
  // 30s timeout. (Playwright 1.62 has no per-test timeout option — the
  // details object only accepts tag/annotation — so set it at runtime.)
  test.setTimeout(180_000);

  // Task 1: Login as consultant.
  // Navigate first: setTask before the first load would run against
  // about:blank, where no banner exists yet, and the narration would be lost.
  await page.goto('/login');
  await setTask(1, 'Login as consultant');
  await loginAsSpa(page, 'alice@netcompany.com');
  await expect(page).toHaveURL(/\/expenses/);
  await markSuccess(1, 'Login as consultant');

  // Task 2: Edit a changes-requested expense and resubmit.
  await setTask(2, 'Edit a changes-requested expense');
  await page.getByText('Working breakfast with stakeholders').click();
  await expect(page).toHaveURL(/\/expenses\/e4d5e6f7-a8b9-4c0d-9e2f-a4b5c6d7e8f9/);
  await expectDetailPageLoaded(page);
  await expect(statusBadge(page, 'Changes Requested')).toBeVisible();

  await page
    .getByLabel('Description')
    .fill('Working breakfast with stakeholders (itemized receipt with VAT breakdown attached)');
  await page.getByRole('button', { name: 'Resubmit' }).click();
  await expect(page.getByText('Expense resubmitted successfully.')).toBeVisible();
  await expect(statusBadge(page, 'Resubmitted')).toBeVisible();
  await markSuccess(2, 'Edit a changes-requested expense');

  // Back to the list for task 3.
  await page.getByRole('button', { name: 'Back to My Expenses' }).click();
  await expect(page).toHaveURL(/\/expenses/);

  // Task 3: Create a new expense.
  await setTask(3, 'Create a new expense');
  await page.getByRole('button', { name: 'New Expense' }).click();
  await expect(page).toHaveURL(/\/expenses\/new/);
  await page.getByLabel('Amount').fill('150');
  await page.getByLabel('Region').fill('Nordics');
  await page.getByLabel('Project').fill('Greenfield ERP');
  await page.getByLabel('Description').fill('E2E presentation expense');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByText('Expense submitted successfully.')).toBeVisible();
  await expect(page).toHaveURL(/\/expenses\/[0-9a-f-]{36}/);
  await expectDetailPageLoaded(page);
  await expect(statusBadge(page, 'Submitted')).toBeVisible();
  await markSuccess(3, 'Create a new expense');

  // Task 4: Log out.
  await setTask(4, 'Log out');
  await page.getByRole('button', { name: 'Logout' }).click();
  await expect(page).toHaveURL(/\/login/);
  await markSuccess(4, 'Log out');

  // Task 5: Login as finance and approve a submitted expense.
  await setTask(5, 'Login as finance and approve an expense');
  await loginAsSpa(page, 'bob@netcompany.com');
  await expect(page).toHaveURL(/\/review/);
  await page.getByText('Taxi to Copenhagen airport for client visit').click();
  await expect(page).toHaveURL(/\/review\/e2b3c4d5-e6f7-4a8b-9c0d-e2f3a4b5c6d7/);
  await expectDetailPageLoaded(page);
  await expect(statusBadge(page, 'Submitted')).toBeVisible();
  await page.getByRole('button', { name: 'Approve' }).click();
  await page.getByRole('button', { name: 'Submit Decision' }).click();
  await expect(
    page.getByText('Decision recorded. This expense has been approved.'),
  ).toBeVisible();
  await expect(statusBadge(page, 'Approved')).toBeVisible();
  await markSuccess(5, 'Login as finance and approve an expense');

  // Back to the list for task 6.
  await page.getByRole('button', { name: 'Back to All Expenses' }).click();
  await expect(page).toHaveURL(/\/review/);

  // Task 6: Flag (request changes) another submitted expense.
  await setTask(6, 'Request changes on another expense');
  await page.getByText('Uber from office to client site in Amsterdam').click();
  await expect(page).toHaveURL(/\/review\/e8b9c0d1-e2f3-4a4b-9c6d-e8f9a0b1c2d3/);
  await expectDetailPageLoaded(page);
  await expect(statusBadge(page, 'Submitted')).toBeVisible();
  await page.getByRole('button', { name: 'Request Changes' }).click();
  await page
    .getByLabel('Comment')
    .fill('Please add the pre-approval reference for this ride.');
  await page.getByRole('button', { name: 'Submit Decision' }).click();
  await expect(
    page.getByText('Changes have been requested. Waiting for the consultant to resubmit.'),
  ).toBeVisible();
  await expect(statusBadge(page, 'Changes Requested')).toBeVisible();
  await markSuccess(6, 'Request changes on another expense');
});
