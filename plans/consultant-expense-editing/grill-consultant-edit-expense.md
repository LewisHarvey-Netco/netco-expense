# Plan: Consultant Expense Editing & Resubmit

## Goal

Enable consultants to edit expense details and resubmit them for re-review. Once resubmitted, the status transitions to `Resubmitted` and the expense returns to the finance review queue.

## Current State

### Existing Consultant Viewing Flow (Phase 1)
- Consultants view their expenses at `/expenses` (read-only list) and `/expenses/:id` (read-only detail)
- `ExpenseDetailCard` renders disabled form fields via react-hook-form (already structured for editing)
- Status values: `Submitted`, `Approved`, `Changes Requested`, `Resubmitted`
- Finance can approve or request changes; consultant can only view

### Existing Finance Review Flow (Unchanged)
- Finance users at `/review` see all expenses and filter them
- Finance users at `/review/:id` see expense detail + review decision form
- Review decisions: approve (→ `Approved`) or request changes (→ `Changes Requested`)

---

## Feature Design

### Who Can Edit?

Consultants may edit an expense when its status is:
- `Submitted` — initial submission, awaiting review
- `Changes Requested` — finance asked for changes
- `Resubmitted` — re-review in progress, can continue editing before finance re-reviews

Consultants **cannot** edit when:
- `Approved` — terminal state, expense is approved

### Editing UI/UX

**When viewing an editable expense (`/expenses/:id`):**
1. Form fields become enabled (currently they're always disabled)
2. A new "Resubmit" button appears below the form
3. Consultant can edit fields; validation shows inline errors (real-time or on blur)
4. On submit:
   - All fields validate against `expenseSchema` (same as initial submission)
   - If valid, call `repository.updateExpense(id, updates)` with the changed fields
   - Status automatically transitions to `Resubmitted`
   - Show success message briefly
   - **Auto-navigate back to `/expenses`** (consultant list)

**Form fields remain editable** after resubmit (status is still editable: `Resubmitted`).

### Status Workflow

```
Submitted ──(finance reviews)──> Changes Requested ─┐
    │                                                │
    └────(consultant edits)──────────────────────────┘
         │
         └──> Resubmitted ──(finance re-reviews)──> Approved (terminal)
         └──(consultant can edit again)──> Resubmitted (loop)
```

**Loop behavior:**
- If finance requests changes on `Resubmitted`, status → `Changes Requested` (loops back to editable)
- If finance approves `Resubmitted`, status → `Approved` (terminal, no more editing)

---

## Implementation Changes

### 1. Repository Interface
**File:** `src/lib/repositories/ExpenseRepository.ts`

Add method:
```typescript
/**
 * Updates expense fields and sets status to 'Resubmitted'.
 * Used by consultants to edit and resubmit an expense.
 * Validates all updates against the expense schema.
 */
updateExpense(id: string, updates: Partial<ExpenseFormValues>): Promise<Expense>
```

### 2. Mock Repository Implementation
**File:** `src/lib/repositories/MockExpenseRepository.ts`

Implement `updateExpense()`:
- Fetch the current expense by `id`
- Merge updates with current data
- Validate merged object against `expenseSchema`
- Set status to `Resubmitted`
- Store updated expense (replacing previous)
- Return updated expense

### 3. ExpenseDetailCard Component
**File:** `src/components/expenses/ExpenseDetailCard.tsx` (modify)

Add props:
```typescript
interface ExpenseDetailCardProps {
  expense: Expense
  role?: Role
  isEditable?: boolean          // NEW: true when consultant can edit
  onResubmit?: (expense: Expense) => void  // NEW: callback after resubmit
}
```

Changes:
- Remove hardcoded `disabled` from form fields
- Conditionally disable: `disabled={!isEditable}`
- Add "Resubmit" button (only shown when `isEditable`)
- Wire button to:
  1. Validate form via `form.handleSubmit()`
  2. Call `repository.updateExpense(expense.id, formData)`
  3. Call `onResubmit(updated)` if provided
  4. Handle errors (show alert)
- Add loading state during submission (`submitting: boolean`)

### 4. ExpenseDetailPage (Consultant View)
**File:** `src/pages/ExpenseDetailPage.tsx` (modify consultant branch)

Current consultant branch:
```typescript
} else (
  <ExpenseDetailCard expense={expense} role={user.role} />
)
```

New consultant branch:
```typescript
} else {
  const isConsultantEditable = ['Submitted', 'Changes Requested', 'Resubmitted'].includes(expense.status)

  return (
    <>
      <ExpenseDetailCard 
        expense={expense} 
        role={user.role}
        isEditable={isConsultantEditable}
        onResubmit={async (updated) => {
          setExpense(updated)
          // Show success message (optional: toast/alert)
          // Auto-navigate to /expenses
          navigate('/expenses')
        }}
      />
      {successMessage && <Alert variant="success">{successMessage}</Alert>}
    </>
  )
}
```

---

## Validation & Error Handling

### Form Validation
- Reuse existing `expenseSchema` from `src/schemas/expense.ts`
- Validation is already wired in `ExpenseDetailCard` via react-hook-form + zod
- On resubmit, `form.handleSubmit()` validates before calling submit handler
- Field-level errors display inline (inherited from current setup)

### Error Scenarios
1. **Validation fails** → Show field errors, block resubmit button
2. **Expense not found** → Show error alert (same as current load error)
3. **Update fails** → Show error alert with retry option
4. **Status is `Approved`** → `isEditable` is `false`, button/fields hidden

---

## Navigation & UX Flow

### Consultant Expense Edit Flow

1. Consultant at `/expenses` clicks an expense with status `Submitted`, `Changes Requested`, or `Resubmitted`
2. Lands on `/expenses/:id` detail page
3. Form fields are **enabled**
4. "Resubmit" button is visible
5. Consultant edits one or more fields
6. Consultant clicks "Resubmit"
7. Form validates
8. On success:
   - Status → `Resubmitted`
   - Success message shown briefly
   - Auto-navigate to `/expenses` (list)
9. Back on list, consultant sees updated expense with status `Resubmitted`
10. Consultant can click it again to edit further (same flow repeats)

### Finance Re-Review Flow (No Changes)

1. Finance at `/review` sees `Resubmitted` expenses in the list
2. Clicks `/review/:id` to view detail
3. Sees expense + review form (unchanged)
4. Decision options:
   - Approve → status → `Approved` (terminal)
   - Request changes → status → `Changes Requested` (consultant can edit again)
5. If changes requested, consultant can edit → `Resubmitted` again (loop)

---

## Testing Strategy

### Unit / Component Tests

**ExpenseDetailCard.test.tsx** (expand)
- When `isEditable={false}`, form fields are disabled and "Resubmit" button hidden
- When `isEditable={true}`, form fields are enabled and "Resubmit" button visible
- Clicking "Resubmit" with valid data calls `onResubmit` callback
- Validation errors prevent submission (Resubmit button disabled if form invalid)
- Displays loading state during submission

**MockExpenseRepository.test.ts** (expand)
- `updateExpense()` merges updates with current data
- Sets status to `Resubmitted` regardless of input
- Validates merged object against `expenseSchema`
- Throws on invalid data
- Returns updated expense with `id` and `submitterId` unchanged

### Integration Tests

**ExpenseDetailPage.test.tsx** (expand)
- Consultant viewing an editable expense sees enabled form + Resubmit button
- Consultant viewing an `Approved` expense sees disabled form + no Resubmit button
- Clicking Resubmit with valid data calls repository and triggers `onResubmit`
- After resubmit, navigates to `/expenses`
- Finance user always sees disabled form + review section (unchanged)

### E2E Tests (Playwright)

**expenses-consultant-edit.spec.ts** (new)
- Consultant login
- Navigate to `/expenses`
- Click an expense with status `Submitted`
- Form fields are enabled
- Edit a field (e.g., amount)
- Click "Resubmit"
- Wait for redirect to `/expenses`
- Verify expense status is now `Resubmitted`
- Click the same expense again
- Form is still editable (status is editable)
- Make another edit and resubmit
- Verify status stays `Resubmitted`

**review-resubmitted.spec.ts** (expand existing)
- Finance views `/review` and sees a `Resubmitted` expense
- Clicks detail, sees review form (unchanged)
- Approves → status → `Approved`
- Back to list, expense is now `Approved` and no longer editable

---

## Checklist

- [ ] Add `updateExpense()` method to `ExpenseRepository` interface
- [ ] Implement `updateExpense()` in `MockExpenseRepository`
- [ ] Update `ExpenseDetailCard` props to include `isEditable` and `onResubmit`
- [ ] Remove hardcoded `disabled` from form fields in `ExpenseDetailCard`
- [ ] Add "Resubmit" button to `ExpenseDetailCard`
- [ ] Wire "Resubmit" to repository call in `ExpenseDetailCard`
- [ ] Update consultant branch in `ExpenseDetailPage` to handle `isEditable` and `onResubmit`
- [ ] Add success message/notification after resubmit
- [ ] Add auto-navigation to `/expenses` after resubmit
- [ ] Write/update tests for `ExpenseDetailCard`
- [ ] Write/update tests for `MockExpenseRepository`
- [ ] Write/update tests for `ExpenseDetailPage` (consultant branch)
- [ ] Write E2E tests for consultant edit/resubmit flow
- [ ] Write E2E tests for finance re-review of `Resubmitted` expenses
- [ ] Verify app builds without errors
- [ ] Verify all tests pass

---

## Future Considerations

- **Optimistic updates:** Could update UI before server response for faster UX
- **Draft saves:** Could auto-save partial edits without full resubmit (future feature)
- **Audit trail:** Track edit history (who changed what, when) — may be compliance requirement
- **Conflict detection:** If expense changes during edit (e.g., finance re-reviews while consultant is editing), handle gracefully

