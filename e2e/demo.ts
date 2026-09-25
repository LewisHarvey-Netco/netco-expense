import { test as base, expect, type Page } from '@playwright/test';

// Set when a human is watching a headed run (e.g. PLAYWRIGHT_SLOW_MO=800).
// Used to hold the banner on "SUCCESS" for a couple of seconds between tasks.
const slowMo = parseInt(process.env.PLAYWRIGHT_SLOW_MO || '0', 10);

// Netcompany palette (DESIGN-GUIDELINES.md). These are passed INTO the page
// as arguments — functions serialized by Playwright cannot reference Node-scope
// variables, so any value used inside addInitScript/evaluate must be an arg.
const DARK_GREEN = '#141E1E';
const WHITE = '#FFFFFF';
const CORAL = '#FF6359';
const GREEN_60 = '#718886';

/**
 * Exports a `test` fixture that wraps the default `page` to inject a fixed
 * banner at the top of the page. The banner narrates a continuous, demo-style
 * end-to-end run: a single test drives a sequence of numbered tasks, and the
 * banner shows the current task and flips to "SUCCESS" as each one completes.
 *
 * The banner is applied via `addInitScript`, so it is re-applied after every
 * full page load; SPA navigations keep it because the DOM persists.
 *
 * Two actions are exposed for the spec to call:
 * - `setTask(n, title)` — banner shows "Task N: <title>" (coral accent border).
 * - `markSuccess(n, title)` — banner shows "Task N: <title> — SUCCESS"
 *   (green-60 border) and, when `PLAYWRIGHT_SLOW_MO` is set, holds for ~2s so
 *   a live audience can see it.
 *
 * If the test body throws, the banner flips to "FAILED" (coral border) and the
 * page is held for a couple of seconds (when slowMo is set) so the failure is
 * visible before the browser closes.
 *
 * Specs should import `test` and `expect` from this file instead of directly
 * from `@playwright/test`.
 */
export const test = base.extend<{ page: Page; setTask: (n: number, title: string) => Promise<void>; markSuccess: (n: number, title: string) => Promise<void> }>({
  page: async ({ page }, use) => {
    await page.addInitScript(
      (p: { dark: string; white: string; coral: string }) => {
        const inject = () => {
          const existing = document.getElementById('e2e-demo-banner');
          if (existing) existing.remove();
          const banner = document.createElement('div');
          banner.id = 'e2e-demo-banner';
          banner.textContent = 'Netco Expense — demo';
          Object.assign(banner.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            zIndex: '2147483647',
            pointerEvents: 'none',
            backgroundColor: p.dark,
            color: p.white,
            font: 'bold 14px/1.4 "Studio 6", Arial, sans-serif',
            padding: '8px 16px',
            textAlign: 'center',
            letterSpacing: '0.02em',
            borderBottom: `3px solid ${p.coral}`,
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
      },
      { dark: DARK_GREEN, white: WHITE, coral: CORAL },
    );

    // Capture whether the test body threw so the banner can show the outcome.
    let failed = false;
    try {
      await use(page);
    } catch (error) {
      failed = true;
      throw error;
    }

    // On failure, flip the banner to FAILED and hold the page at its final
    // state for a couple of seconds so the user can see it.
    if (failed) {
      try {
        await page.evaluate((coral: string) => {
          const banner = document.getElementById('e2e-demo-banner');
          if (!banner) return;
          banner.textContent = `${banner.textContent} — FAILED`;
          banner.style.borderBottom = `3px solid ${coral}`;
        }, CORAL);
      } catch {
        // The page may already be closing; nothing else to do.
      }
      if (slowMo > 0) {
        await page.waitForTimeout(2000);
      }
    }
  },

  setTask: async ({ page }, use) => {
    await use(async (n: number, title: string) => {
      await page.evaluate(
        ({ n, title, coral }: { n: number; title: string; coral: string }) => {
          const banner = document.getElementById('e2e-demo-banner');
          if (!banner) return;
          banner.textContent = `Task ${n}: ${title}`;
          banner.style.borderBottom = `3px solid ${coral}`;
        },
        { n, title, coral: CORAL },
      );
    });
  },

  markSuccess: async ({ page }, use) => {
    await use(async (n: number, title: string) => {
      await page.evaluate(
        ({ n, title, green60 }: { n: number; title: string; green60: string }) => {
          const banner = document.getElementById('e2e-demo-banner');
          if (!banner) return;
          banner.textContent = `Task ${n}: ${title} — SUCCESS`;
          banner.style.borderBottom = `3px solid ${green60}`;
        },
        { n, title, green60: GREEN_60 },
      );
      if (slowMo > 0) {
        await page.waitForTimeout(2000);
      }
    });
  },
});

export { expect };
