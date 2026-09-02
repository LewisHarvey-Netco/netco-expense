# 07: Add Route `/expenses/:id` and Update Navigation

**What to build:** Add a new protected route `/expenses/:id` in `App.tsx` for consultant expense detail, guarded by `ProtectedRoute` with `allowedRoles={['consultant']}`. Render `ExpenseDetailPage` (the role-aware component that also serves `/review/:id` for finance). Update the `Header` component to show conditional navigation: "My Expenses" → `/expenses` for consultants, "Review Expenses" → `/review` for finance. Role-based routing prevents cross-role access and keeps navigation clear.

**Blocked by:** 4, 6

**Status:** ready-for-agent

- [ ] Add `/expenses/:id` route to `App.tsx` with `ProtectedRoute` guard and `allowedRoles={['consultant']}`
- [ ] Route renders `ExpenseDetailPage` component
- [ ] Update `Header` component to conditionally show navigation links by role
- [ ] Render "My Expenses" link to `/expenses` for consultant role
- [ ] Render "Review Expenses" link to `/review` for finance role
- [ ] Add tests verifying both routes work, roles are enforced, header links render correctly by role
