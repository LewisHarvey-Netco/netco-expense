# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: expenses-consultant-edit.spec.ts >> consultant addresses finance feedback on a Changes Requested expense
- Location: e2e\expenses-consultant-edit.spec.ts:50:1

# Error details

```
Error: page.fill: Target page, context or browser has been closed
```

# Test source

```ts
  1  | import { expect, type Page } from '@playwright/test';
  2  | 
  3  | /**
  4  |  * Fills in and submits the login form on a page that is already at /login,
  5  |  * without a full navigation. Unlike `loginAs` (which `page.goto`s and thereby
  6  |  * re-seeds the in-memory mock repository from the mock JSON, ADR-0010), this
  7  |  * preserves SPA state across a logout → login cycle in the same session.
  8  |  */
  9  | export async function loginAsSpa(page: Page, email: string) {
  10 |   await page.fill('input[name="email"]', email);
> 11 |   await page.fill('input[name="password"]', 'password123');
     |              ^ Error: page.fill: Target page, context or browser has been closed
  12 |   await page.click('button[type="submit"]');
  13 | }
  14 | 
  15 | export async function loginAs(page: Page, email: string) {
  16 |   await page.goto('/login');
  17 |   await loginAsSpa(page, email);
  18 | }
  19 | 
  20 | /**
  21 |  * Waits until the expense detail page has rendered into the DOM (and the
  22 |  * previous list page is gone). React Router updates the URL via pushState
  23 |  * before it re-renders the route, so asserting on detail-page elements
  24 |  * immediately after a navigation can still match stale list-page elements.
  25 |  * Waiting for the detail card's title guarantees the detail page — not the
  26 |  * list page — is the one in the DOM before status assertions run.
  27 |  */
  28 | export async function expectDetailPageLoaded(page: Page) {
  29 |   await expect(page.getByText('Expense Details', { exact: true })).toBeVisible();
  30 | }
  31 | 
  32 | /**
  33 |  * Locates the expense status badge on the detail page. Scoped to the badge
  34 |  * element because plain text locators are ambiguous: e.g. "Submitted" also
  35 |  * matches the submission-date field label in the detail card, and the header
  36 |  * renders its own (role) badge. Call `expectDetailPageLoaded` first after a
  37 |  * navigation so the list page's badges are no longer in the DOM.
  38 |  */
  39 | export function statusBadge(page: Page, status: string) {
  40 |   return page.locator('[data-slot="badge"]', { hasText: new RegExp(`^${status}$`) });
  41 | }
  42 | 
```