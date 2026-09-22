# 04: Add E2E tests for full create workflow

**What to build:** Full end-to-end validation that a consultant can navigate to new expense page, fill the form, submit successfully, and land on the detail page; includes error recovery path.

**Blocked by:** Ticket 03 (needs integration complete).

**Status:** ready-for-agent

## Acceptance Criteria

- [ ] Create `e2e/add-expense.spec.ts` or add to existing `e2e/expenses.spec.ts`
- [ ] Test success path: login as consultant → navigate to `/expenses/new` → verify form shows defaults (today's date, USD, amount 0) → fill all required fields → click Submit → see success message → redirected to `/expenses/{id}` detail page
- [ ] Test error path: fill form → simulate repository failure → error displays → form data persists → retry succeeds
- [ ] Verify that unauthenticated users cannot access `/expenses/new` (redirected to login)
- [ ] Verify that finance users cannot access `/expenses/new` (redirected to home)
- [ ] All E2E tests pass headless and in headed mode