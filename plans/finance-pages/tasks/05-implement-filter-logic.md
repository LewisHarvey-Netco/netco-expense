# 05: Implement Filter Logic & Form

**What to build:** Create filter logic to support filtering expenses by status, submitter, type, and date range. Build a filter form component that the user applies via an "Apply Filters" button (not real-time filtering). Filter logic is **pure and non-mutating**: it receives the full dataset and returns a filtered subset, leaving the original data untouched.

**Blocked by:** 03 - Create Expense Table Component

**Status:** ready-for-agent

- [ ] Create utility function `filterExpenses(expenses: Expense[], filters: FilterCriteria): Expense[]` in `src/lib/` that applies all active filters to produce a new filtered array **without mutating the input array**
- [ ] Define `FilterCriteria` type with optional fields: `status?: ExpenseStatus`, `submitterId?: string`, `type?: ExpenseType`, `dateRange?: { from: Date; to: Date }`
- [ ] Create `FilterPanel.tsx` component with form fields:
  - Status multi-select (checkboxes or select)
  - Submitter select (dropdown, populated from mock expenses)
  - Type multi-select (checkboxes or select)
  - Date range picker (from/to dates)
  - "Apply Filters" button (triggers filter application, not auto-apply)
  - "Clear Filters" button (resets filterCriteria to empty, causing all expenses to re-appear)
- [ ] Use react-hook-form + zod for form state and validation
- [ ] Apply shadcn components: Button, Select, Input, DatePicker (if available, or use Input type="date")
- [ ] Write unit tests for filter logic covering:
  - Status filter (matches exact status)
  - Submitter filter (matches by submitterId)
  - Type filter (matches exact type)
  - Date range filter (between from and to, inclusive)
  - Multiple filters combined (AND logic)
  - Filtered result is a new array (original input unmodified)
