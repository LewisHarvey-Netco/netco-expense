# 03: Create Expense Table Component

**What to build:** Build a reusable `ExpenseTable` component that displays a list of expenses in a structured table with columns: Submitted (date), Submitter, Description, Type, Amount, Status. Each row links to the expense detail page.

**Blocked by:** 02 - Create Mock Expenses Dataset

**Status:** ready-for-agent

- [ ] Create `src/components/ExpenseTable.tsx` using shadcn Table component
- [ ] Columns: Submitted date (formatted), Submitter name, Description (truncated if needed), Type, Amount with currency, Status (displayed as badge with appropriate styling per status)
- [ ] Each row is clickable and navigates to `/review/:id` for that expense
- [ ] Component accepts `expenses: Expense[]` as prop and `onRowClick?: (id: string) => void` for navigation
- [ ] Apply styling per DESIGN-GUIDELINES: Netcompany palette, restrained aesthetic, no decorative elements
- [ ] Write component tests verifying:
  - Table renders correct columns and expense data
  - Clicking a row triggers navigation or callback
  - Status badges render with correct colors/styling
