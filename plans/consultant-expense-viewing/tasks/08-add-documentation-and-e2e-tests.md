# 08: Add Documentation & E2E Tests

**What to build:** Document the consultant expense viewing feature in architecture and decision records. Update `docs/architecture.md` with a new section describing the role-aware detail component pattern, repository-level filtering, why the detail page serves both roles, and the phase 2 vision. Create a new ADR (`docs/decisions/ADR-XXXX-role-aware-expense-detail.md`) documenting the decision to use a single detail page with conditional rendering. Add comprehensive E2E tests covering the full consultant workflow (login → list → filter → detail → back, ownership check redirect) and verify the finance workflow remains unchanged.

**Blocked by:** 4, 6, 7

**Status:** ready-for-agent

- [ ] Update `docs/architecture.md` with new section: "Consultant Expense Viewing" describing role-aware detail component, repository filtering, why single detail page, and phase 2 vision
- [ ] Create new ADR `docs/decisions/ADR-XXXX-role-aware-expense-detail.md` documenting: decision (single detail page vs. separate pages), rationale (code reuse, centralized logic, maintenance), consequences (component aware of role via useAuth), alternatives considered
- [ ] Add E2E test: Consultant login → list page → filter expenses by status/type/date → verify results
- [ ] Add E2E test: Consultant click expense row → navigate to detail → verify all fields read-only → click back → return to list
- [ ] Add E2E test: Consultant URL manipulation to view another consultant's expense → redirect to 404
- [ ] Add E2E test: Finance login → review page → verify all expenses visible (unchanged behavior)
- [ ] Add E2E test: Finance navigate to `/review/:id` → verify detail + review form render (unchanged behavior)
- [ ] Add E2E test: Consultant header link "My Expenses" → navigate to `/expenses`, Finance header link "Review Expenses" → navigate to `/review`
