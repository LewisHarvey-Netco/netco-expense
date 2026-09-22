import { test as base, expect, type Page } from '@playwright/test';

// Set when a user is watching a headed run (e.g. PLAYWRIGHT_SLOW_MO=800).
// Used to hold the result banner for a couple of seconds between tests.
const slowMo = parseInt(process.env.PLAYWRIGHT_SLOW_MO || '0', 10);

/**
 * Exports a `test` fixture that wraps the default `page` to inject a fixed
 * banner at the top of the page showing the title of the currently running
 * e2e test. This lets a user watching a headed run
 * (`$env:PLAYWRIGHT_SLOW_MO=800; npm run test:e2e:headed`) always see which
 * test is running. Specs should import `test` (and `expect`) from this file
 * instead of directly from `@playwright/test`.
 *
 * The banner is applied via `addInitScript`, so it is re-applied after every
 * full page load; SPA navigations keep it because the DOM persists.
 *
 * When `PLAYWRIGHT_SLOW_MO` is set (i.e. a human is watching), after each test
 * the banner is updated to show the outcome (PASSED/FAILED) and the page is
 * held for a couple of seconds so the user can see the final state before the
 * next test starts. Headless/CI runs (no slowMo) skip the hold.
 */
export const test = base.extend<{ page: Page }>({
  page: async ({ page }, use, info) => {
    await page.addInitScript((title: string) => {
      const inject = () => {
        const existing = document.getElementById('e2e-test-banner');
        if (existing) existing.remove();
        const banner = document.createElement('div');
        banner.id = 'e2e-test-banner';
        banner.textContent = `E2E: ${title}`;
        Object.assign(banner.style, {
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          zIndex: '2147483647',
          pointerEvents: 'none',
          backgroundColor: '#141E1E',
          color: '#FFFFFF',
          font: 'bold 14px/1.4 "Studio 6", Arial, sans-serif',
          padding: '8px 16px',
          textAlign: 'center',
          letterSpacing: '0.02em',
          borderBottom: '3px solid #FF6359',
        } as CSSStyleDeclaration);
        document.body.prepend(banner);
      };
      // The init script runs before the page's scripts, when <body> may not
      // exist yet. Inject immediately if body is present, otherwise wait for
      // DOMContentLoaded.
      if (document.body) {
        inject();
      } else {
        document.addEventListener('DOMContentLoaded', inject);
      }
    }, info.title);

    // Capture whether the test body threw so the banner can show the outcome.
    let failed = false;
    try {
      await use(page);
    } catch (error) {
      failed = true;
      throw error;
    }

    // Update the banner to show the outcome, then hold the page at its final
    // state for a couple of seconds so the user can see it.
    try {
      await page.evaluate(({ title, wasFailed }: { title: string; wasFailed: boolean }) => {
        const banner = document.getElementById('e2e-test-banner');
        if (!banner) return;
        banner.textContent = `E2E: ${title} — ${wasFailed ? 'FAILED' : 'PASSED'}`;
        banner.style.borderBottom = `3px solid ${wasFailed ? '#FF6359' : '#718886'}`;
      }, { title: info.title, wasFailed: failed });
    } catch {
      // The page may already be closing; nothing else to do.
    }
    if (slowMo > 0) {
      await page.waitForTimeout(2000);
    }
  },
});

export { expect };

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
