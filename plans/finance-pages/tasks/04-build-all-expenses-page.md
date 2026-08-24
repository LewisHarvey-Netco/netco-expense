# 04: Build All Expenses Page (/review)

**What to build:** Create the `/review` route page that displays all expenses in the ExpenseTable component. This page is the main view for finance reviewers to see all submitted expenses at a glance. Establishes the data-loading pattern: all expenses are loaded once on mount into local state and stay in memory for filtering.

**Blocked by:** 03 - Create Expense Table Component

**Status:** ready-for-agent

- [ ] Create `src/pages/ReviewPage.tsx` (or `AllExpensesPage.tsx`) as route-level component
- [ ] Wrap route in `<ProtectedRoute role="finance">` in `src/App.tsx`
- [ ] On component mount, load all mock expenses from `src/mocks/expenses.json` into local state: `const [allExpenses, setAllExpenses] = useState<Expense[]>([...])`
- [ ] **All mock expenses remain in memory throughout the page lifecycle** — filtering will not remove them from state
- [ ] Page layout: Header (via shared Header component), title "All Expenses", and ExpenseTable below
- [ ] Pass `allExpenses` to ExpenseTable (full dataset, unfiltered)
- [ ] Table rows navigate to `/review/:id` on click
- [ ] Apply styling per DESIGN-GUIDELINES (restrained, clean, Netcompany palette only)
- [ ] Write integration tests verifying:
  - Finance user can access `/review`
  - Non-finance user cannot access `/review` (redirects to their role home)
  - Table displays all expenses
  - Clicking a row navigates to detail page
  - All expenses are loaded on mount
