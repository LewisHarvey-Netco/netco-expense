import type { Page } from '@playwright/test';

export async function loginAs(page: Page, email: string) {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
}

/**
 * Locates the expense status badge on the detail page. Scoped to the badge
 * element because plain text locators are ambiguous: e.g. "Submitted" also
 * matches the submission-date field label in the detail card, and the header
 * renders its own (role) badge.
 */
export function statusBadge(page: Page, status: string) {
  return page.locator('[data-slot="badge"]', { hasText: new RegExp(`^${status}$`) });
}
