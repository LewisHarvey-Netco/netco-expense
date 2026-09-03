# 04: Refactor `ExpenseDetailPage` to Role-Aware Layout

**What to build:** Refactor `ExpenseDetailPage` to serve both `/review/:id` (finance) and `/expenses/:id` (consultant) routes with conditional rendering based on user role. Use `useAuth()` to determine role and render two-column layout for finance (detail card + review section) or single-column layout for consultant (detail card only). Implement ownership check for consultants: redirect to 404 if `expense.submitterId !== user.id`. This single-page approach eliminates duplication while maintaining clear role boundaries.

**Blocked by:** 2, 3

**Status:** done (2026-09-02)

- [x] Update `ExpenseDetailPage` to use `useAuth()` hook to determine current user's role
- [x] Render two-column layout (detail card left, review section right) when `role === 'finance'`
- [x] Render single-column layout (detail card only) when `role === 'consultant'`
- [x] Implement ownership check for consultants: verify `expense.submitterId === user.id` before rendering
- [x] Redirect to 404 page on ownership check failure (no indication resource exists)
- [x] Pass `role` prop to `ExpenseDetailCard` for role-aware internal notes visibility
- [x] Wire `ExpenseReviewSection` submit handler to call `updateExpenseStatus()` (finance only)
- [x] Add tests in `ExpenseDetailPage.test.tsx` verifying: role-aware rendering, finance sees review form, consultant sees detail-only, ownership check redirects on mismatch, loading/error states

Notes: ownership mismatch renders `NotFoundPage` in place (same as unknown id, no
existence leak) rather than a client-side redirect; `!user` fails closed to the 404;
a load-error state was added for rejected `getExpense()` calls. The `/expenses/:id`
route wiring is ticket 07. See ADR-0012.
