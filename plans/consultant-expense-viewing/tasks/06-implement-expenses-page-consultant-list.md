# 06: Implement `ExpensesPage` as Consultant Expense List

**What to build:** Refactor `ExpensesPage` from its placeholder state into a functional consultant expense list. Fetch expenses using `repository.getExpensesBySubmitter(user.id)`, render `FilterPanel` with `showSubmitterFilter={false}`, and display `ExpenseTable` with filtered results. Implement row click navigation to `/expenses/:id`. Display loading, error, and empty states matching the pattern in `ReviewPage`. This completes the consultant workflow: view their own expenses, filter them, and navigate to detail.

**Blocked by:** 1, 4, 5

**Status:** done (2026-09-02)

- [x] Replace placeholder content in `ExpensesPage` with functional implementation
- [x] Use `useAuth()` to get current user ID
- [x] Fetch consultant expenses via `repository.getExpensesBySubmitter(user.id)`
- [x] Render `FilterPanel` with `showSubmitterFilter={false}`
- [x] Apply filters to expense list using existing `filterExpenses()` utility
- [x] Render `ExpenseTable` with filtered results and `onRowClick` handler navigating to `/expenses/:id`
- [x] Display loading state while fetching
- [x] Display error state if fetch fails
- [x] Display empty state if consultant has no expenses
- [x] Add tests in `ExpensesPage.test.tsx` verifying: consultant expenses loaded and displayed, filters apply correctly, submitter filter hidden, row click navigates, loading/error/empty states
