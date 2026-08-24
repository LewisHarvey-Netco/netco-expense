# 06: Integrate Filters into All Expenses Page

**What to build:** Wire the filter logic and FilterPanel component into the All Expenses page so users can filter the expense table by applying filter selections. Maintains the in-memory dataset: filtering computes a subset, clearing filters restores visibility of all expenses from the original full dataset.

**Blocked by:** 04 - Build All Expenses Page (/review), 05 - Implement Filter Logic & Form

**Status:** done

- [x] Update `ReviewPage.tsx` to include FilterPanel component alongside ExpenseTable
- [x] Add local state for `filterCriteria: FilterCriteria` (initialized to empty)
- [x] **Keep `allExpenses` state from ticket 04 unchanged** — it holds the full dataset in memory always
- [x] When "Apply Filters" button is clicked in FilterPanel, update `filterCriteria` state only
- [x] Compute filtered display via: `filteredExpenses = filterExpenses(allExpenses, filterCriteria)` on each render
- [x] Pass `filteredExpenses` to ExpenseTable for display
- [x] Display count of filtered results (e.g., "Showing 3 of 10 expenses")
- [x] "Clear Filters" resets `filterCriteria` to empty `{}`, causing `filteredExpenses` to equal `allExpenses` again (all expenses re-appear)
- [x] Layout: FilterPanel on left/top (desktop), ExpenseTable below/right with filtered results
- [x] Write integration tests verifying:
  - Applying filters updates the table display and count
  - Clearing filters shows all expenses again (full count restored)
  - Multiple filters work together (AND logic)
  - Original `allExpenses` data is never mutated
