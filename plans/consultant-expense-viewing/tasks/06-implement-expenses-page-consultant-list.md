# 06: Implement `ExpensesPage` as Consultant Expense List

**What to build:** Refactor `ExpensesPage` from its placeholder state into a functional consultant expense list. Fetch expenses using `repository.getExpensesBySubmitter(user.id)`, render `FilterPanel` with `showSubmitterFilter={false}`, and display `ExpenseTable` with filtered results. Implement row click navigation to `/expenses/:id`. Display loading, error, and empty states matching the pattern in `ReviewPage`. This completes the consultant workflow: view their own expenses, filter them, and navigate to detail.

**Blocked by:** 1, 4, 5

**Status:** ready-for-agent

- [ ] Replace placeholder content in `ExpensesPage` with functional implementation
- [ ] Use `useAuth()` to get current user ID
- [ ] Fetch consultant expenses via `repository.getExpensesBySubmitter(user.id)`
- [ ] Render `FilterPanel` with `showSubmitterFilter={false}`
- [ ] Apply filters to expense list using existing `filterExpenses()` utility
- [ ] Render `ExpenseTable` with filtered results and `onRowClick` handler navigating to `/expenses/:id`
- [ ] Display loading state while fetching
- [ ] Display error state if fetch fails
- [ ] Display empty state if consultant has no expenses
- [ ] Add tests in `ExpensesPage.test.tsx` verifying: consultant expenses loaded and displayed, filters apply correctly, submitter filter hidden, row click navigates, loading/error/empty states
