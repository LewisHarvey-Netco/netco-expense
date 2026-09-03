# 08: Add Documentation & E2E Tests

**What to build:** Document the consultant expense viewing feature in architecture and decision records. Update `docs/architecture.md` with a new section describing the role-aware detail component pattern, repository-level filtering, why the detail page serves both roles, and the phase 2 vision. Create a new ADR (`docs/decisions/ADR-XXXX-role-aware-expense-detail.md`) documenting the decision to use a single detail page with conditional rendering. Add comprehensive E2E tests covering the full consultant workflow (login → list → filter → detail → back, ownership check redirect) and verify the finance workflow remains unchanged.

**Blocked by:** 4, 6, 7

**Status:** done (2026-09-02)

- [x] Update `docs/architecture.md` with new section: "Consultant Expense Viewing" describing role-aware detail component, repository filtering, why single detail page, and phase 2 vision
- [x] Create new ADR `docs/decisions/ADR-XXXX-role-aware-expense-detail.md` documenting: decision (single detail page vs. separate pages), rationale (code reuse, centralized logic, maintenance), consequences (component aware of role via useAuth), alternatives considered
- [x] Add E2E test: Consultant login → list page → filter expenses by status/type/date → verify results
- [x] Add E2E test: Consultant click expense row → navigate to detail → verify all fields read-only → click back → return to list
- [x] Add E2E test: Consultant URL manipulation to view another consultant's expense → redirect to 404
- [x] Add E2E test: Finance login → review page → verify all expenses visible (unchanged behavior)
- [x] Add E2E test: Finance navigate to `/review/:id` → verify detail + review form render (unchanged behavior)
- [x] Add E2E test: Consultant header link "My Expenses" → navigate to `/expenses`, Finance header link "Review Expenses" → navigate to `/review`

Notes: the ADR already existed as `docs/decisions/architecture/0012-role-aware-expense-detail-page.md`
(created in ticket 04) with decision/rationale/consequences; this ticket added the missing
"Alternatives Considered" section (separate pages, config-object pattern, redirect-on-mismatch)
rather than creating a duplicate ADR. The finance-unchanged and header-link E2E items were already
covered: `review-page.spec.ts` + `review-decision.spec.ts` (finance list/detail/form) and
`Header.test.tsx` (link visibility, href, navigation, active state for both roles), so no new tests
were added for them. New E2E coverage lives in `e2e/expenses-consultant.spec.ts` (3 tests: scoped
list + status/type/date filters, read-only detail + back navigation, ownership-mismatch 404).
Note: the ownership 404 renders `NotFoundPage` in place (same as an unknown id, per ADR-0012)
rather than redirecting; the test asserts the 404 content.
