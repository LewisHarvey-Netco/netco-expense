# ADR-0003: Two-layer testing strategy (integration-style RTL + Playwright E2E)

## Status
Accepted

## Context

The app needed test coverage for its auth/routing flow (login → role-based redirect → route
guarding) from the start. A decision was needed on what kind of tests to write and where the line
between them sits, to avoid duplicated or misplaced coverage as the app grows.

## Decision

Use two distinct, deliberately non-overlapping test layers:

1. **Vitest + React Testing Library**, testing through user-facing interactions (typing into
   real form fields, clicking real buttons) against the actual `App` component tree, rather than
   calling internal functions/hooks directly or unit-testing components in isolation.
2. **Playwright**, testing the same flows end-to-end against a real browser and real dev server.

## Rationale

- The riskiest logic in the app (auth + role-based routing) is cross-cutting by nature — it
  only makes sense to verify by exercising the real component tree, not by unit-testing
  `AuthContext` or `ProtectedRoute` in isolation.
- RTL tests run fast and in-process (jsdom), making them suitable as the primary, frequently-run
  safety net (`npm run test`).
- Playwright tests are slower but catch issues RTL/jsdom cannot (real navigation, real rendering,
  real browser behavior), so they're kept as a smaller, separate E2E layer rather than the
  primary one.

## Consequences

- There are currently no isolated unit tests for small pure functions (e.g. `roleHome()`) — they
  are covered indirectly through the integration-style tests. This is intentional, not a coverage
  gap, given the app's current size.
- As the app grows, some logic may become complex enough to warrant dedicated unit tests
  alongside the two existing layers; that should be a deliberate addition, not a replacement for
  either existing layer.
- Playwright E2E tests intentionally slow themselves down with `waitForTimeout` calls for visual
  inspection during `test:e2e:headed` runs — tracked as a Nice-to-Have cleanup in `TODO.md`, not a
  reflection of the overall testing architecture.
