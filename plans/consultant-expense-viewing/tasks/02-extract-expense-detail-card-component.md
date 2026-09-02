# 02: Extract `ExpenseDetailCard` Component (Disabled Fields)

**What to build:** A new reusable component that renders expense details in a read-only card layout using React Hook Form + Zod. All form fields are disabled (not editable in phase 1). The component accepts expense data and a `role` prop to control visibility of internal notes. This extraction enables the detail card to be shared between finance and consultant views without duplication.

**Blocked by:** 1

**Status:** ready-for-agent

- [ ] Create `src/components/expenses/ExpenseDetailCard.tsx` component
- [ ] Use React Hook Form internally with Zod schema from `src/schemas/expense.ts`
- [ ] Render all expense fields (amount, type, status, dates, submitter, region, project, description, internal notes, receipt placeholder)
- [ ] Set all form fields to disabled (read-only)
- [ ] Accept optional `role` prop (`'consultant' | 'finance' | undefined`) to control internal notes visibility
- [ ] Add tests in `ExpenseDetailCard.test.tsx` verifying: all fields render with correct data, fields are disabled, role-based note visibility
