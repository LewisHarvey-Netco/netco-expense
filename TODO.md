# TODO

## Blocking Go-Live
*(Must be done before release)*

- [ ] Remove mocked users (`src/mocks/users.json`) and replace with real backend authentication once a backend exists.
- [ ] Implement token-based sessions: store JWT in sessionStorage instead of the user object, attach to API requests, and handle token expiry and refresh

## Should-Do
*(Important, but not blocking)*

- [ ] Add error boundary component to catch unexpected React errors and show a fallback UI instead of crashing the app

## Nice-to-Have
*(Low priority, polish)*

- [ ] Find a cleaner way to slow down E2E tests for visual inspection instead of `waitForTimeout` on every line (e.g., Playwright Trace Viewer or a dedicated watch mode)
- [ ] Add dark mode toggle
- [ ] Add expense export (CSV/PDF) functionality
- [ ] Add keyboard shortcuts for common actions
