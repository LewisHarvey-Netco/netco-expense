# PRD: Consultant Expense Editing & Resubmit

## Problem Statement

Consultants currently can only view their submitted expenses in a read-only state. Once an expense is submitted, they have no way to correct errors or respond to finance feedback without manual intervention. When finance requests changes to an expense, consultants are blocked from updating it themselves, creating friction in the review-and-refine cycle.

The current workflow is: consultant submits → finance reviews → if changes needed, consultant must wait for manual support to update. This is inefficient and creates bottlenecks.

## Solution

Enable consultants to edit and resubmit their own expenses when the expense is in an editable state (`Submitted`, `Changes Requested`, or `Resubmitted`). Once resubmitted, the expense status transitions to `Resubmitted` and returns to the finance review queue for re-review. Consultants retain full editing capability throughout the cycle until finance approves the expense.

The feature reuses the existing form structure in `ExpenseDetailCard` (already built with react-hook-form + Zod), simply enabling form fields and adding a "Resubmit" button. The submission flow validates against the same `expenseSchema` used for initial submissions, ensuring data integrity.

## User Stories

1. As a consultant, I want to edit an expense I just submitted, so that I can correct mistakes before finance reviews it.

2. As a consultant, I want to see inline validation errors as I edit, so that I know what needs to be fixed before resubmitting.

3. As a consultant, I want to resubmit an expense after fixing errors, so that finance can re-review my corrected submission.

4. As a consultant, I want to see a success confirmation after resubmitting, so that I know my changes were saved.

5. As a consultant, I want to manually navigate back to my expense list after resubmitting, so that I have control over when I leave the detail page.

6. As a consultant, I want to edit an expense again if finance requests changes, so that I can address their feedback without contacting support.

7. As a consultant, I want to continue editing a `Resubmitted` expense while it's awaiting finance review, so that I can make further refinements if needed.

8. As a consultant, I want form fields to remain disabled on approved expenses, so that I cannot accidentally edit a finalized expense.

9. As a consultant, I want to see an error message if resubmission fails, so that I understand what went wrong and can retry.

10. As a consultant, I want to retry a failed resubmission, so that I can recover from temporary network issues without losing my edits.

11. As finance, I want to re-review expenses with status `Resubmitted`, so that I can approve or request further changes.

12. As finance, I want the expense review flow to remain unchanged, so that my workflow is not disrupted by the new consultant editing capability.

13. As a system, I want to validate all resubmitted expenses against the same schema as initial submissions, so that data consistency is maintained.

14. As a system, I want to prevent editing of approved expenses, so that terminal decisions are never overwritten.

15. As a system, I want to track status transitions accurately (Submitted → Resubmitted, Changes Requested → Resubmitted, etc.), so that the audit trail is clear.

## Implementation Decisions

### 1. Repository Interface & Method Signature

**Decision:** Add a new `updateExpense()` method to the `ExpenseRepository` interface.

```
updateExpense(id: string, updates: Partial<ExpenseFormValues>): Promise<Expense>
```

**Rationale:**
- Accepts `Partial<ExpenseFormValues>` to make it explicit that only changed fields are provided, keeping the API simple.
- Internally merges updates with current expense data and validates the full merged object against `expenseSchema`.
- Automatically sets status to `Resubmitted` regardless of current status (except `Approved`, which throws an error).
- Returns the updated expense so the UI can reflect changes immediately.

### 2. Error Handling for Terminal State

**Decision:** Throw an error if attempting to update an expense with status `Approved`.

**Rationale:**
- `Approved` is a terminal state and should never be reopened.
- Backend validation provides a safety net in case the UI incorrectly allows editing.
- Error message: `"Cannot edit an approved expense"` (or similar, clear and actionable).

### 3. Form Field Editability

**Decision:** Control form field editability via an `isEditable` prop on `ExpenseDetailCard`.

**Rationale:**
- Reuses existing form structure without major refactoring.
- `isEditable` is determined by the page based on expense status and user role.
- Keeps the component logic simple: if `isEditable={true}`, remove `disabled` attribute from all form fields.

### 4. Resubmit Button Placement & Visibility

**Decision:** Add a "Resubmit" button below the form, visible only when `isEditable={true}`.

**Rationale:**
- Traditional form submission pattern; familiar to users.
- Placed after all fields, natural reading order.
- Hidden entirely when not editable (status is `Approved` or user is finance).

### 5. Status Transition Logic

**Decision:** Consultant editable statuses are: `Submitted`, `Changes Requested`, `Resubmitted`.

**Rationale:**
- `Submitted`: Initial submission, awaiting first finance review.
- `Changes Requested`: Finance asked for changes; consultant can edit to address feedback.
- `Resubmitted`: Consultant already resubmitted and is awaiting re-review; consultant can continue editing until approved.
- `Approved`: Terminal, no editing allowed.

### 6. Form Validation on Resubmit

**Decision:** Reuse the existing `expenseSchema` from `src/schemas/expense.ts`; require full validation on all fields.

**Rationale:**
- Ensures data integrity: all fields must be valid before submission.
- Consultant already provided valid data initially; re-validation has low friction.
- Prevents incomplete or invalid data from entering the system.

### 7. Success Feedback & Navigation

**Decision:** Show inline success message below the form; auto-dismiss after 3 seconds; require manual "Back to Expenses" button to navigate away.

**Rationale:**
- Inline feedback keeps the user in context after resubmit.
- Auto-dismiss after 3 seconds prevents message fatigue.
- Manual navigation gives the consultant full control (no surprise redirects).
- "Back to Expenses" button appears only after successful resubmit.

### 8. Error Feedback & Retry

**Decision:** Show inline error message below the form; keep "Resubmit" button enabled; allow user to edit and retry.

**Rationale:**
- Inline errors stay contextual to the action.
- Enabled button lets the consultant immediately retry or edit and retry.
- Simple and forgiving UX.

### 9. Loading State During Submission

**Decision:** Show loading spinner/text on "Resubmit" button while submission is in progress; disable button; keep form fields editable.

**Rationale:**
- Provides visual feedback that the action is processing.
- Disabled button prevents duplicate submissions.
- Editable fields allow the user to continue reviewing/editing while waiting.

### 10. Internal Notes Display

**Decision:** Keep internal notes display-only for consultants (no editing or inline replies).

**Rationale:**
- Simplifies scope for this feature.
- One-way channel from finance to consultant keeps the model clear.
- Consultants respond by editing the visible expense fields.

**Future Enhancement:** Convert internal notes to a conversation thread (tracked in TODO).

### 11. Consultant Ownership Check

**Decision:** Consultant can only edit expenses where `expense.submitterId === user.id` AND status is editable.

**Rationale:**
- Maintains privacy and security: consultants cannot edit other consultants' expenses.
- Consistent with existing read-only consultant view logic.

### 12. Finance Review Flow (Unchanged)

**Decision:** Finance review workflow remains exactly as-is; no changes to `/review` or review decision form.

**Rationale:**
- Finance can already view and decide on `Resubmitted` expenses.
- Review form already handles all statuses correctly.
- Minimizes scope and risk of introducing bugs.

### 13. Mock Data Completeness

**Decision:** Mock expenses already represent all four statuses (Submitted, Changes Requested, Resubmitted, Approved).

**Rationale:**
- No updates needed; existing mock data is sufficient for manual testing and E2E.

## Testing Decisions

### What Makes a Good Test

A good test:
- **Tests external behavior, not implementation details.** Tests the public interface (props, method signatures, user interactions).
- **Is isolated and can run in any order.** No hidden dependencies on test execution order or global state (unless explicitly set up).
- **Has a single, clear purpose.** One test = one behavior.
- **Is fast and deterministic.** No flakiness, no timing-dependent waits.
- **Uses meaningful assertions.** Error messages are clear if the test fails.

### Modules to Test

#### MockExpenseRepository (Unit Tests)

**File:** `src/lib/repositories/MockExpenseRepository.test.ts` (expand)

**New tests for `updateExpense()` method:**

- Updates expense fields and transitions status to `Resubmitted`
- Merges partial updates with existing data correctly
- Validates merged object against `expenseSchema` (rejects invalid data)
- Throws error `"Cannot edit an approved expense"` when attempting to update `Approved` status
- Throws error `"Expense not found"` when ID does not exist
- Returns a new object (does not mutate the original)
- Persists update so subsequent `getExpense()` calls return the new state

**Testing approach:**
- Use the existing `makeExpense()` helper to create test data.
- Test both success and error paths.
- Verify state persistence across multiple calls.

#### ExpenseDetailCard Component (Component Tests)

**File:** `src/components/expenses/ExpenseDetailCard.test.tsx` (expand)

**New tests:**

- When `isEditable={false}`, form fields are disabled and "Resubmit" button is not rendered
- When `isEditable={true}`, form fields are enabled and "Resubmit" button is visible
- Clicking "Resubmit" with valid form data calls `onResubmit(updatedExpense)` callback
- Clicking "Resubmit" with invalid form data does not call `onResubmit` and displays validation errors
- While submission is in progress, "Resubmit" button shows loading state and is disabled
- After successful submission, "Resubmit" button is replaced/hidden and inline success message appears
- After failed submission, error message appears and "Resubmit" button remains enabled for retry
- Finance role always sees disabled form fields and no "Resubmit" button (unchanged behavior)

**Testing approach:**
- Render component with `isEditable` true/false.
- Use `userEvent` to interact (click, type, submit).
- Mock the `onResubmit` callback and verify it's called with correct data.
- Mock repository to simulate success and error scenarios.

#### ExpenseDetailPage (Integration Tests)

**File:** `src/pages/ExpenseDetailPage.test.tsx` (expand)

**New tests:**

- Consultant viewing `Submitted` expense sees editable form and "Resubmit" button
- Consultant viewing `Changes Requested` expense sees editable form and "Resubmit" button
- Consultant viewing `Resubmitted` expense sees editable form and "Resubmit" button
- Consultant viewing `Approved` expense sees disabled form and no "Resubmit" button
- Successful resubmit displays inline success message that auto-dismisses after ~3 seconds
- Successful resubmit displays "Back to Expenses" button for manual navigation
- Successful resubmit updates the displayed expense status to `Resubmitted`
- Failed resubmit displays inline error message below the form
- Failed resubmit keeps "Resubmit" button enabled for retry
- Finance user always sees disabled form and no editing controls (unchanged)
- Consultant cannot edit another consultant's expense (ownership check intact)

**Testing approach:**
- Use `renderAppAt()` helper to render full app at a detail page route.
- Seed session with consultant or finance user.
- Use real repository or mock it to control outcomes.
- Verify inline messages, button state, and form field state.
- Check that status reflects updates after successful resubmit.

#### E2E Tests (Playwright)

**File:** `e2e/expenses-consultant-edit.spec.ts` (new)

**Scenarios:**

1. **Consultant edits and resubmits a `Submitted` expense:**
   - Login as consultant (Alice)
   - Navigate to `/expenses`
   - Click an expense with status `Submitted`
   - Verify form fields are enabled
   - Edit one field (e.g., amount)
   - Click "Resubmit"
   - Verify success message appears
   - Verify status changes to `Resubmitted`
   - Click "Back to Expenses"
   - Verify list shows updated expense with `Resubmitted` status

2. **Consultant edits and resubmits a `Changes Requested` expense:**
   - Click an expense with status `Changes Requested`
   - Verify internal notes are visible
   - Edit fields to address feedback
   - Click "Resubmit"
   - Verify status changes to `Resubmitted`

3. **Consultant edits again after resubmit (before finance re-reviews):**
   - From resubmitted expense, click "Back to Expenses"
   - Click the same expense again
   - Form is still editable (status is `Resubmitted`)
   - Make another edit
   - Click "Resubmit"
   - Verify status stays `Resubmitted`

4. **Consultant cannot edit an `Approved` expense:**
   - Click an expense with status `Approved`
   - Verify form fields are disabled
   - Verify "Resubmit" button is not visible

5. **Error recovery on failed submission:**
   - Attempt resubmit (mock network error or invalid data)
   - Verify error message appears
   - Verify "Resubmit" button remains clickable
   - Correct the issue and retry

6. **Finance re-reviews a `Resubmitted` expense:**
   - Login as finance (Bob)
   - Navigate to `/review`
   - Click an expense with status `Resubmitted`
   - Verify form fields are disabled (finance cannot edit)
   - Verify review decision form is present
   - Approve the expense
   - Verify status changes to `Approved`
   - Verify the expense is no longer editable by consultants

**Testing approach:**
- Use Playwright's page interactions (click, fill, goto).
- Login via UI or seeded session.
- Verify page state after each action (text, button states, element visibility).
- Use `waitFor` for async operations (loading states, redirects).

## Out of Scope

1. **Audit trail / edit history** — Tracking who changed what and when is not included in this feature. Future enhancement.

2. **Offline editing / draft saves** — Auto-saving partial edits without full resubmit is not included. Consultant must fully complete and submit.

3. **Concurrent edit conflict detection** — If finance re-reviews while consultant is editing, there is no conflict warning. First submission wins (backend validation prevents `Approved` status from being overwritten).

4. **Internal notes as conversation thread** — Currently display-only for consultants. Tracked as future TODO.

5. **Receipt upload** — Receipt upload is already stubbed in the UI; consultant editing does not enable this.

6. **Bulk editing** — Editing multiple expenses at once is not supported.

## Further Notes

- **Status Workflow Clarity:** The status transitions form a clear cycle:
  - `Submitted` → (finance approves) → `Approved` [terminal]
  - `Submitted` → (finance requests changes) → `Changes Requested` → (consultant edits) → `Resubmitted` → (finance re-reviews) → `Approved` [terminal]
  - `Resubmitted` → (finance requests changes again) → `Changes Requested` → (consultant edits again) → `Resubmitted` [loop continues until approved]

- **Data Integrity:** All updates validate against the same schema as initial submissions. This ensures consultants cannot weaken validation or introduce inconsistent data through editing.

- **Permission Model:** The feature maintains strict separation of concerns:
  - Consultants can edit their own expenses (when status permits).
  - Finance cannot edit; finance can only approve or request changes.
  - Approved expenses are immutable from both sides.

- **Minimal Scope:** The feature reuses 95% of existing code (form, validation, repository pattern). The main additions are:
  - `updateExpense()` method in repository
  - `isEditable` and `onResubmit` props in component
  - Status-based editability logic in page
  - Submission handling (wire form submit to repository call)

- **Future Enhancements Tracked:** A TODO has been added to convert internal notes to a conversation thread (finance ↔ consultant back-and-forth).

