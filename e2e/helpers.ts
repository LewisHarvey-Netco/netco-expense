import { expect, type Page } from '@playwright/test';

/**
 * Fills in and submits the login form on a page that is already at /login,
 * without a full navigation. Unlike `loginAs` (which `page.goto`s and thereby
 * re-seeds the in-memory mock repository from the mock JSON, ADR-0010), this
 * preserves SPA state across a logout → login cycle in the same session.
 */
export async function loginAsSpa(page: Page, email: string) {
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
}

export async function loginAs(page: Page, email: string) {
  await page.goto('/login');
  await loginAsSpa(page, email);
}

/**
 * Waits until the expense detail page has rendered into the DOM (and the
 * previous list page is gone). React Router updates the URL via pushState
 * before it re-renders the route, so asserting on detail-page elements
 * immediately after a navigation can still match stale list-page elements.
 * Waiting for the detail card's title guarantees the detail page — not the
 * list page — is the one in the DOM before status assertions run.
 */
export async function expectDetailPageLoaded(page: Page) {
  await expect(page.getByText('Expense Details', { exact: true })).toBeVisible();
}

/**
 * Locates the expense status badge on the detail page. Scoped to the badge
 * element because plain text locators are ambiguous: e.g. "Submitted" also
 * matches the submission-date field label in the detail card, and the header
 * renders its own (role) badge. Call `expectDetailPageLoaded` first after a
 * navigation so the list page's badges are no longer in the DOM.
 */
export function statusBadge(page: Page, status: string) {
  return page.locator('[data-slot="badge"]', { hasText: new RegExp(`^${status}$`) });
}
