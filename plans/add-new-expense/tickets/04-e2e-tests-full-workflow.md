# 04: Add E2E tests for full create workflow

**What to build:** Full end-to-end validation that a consultant can navigate to new expense page, fill the form, submit successfully, and land on the detail page; includes error recovery path.

**Blocked by:** Ticket 03 (needs integration complete).

**Status:** done (2026-09-22)

## Acceptance Criteria

- [x] Create `e2e/add-expense.spec.ts` or add to existing `e2e/expenses.spec.ts`
- [x] Test success path: login as consultant → navigate to `/expenses/new` → verify form shows defaults (today's date, USD, amount 0) → fill all required fields → click Submit → see success message → redirected to `/expenses/{id}` detail page
- [x] Test error recovery path (client-side validation only): fill form → submit with an invalid (empty) amount → inline validation error displays → form data persists → correct the field → retry succeeds → redirected to detail page
- [x] Verify that unauthenticated users cannot access `/expenses/new` (redirected to login)
- [x] Verify that finance users cannot access `/expenses/new` (redirected to home)
- [x] All E2E tests pass headless and in headed mode

## Scope Decision (2026-09-22)

The original "simulate repository failure" error path is **out of scope for E2E**.
`MockExpenseRepository.createExpense()` has no user-triggerable failure mode in the
create flow (fresh UUID, fixed `Submitted` status, Zod-validated form), so simulating
a repository rejection in E2E would require a test-only seam in production code
(e.g. exposing the repository singleton on `window`), which was rejected: it adds an
undocumented architectural surface, wouldn't survive the ADR-0010 backend swap, and
doesn't model a real failure (a real backend failure has no equivalent E2E seam either
while the mock repository has no network boundary).

Repository-failure and retry behavior is already covered at the correct layer by the
RTL suite in `src/pages/ExpenseCreatePage.test.tsx` (injected mock repository:
`createExpense` rejects → error alert + form data retained → retry succeeds), per the
testing-architecture boundary in `docs/architecture.md` (ADR-0003): RTL tests mock at
the repository boundary; E2E validates real browser behavior. E2E covers the
user-triggerable validation error path instead (same pattern as
`e2e/expenses-consultant-edit.spec.ts`).