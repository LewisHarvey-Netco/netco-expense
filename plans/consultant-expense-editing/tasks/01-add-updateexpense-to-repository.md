# 01: Add `updateExpense()` to Repository Interface

**What to build:** The backend contract for expense updates. Introduces `updateExpense(id, updates)` method to `ExpenseRepository` interface that merges partial updates with existing expense data, validates against the full `expenseSchema`, automatically transitions status to `Resubmitted`, and throws a clear error if attempting to edit an approved (terminal) expense.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] `ExpenseRepository` interface adds new method signature: `updateExpense(id: string, updates: Partial<ExpenseFormValues>): Promise<Expense>`
- [ ] `MockExpenseRepository` implements `updateExpense()` with merge + validate + status transition logic
- [ ] On success, expense status is automatically set to `Resubmitted` (regardless of current status, except Approved)
- [ ] On attempt to update `Approved` expense, throws error with message `"Cannot edit an approved expense"`
- [ ] On attempt to update non-existent expense, throws error with message `"Expense not found"`
- [ ] Returns new expense object (does not mutate original)
- [ ] Subsequent `getExpense()` calls after update reflect the new state (persistence verified)
- [ ] Full form validation runs on merged object; invalid data prevents update with descriptive error
- [ ] Unit tests pass for all success and error paths (MockExpenseRepository.test.ts)
