# 07: Add Route `/expenses/:id` and Update Navigation

**What to build:** Add a new protected route `/expenses/:id` in `App.tsx` for consultant expense detail, guarded by `ProtectedRoute` with `allowedRoles={['consultant']}`. Render `ExpenseDetailPage` (the role-aware component that also serves `/review/:id` for finance). Update the `Header` component to show conditional navigation: "My Expenses" → `/expenses` for consultants, "Review Expenses" → `/review` for finance. Role-based routing prevents cross-role access and keeps navigation clear.

**Blocked by:** 4, 6

**Status:** done (2026-09-02)

- [x] Add `/expenses/:id` route to `App.tsx` with `ProtectedRoute` guard and `allowedRoles={['consultant']}`
- [x] Route renders `ExpenseDetailPage` component
- [x] Update `Header` component to conditionally show navigation links by role
- [x] Render "My Expenses" link to `/expenses` for consultant role
- [x] Render "Review Expenses" link to `/review` for finance role
- [x] Add tests verifying both routes work, roles are enforced, header links render correctly by role

Notes: the finance header link was renamed from "All Expenses" to "Review Expenses" per the
PRD's navigation spec; the `/review` page title remains "All Expenses". Tests that queried the
page title by text (`findByText('My Expenses')`) were switched to heading-role queries because
the consultant header link now shares that text. The consultant detail tests in
`ExpenseDetailPage.test.tsx` now render through the real `App` route table (the stopgap
`renderDetailPageAt` helper, which existed only until this ticket, was removed). Route-level
role enforcement for `/expenses/:id` is covered in `App.test.tsx`; header link behavior
(visibility, href, active state, navigation) is covered in `Header.test.tsx`.
