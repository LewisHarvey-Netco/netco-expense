# ADR-0009: Dedicated 404 page for unmatched routes

## Status
Accepted

## Context

The catch-all route (`*` in `src/App.tsx`) previously rendered `<Navigate to="/" replace />`,
silently bouncing any unmatched URL back to `/`, which then redirects to the user's role home (or
`/login` if logged out). This meant a mistyped or not-yet-implemented URL was indistinguishable
from a normal navigation — there was no feedback that the requested route didn't exist.

This became visible in practice: clicking an expense row on the Review page navigates to
`/review/:id`, a route that doesn't exist yet (it ships with task 07, the Expense Detail page).
Today that click silently bounces back to `/review` via the catch-all, with no indication to the
user (or to someone debugging the app) that anything went wrong.

## Decision

Replace the catch-all redirect with a dedicated `NotFoundPage` component:

- `<Route path="*" element={<NotFoundPage />} />` instead of `<Route path="*" element={<Navigate to="/" replace />} />`.
- `NotFoundPage` is **public** (not wrapped in `ProtectedRoute`) — a 404 shouldn't require login.
- It shows a short "Page not found" message and a single "Go home" button that calls
  `navigate('/')`, matching the app's convention of navigating via `useNavigate()` rather than
  `<Link>`.
- The `/` route's own behavior is unchanged: `RootRedirect` still sends a logged-in user to their
  role home and a logged-out user to `/login`.

## Rationale

- **Visibility over silence:** A dedicated 404 page makes a missing/mistyped route immediately
  obvious, instead of masking it as a normal redirect.
- **Consistent with existing page conventions:** Reuses the centered `Card` layout pattern from
  `LoginPage` (a public page with no `Header`), and the app-wide `useNavigate()` convention — no
  new patterns introduced.
- **Public, not gated:** A 404 is about the URL, not the user's identity — gating it behind auth
  would show a wrong/misleading page (e.g. a redirect to `/login`) for a logged-out user hitting a
  bad link.
- **Minimal footprint:** Single new component, one route table change, no changes to
  `RootRedirect`, `ProtectedRoute`, or the `/` behavior.

## Consequences

- **Row-click to `/review/:id` now shows the 404 page** (instead of silently bouncing back to
  `/review`) until task 07 adds the real `/review/:id` route. This is an accepted, temporary
  trade-off — it surfaces the missing route rather than hiding it.
- **`docs/architecture.md`'s route table and "key principle" section were updated** to reflect
  that the catch-all renders `NotFoundPage` rather than redirecting.
- No change to the authenticated route-guard behavior (`ProtectedRoute`) — the "no return to
  originally requested URL" principle still applies there; this ADR only concerns the catch-all
  for URLs that don't match any declared route at all.
