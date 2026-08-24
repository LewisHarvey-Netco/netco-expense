# 05: Implement Filter Logic & Form

**What to build:** Create filter logic to support filtering expenses by status, submitter, type, and date range. Build a filter form component that the user applies via an "Apply Filters" button (not real-time filtering). Filter logic is **pure and non-mutating**: it receives the full dataset and returns a filtered subset, leaving the original data untouched.

**Blocked by:** 03 - Create Expense Table Component

**Status:** done

- [x] Create utility function `filterExpenses(expenses: Expense[], filters: FilterCriteria): Expense[]` in `src/lib/` that applies all active filters to produce a new filtered array **without mutating the input array**
- [x] Define `FilterCriteria` type with optional fields: `status?: ExpenseStatus[]`, `submitterId?: string`, `type?: ExpenseType[]`, `dateRange?: { from: Date; to: Date }` (status/type are multi-select arrays — confirmed with user; date range filters on `receiptDate`, inclusive both bounds)
- [x] Create `FilterPanel.tsx` component with form fields:
  - Status multi-select (checkboxes)
  - Submitter select (dropdown, populated from `submitters` prop)
  - Type multi-select (checkboxes)
  - Date range picker (from/to dates via `Input type="date"`)
  - "Apply Filters" button (triggers filter application, not auto-apply)
  - "Clear Filters" button (resets filterCriteria to empty, causing all expenses to re-appear)
- [x] Use react-hook-form + zod for form state and validation
- [x] Apply shadcn components: Button, Select, Input, Checkbox (added `select` + `checkbox` via shadcn CLI; `lucide-react` installed)
- [x] Write unit tests for filter logic covering:
  - Status filter (matches exact status)
  - Submitter filter (matches by submitterId)
  - Type filter (matches exact type)
  - Date range filter (between from and to, inclusive)
  - Multiple filters combined (AND logic)
  - Filtered result is a new array (original input unmodified)
