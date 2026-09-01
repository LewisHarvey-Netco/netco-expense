# TODO

## Blocking Go-Live
*(Must be done before release)*

- [ ] Remove mocked users (`src/mocks/users.json`) and replace with real backend authentication once a backend exists.
- [ ] Implement token-based sessions: store JWT in sessionStorage instead of the user object, attach to API requests, and handle token expiry and refresh

## Should-Do
*(Important, but not blocking)*

- [ ] Add error boundary component to catch unexpected React errors and show a fallback UI instead of crashing the app
- [ ] Expand expense review notes from a single `internalNotes` string into a full conversation history (multiple timestamped entries), and display the full thread on the expense detail view instead of just the latest single note

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

