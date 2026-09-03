# TODO

## Blocking Go-Live
*(Must be done before release)*

- [ ] Remove demo users credentials block from LoginPage (show email, password, and role)
- [ ] Replace mock data with a real backend: remove `src/mocks/users.json` and `src/mocks/expenses.json`, backing both with real API calls — real user accounts for authentication, and an `ApiRepository` implementing `ExpenseRepository` for expense reads/writes. Server-side persistence replaces in-memory mock, so decisions are repulled from API rather than persisted client-side (see ADR-0011).
- [ ] Implement token-based sessions: store JWT in sessionStorage instead of the user object, attach to API requests, and handle token expiry and refresh

## Should-Do
*(Important, but not blocking)*

- [ ] Add error boundary component to catch unexpected React errors and show a fallback UI instead of crashing the app
- [ ] Expand expense review notes from a single `internalNotes` string into a full conversation history (multiple timestamped entries), and display the full thread on the expense detail view instead of just the latest single note
- [ ] Fix Vite `configLoader: 'native'` warning: replace `__dirname` at `vitest.config.ts:8` with `import.meta.dirname` (Vite warns it will become the default in a future major version); also investigate the `No story files found for the specified pattern: src\**\*.mdx` warning from the storybook vitest plugin

## Nice-to-Have
*(Low priority, polish)*

- [x] Find a cleaner way to slow down E2E tests for visual inspection instead of `waitForTimeout` on every line (e.g., Playwright Trace Viewer or a dedicated watch mode) — resolved via Playwright's built-in `slowMo` launch option, configurable with `PLAYWRIGHT_SLOW_MO` env var
- [ ] Add dark mode toggle
- [ ] Add expense export (CSV/PDF) functionality
- [ ] Add keyboard shortcuts for common actions


### REVIEW
- [ ] run an accessability review 
- [ ] text overlapping on table on smaller screens
- [ ] dd/mm/yyyy showing by default on filters, and it overlaps
- [ ] Common Page elements (H1, H2, H3) should share their tailwind for consistency

