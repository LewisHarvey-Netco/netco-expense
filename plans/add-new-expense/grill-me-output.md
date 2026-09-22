# Add New Expense Feature - Grill-Me Output

**Date:** 2026-09-22  
**Feature:** Enable consultants to create new expenses via `/expenses/new` route  
**Status:** Design finalized, ready for implementation

---

## Decisions Made

### 1. Route & Initial Status
- **Route:** `/expenses/new` (RESTful convention for new resources)
- **Initial Status:** `Submitted` (ready for finance review immediately, not a draft)

### 2. Component Reuse Strategy
- **Reuse `ExpenseDetailCard`:** Yes. Same component for both editing existing expenses and creating new ones.
- **New Page:** Create `ExpenseCreatePage` (separate from `ExpenseDetailPage`)
- **Rationale:**
  - `ExpenseDetailCard` stays focused on form rendering (edit/view logic)
  - Page layer handles new-vs-existing distinction (data source)
  - Follows established architecture pattern (page owns repository interaction, card owns form/feedback)
  - Cleaner separation of concerns than a wrapper component
  - Future-proof for creation-specific logic (e.g., templates, pre-fills)

### 3. Button Text Customization
- **Solution:** Add `buttonLabel?: string` prop to `ExpenseDetailCard`
- **Default:** `'Resubmit'` (backward compatible for existing edit flow)
- **Create flow:** Pass `buttonLabel="Submit"`
- **Rationale:** Explicit and doesn't require the component to infer intent

### 4. ID Generation
- **Location:** Page generates UUID client-side before creating expense
- **Rationale:**
  - Keeps form submission flow simple (one complete object sent)
  - Avoids extra round-trip to repository just to get the ID
  - Aligns with optimistic UI patterns
  - Repository responsibility stays focused: validate and store

### 5. Repository Layer Enhancement
- **Add method:** `createExpense(expense: Expense) => Promise<Expense>`
- **Location:** Add to `ExpenseRepository` interface and implement in `MockExpenseRepository`
- **Behavior:**
  - Accepts a complete `Expense` object (with pre-generated ID, status already `'Submitted'`)
  - Validates against expense schema
  - Stores in in-memory map
  - Returns the created expense (for redirect)
- **Why separate from `updateExpense`:**
  - `updateExpense` auto-transitions to `'Resubmitted'` (edit workflow)
  - `createExpense` preserves `'Submitted'` status (new workflow)
  - Semantically clearer (create vs. update)

---

## Implementation Plan

### Phase 1: Repository
1. Add `createExpense(expense: Expense) => Promise<Expense>` to `ExpenseRepository` interface
2. Implement `createExpense` in `MockExpenseRepository`
   - Validate expense against `validateAndParseExpense`
   - Store in in-memory map
   - Return validated expense
   - Throw error if ID already exists (duplicate)

### Phase 2: Component Enhancement
1. Add `buttonLabel?: string` prop to `ExpenseDetailCard`
   - Update interface props
   - Use in button render (line ~367): `buttonLabel ?? 'Resubmit'`
   - Update JSDoc comments to document the new prop

### Phase 3: New Page
1. Create `ExpenseCreatePage.tsx` in `src/pages/`
2. Structure:
   - Import dependencies: `useAuth`, `useRepository`, `useNavigate`, `crypto.randomUUID()`
   - On mount:
     - Check user is authenticated and is a `consultant` (use `ProtectedRoute` to enforce)
     - Generate new UUID
     - Initialize `newExpenseTemplate` with:
       - `id`: generated UUID
       - `submitterId`: `user.id`
       - `amount`: `0`
       - `currency`: `'USD'`
       - `type`: `EXPENSE_TYPES[0]` (first type, e.g., 'Breakfast')
       - `receiptDate`: today's date (YYYY-MM-DD format)
       - `status`: `'Submitted'`
       - `submittedAt`: today's date (YYYY-MM-DD format)
       - `internalNotes`: `null`
       - `region`: `''`
       - `project`: `''`
       - `description`: `''`
   - Render:
     - `Header` component
     - Back button (navigate to `/expenses`)
     - Page title: "New Expense"
     - `ExpenseDetailCard` with:
       - `expense={newExpenseTemplate}`
       - `isEditable={true}`
       - `buttonLabel="Submit"`
       - `onResubmit={handleCreate}` (receives updated template from card)
     - Loading/error states during creation
   - `handleCreate` callback:
     - Call `repo.createExpense(expense)`
     - On success: `navigate(`/expenses/${created.id}`)`
     - On error: display error alert (let user retry)

### Phase 4: Routing
1. Add route to `src/main.tsx` (or wherever routes are defined):
   ```tsx
   <Route
     path="/expenses/new"
     element={
       <ProtectedRoute requiredRole="consultant">
         <ExpenseCreatePage />
       </ProtectedRoute>
     }
   />
   ```
2. Ensure route is defined **before** `/expenses/:id` (more specific route first in React Router)

### Phase 5: Testing
1. **Unit tests:**
   - `ExpenseDetailCard`: verify `buttonLabel` prop works (button renders correct text)
   - `MockExpenseRepository.createExpense()`: validate error on duplicate ID, success on valid expense
2. **Component tests:**
   - `ExpenseCreatePage`: renders form with empty template, validates submission
3. **E2E tests:**
   - Navigate to `/expenses/new`
   - Fill in form fields
   - Click "Submit"
   - Verify redirect to `/expenses/:id` with new expense data
   - Verify expense appears in `/expenses` list (status = `Submitted`)

---

## Data Flow Summary

```
User navigates to /expenses/new
         ↓
ExpenseCreatePage mounts
  - Generates UUID
  - Initializes newExpenseTemplate with today's dates, user ID, etc.
         ↓
Renders ExpenseDetailCard with:
  - expense={newExpenseTemplate}
  - isEditable={true}
  - buttonLabel="Submit"
  - onResubmit={handleCreate}
         ↓
User fills form and clicks "Submit"
         ↓
Form validates via Zod schema
         ↓
Card calls onResubmit(updatedTemplate)
         ↓
Page's handleCreate receives updated expense
         ↓
Calls repo.createExpense(expense)
         ↓
MockExpenseRepository validates and stores
         ↓
Returns created expense to page
         ↓
Page navigates to /expenses/:id
         ↓
User sees newly created expense in detail view
```

---

## Key Architectural Notes

- **Consultant-only:** Route protected with `ProtectedRoute` + `requiredRole="consultant"`
- **Status immutable on create:** No auto-transition (unlike `updateExpense` which transitions to `Resubmitted`)
- **Dates:** Use YYYY-MM-DD format (ISO 8601) for `receiptDate` and `submittedAt`, matching existing expense format
- **Currency default:** `'USD'` chosen as a reasonable default; could be parameterized later
- **Component props stable:** `ExpenseDetailCard` API unchanged for existing flows; new `buttonLabel` is optional and backward-compatible
- **Repository mutation pattern:** `createExpense` returns the stored object (allowing ID/date mutations by the repository if needed in the future)

---

## Files to Modify/Create

| File | Action | Priority |
|------|--------|----------|
| `src/lib/repositories/ExpenseRepository.ts` | Add `createExpense` method | High |
| `src/lib/repositories/MockExpenseRepository.ts` | Implement `createExpense` | High |
| `src/components/expenses/ExpenseDetailCard.tsx` | Add `buttonLabel` prop | High |
| `src/pages/ExpenseCreatePage.tsx` | Create new page | High |
| `src/main.tsx` (or router file) | Add `/expenses/new` route | High |
| `src/pages/ExpenseCreatePage.test.tsx` | Add unit/component tests | Medium |
| `e2e/create-expense.spec.ts` | Add E2E test | Medium |

---

## Questions for Next Session (Not Resolved)

- Should there be a "Create Expense" button on the `/expenses` list page to quick-link to `/expenses/new`?
- Should the date fields default to today, or should they be empty and required?
- Should currency be a fixed dropdown (not free text)?
- What happens if a user tries to create an expense with a duplicate ID? (Very unlikely with UUID, but should repo throw error?)

