# Plan: Consultant Expense Viewing (MVP)

## Goal

Enable consultants to view a filtered list of their own expenses and inspect individual expense details in a read-only view, using the same table and detail layouts as finance users. Structure the codebase to support inline editing later without affecting finance views.

## Current State

### Routes & Pages
- `/login` — Public login
- `/expenses` — Consultant placeholder ("form coming soon")
- `/review` — Finance expense table (all expenses, filterable)
- `/review/:id` — Finance expense detail + decision form (approve/reject)
- `/` — Role-based home redirect

### Finance Expense Workflow
- **Table:** `ExpenseTable.tsx` renders expenses in 6-column format (Submitted, Submitter, Description, Type, Amount, Status)
- **Detail:** `ExpenseDetailPage.tsx` displays two-column layout:
  - Left: `ExpenseDetailCard` (static display of all fields)
  - Right: `ReviewDecisionForm.tsx` (approve/request-changes form)
- **Filters:** `FilterPanel.tsx` sidebar with status, submitter, type, date range (client-side filtering)
- **Data:** `ExpenseRepository` interface with `getExpenses()`, `getExpense(id)`, `updateExpenseStatus()`

### Authentication & Roles
- Two roles: `'consultant'` | `'finance'`
- Mock users: Alice (consultant), Bob (finance)
- Protected routes via `ProtectedRoute.tsx`

### Styling
- Tailwind v4 + shadcn/ui (New York preset)
- Netcompany brand palette via CSS variables
- No hand-written HTML; all components use shadcn

---

## Proposed Changes

### Phase 1: Repository Layer

**File:** `src/lib/repositories/ExpenseRepository.ts`
- Add method to interface:
  ```typescript
  getExpensesBySubmitter(submitterId: string): Promise<Expense[]>
  ```

**File:** `src/lib/repositories/MockExpenseRepository.ts`
- Implement `getExpensesBySubmitter()` to return only expenses where `submitterId` matches
- Enforce this at the data-access layer (security boundary)

---

### Phase 2: Shared Expense Components

**New file:** `src/components/expenses/ExpenseDetailCard.tsx`
- Extract the current left-column detail rendering from `ExpenseDetailPage`
- Build with React Hook Form fields from the start (not plain display)
- Use Zod schema for validation (ready for editing when it's enabled later)
- Fields are disabled by default (read-only mode)
- Accept props:
  - `expense: Expense` (data to display)
  - `isEditable?: boolean` (default false; for phase 2)
  - `onSubmit?: (data) => void` (for phase 2)
- Render all current fields: amount, type, status, dates, submitter, region, project, description, notes, receipt placeholder

**Zod Schema:** Include in the same file or `src/lib/schemas/expense.ts`
- Define validation rules for all editable fields
- Use this schema in React Hook Form

---

### Phase 3: Finance Detail Page Refactor

**File:** `src/components/ExpenseReviewSection.tsx` (new)
- Extract the right-column logic from current `ExpenseDetailPage`
- Contains only `ReviewDecisionForm` and finance-specific decision logic
- Only rendered when `user.role === 'finance'`

**File:** `src/pages/ExpenseDetailPage.tsx` (refactor)
- Import `ExpenseDetailCard` from `src/components/expenses/`
- Import `ExpenseReviewSection` from `src/components/`
- Refactor to:
  ```typescript
  if (user.role === 'finance') {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <ExpenseDetailCard expense={expense} />
        <ExpenseReviewSection expense={expense} onDecision={...} />
      </div>
    )
  }
  // Consultant renders elsewhere (see Phase 5)
  ```

---

### Phase 4: Repository & Filter Refactoring

**File:** `src/components/FilterPanel.tsx` (refactor)
- Make filters configurable via props:
  ```typescript
  interface FilterPanelProps {
    filters: FilterConfig
    onFilterChange: (filters) => void
    showSubmitterFilter?: boolean
    // ... other field visibility options
  }
  ```
- Allow `ReviewPage` to pass `showSubmitterFilter={true}`
- Allow `ExpensesPage` to pass `showSubmitterFilter={false}`

---

### Phase 5: Consultant List & Detail Pages

**File:** `src/pages/ExpensesPage.tsx` (refactor)
- Replace placeholder with functional consultant expense list
- Fetch consultant's expenses: `repository.getExpensesBySubmitter(user.id)`
- Apply client-side filters (status, type, date range)
- Render `ExpenseTable` with the filtered expense list
- Pass `onRowClick` handler that navigates to `/expenses/:id`
- Include `FilterPanel` with `showSubmitterFilter={false}`
- Handle loading, error, and empty states (match finance pattern)

**New file:** `src/pages/ConsultantExpenseDetailPage.tsx`
- Single-column layout (no decision form)
- Fetch expense by ID: `repository.getExpense(id)`
- **Ownership check:** Verify `expense.submitterId === user.id` before rendering. Redirect to 404 or `/expenses` if check fails.
- Render `ExpenseDetailCard` with `isEditable={false}`
- Include back button to `/expenses`
- Handle loading, error, and ownership-check-failed states

**New route in `src/App.tsx`:**
```typescript
<Route
  path="/expenses/:id"
  element={
    <ProtectedRoute allowedRoles={['consultant']}>
      <ConsultantExpenseDetailPage />
    </ProtectedRoute>
  }
/>
```

---

### Phase 6: Navigation

**File:** `src/components/Header.tsx` (refactor)
- Add conditional nav link for consultants to `/expenses` (mirroring finance's `/review` link)
- Structure:
  ```typescript
  {user.role === 'finance' && <Link to="/review">Review Expenses</Link>}
  {user.role === 'consultant' && <Link to="/expenses">My Expenses</Link>}
  ```

---

### Phase 7: Architecture Documentation

**File:** `docs/architecture.md` (update)
- Add section documenting consultant detail view pattern:
  - Shared `ExpenseDetailCard` component
  - Role-based conditional rendering in `ExpenseDetailPage`
  - Future inline editing approach (form fields disabled initially)
  - Separation of finance decision logic (`ExpenseReviewSection`)
- Explain the design rationale for future editing without affecting finance

---

### Phase 8: Testing

**New tests for `ExpensesPage.test.tsx`:**
- Renders consultant's expenses only (not all expenses)
- Filters apply correctly (status, type, date range)
- Clicking a row navigates to `/expenses/:id`
- Empty state renders when no expenses
- Loading state shows skeleton
- Error state shows alert with retry

**New tests for `ConsultantExpenseDetailPage.test.tsx`:**
- Loads and displays the correct expense
- Ownership check fails gracefully (redirect or 404)
- Form fields are disabled (read-only)
- Back button returns to `/expenses`
- Loading and error states work

**E2E tests (Playwright):**
- Consultant login flow
- Navigate to `/expenses`, see filtered list
- Click an expense, view detail page
- Verify ownership check (try accessing another consultant's expense by URL, expect 404/redirect)
- Verify finance user cannot access `/expenses` (redirects to `/review`)

---

## Risks & Open Questions

### 1. Form Field Rendering in `ExpenseDetailCard`
**Risk:** React Hook Form + Zod adds complexity now for a feature (editing) that's deferred to phase 2.  
**Mitigation:** Design the component to support both disabled (now) and enabled (later) states cleanly. Use a consistent naming convention for form field names.

### 2. Ownership Check Security
**Risk:** Client-side ownership check is not enforced by the backend yet.  
**Mitigation:** Document clearly that this is a UX boundary only. Backend MUST validate ownership when real API is implemented. Add a TODO/ADR noting this.

### 3. Filter Reconfiguration
**Risk:** Refactoring `FilterPanel` to be configurable might break existing `ReviewPage` usage.  
**Mitigation:** Test `ReviewPage` thoroughly after refactor. Use TypeScript to catch prop mismatches.

### 4. Inline Editing Architecture
**Risk:** We're not building editing yet, but we're structuring for it. If phase 2 requirements change, the structure might not fit.  
**Mitigation:** Document the phase 2 vision clearly in architecture.md. Plan to revisit during phase 2 scope refinement.

### 5. Status Transition Logic
**Current assumption:** Only `Approved` is terminal. `Changes Requested` allows re-editing.  
**Open question:** Does finance workflow support this? Does the current decision form logic handle re-submissions?  
**Action:** Verify with finance stakeholders before implementation.

### 6. Expense Ownership in `getExpensesBySubmitter()`
**Question:** Should this validate that the repository knows the consultant's actual user ID?  
**Current design:** Pass `userId` as parameter; mock repository filters in-memory.  
**Phase 2:** Real backend validates authorization server-side.

---

## Implementation Order (Recommended)

1. **Repository layer** — Add `getExpensesBySubmitter()` method (small, unblocks everything)
2. **Shared components** — Extract `ExpenseDetailCard` with Zod schema (foundation for both roles)
3. **Finance refactor** — Extract `ExpenseReviewSection`, update `ExpenseDetailPage` (safe refactor, no new features yet)
4. **Filter refactoring** — Make `FilterPanel` configurable (needed by both pages)
5. **Consultant pages** — Implement `ExpensesPage` and `ConsultantExpenseDetailPage` (new feature)
6. **Navigation** — Update `Header` with consultant link
7. **Tests** — Write component and E2E tests (test-last order acceptable here given exploratory nature)
8. **Docs** — Update `docs/architecture.md`

---

## Future Phases (Not in Scope)

### Phase 2: Consultant Inline Editing
- Enable form fields in `ExpenseDetailCard` when `isEditable={true}`
- Wire `onSubmit` handler to call `repository.updateExpense()`
- Auto-transition status to `Resubmitted`
- Lock editing when status is `Approved`
- Add tests for edit workflows

### Phase 3: Expense Submission Form
- New `/expenses/new` route and form for consultants to create expenses
- May use same `ExpenseDetailCard` component or separate submission form

---

## Checklist

- [ ] Add `getExpensesBySubmitter(submitterId: string)` to `ExpenseRepository` interface
- [ ] Implement in `MockExpenseRepository`
- [ ] Extract `ExpenseDetailCard` to `src/components/expenses/ExpenseDetailCard.tsx` with Zod schema
- [ ] Extract `ExpenseReviewSection` to `src/components/ExpenseReviewSection.tsx`
- [ ] Refactor `ExpenseDetailPage` to use extracted components
- [ ] Refactor `FilterPanel` to accept `showSubmitterFilter` prop
- [ ] Update `ReviewPage` to pass new props
- [ ] Implement `ExpensesPage` (list + filters)
- [ ] Create `ConsultantExpenseDetailPage` with ownership check
- [ ] Add `/expenses/:id` route in `App.tsx`
- [ ] Update `Header.tsx` with consultant nav link
- [ ] Write component tests for consultant pages
- [ ] Write E2E tests for consultant workflows
- [ ] Update `docs/architecture.md`
- [ ] Verify phase 2 requirements (inline editing, `Resubmitted` status transition, terminal `Approved` state)
