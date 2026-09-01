# 09: Integrate Decision Form & Implement Status Updates

**What to build:** Wire the ReviewDecisionForm into the Expense Detail page. When the form is submitted, call the repository to update the expense's status (and internalNotes if "Request Changes") and reflect the change immediately on the page.

**Blocked by:** 07 - Create Expense Detail Page (/review/:id), 08 - Build Review Decision Form Component, 08a - Create Mock Repository for Data Mutations

**Status:** ready-for-agent

## Implementation Checklist

- [ ] Update `ExpenseDetailPage.tsx` to include ReviewDecisionForm in right column
- [ ] Add local state for the current expense (loaded from mock on mount)
- [ ] When ReviewDecisionForm submits:
   - Call `useRepository().updateExpenseStatus(id, decision, comment)` (returns Promise<Expense>)
   - Update local `expense` state with the returned expense
   - Display success feedback (toast, message, or status badge color change)
- [ ] After submission, disable the form (or navigate away, or show "Decision recorded")
- [ ] Handle edge cases:
   - Expense is already Approved or in final state (disable form or show read-only)
   - Network error (future — for now, repository handles it; component shows toast on error)
- [ ] Validate status transitions follow the workflow (Submitted → Approved or Changes Requested, etc.)
- [ ] Write integration tests verifying:
   - Mock `useRepository()` and verify `updateExpenseStatus()` is called with correct args
   - Clicking "Approve" calls repository and updates local state with returned expense
   - Clicking "Request Changes" with comment calls repository with both status and comment
   - Form is disabled after successful submission
   - Incorrect status transitions are rejected

## Documentation Updates

- [ ] No architecture docs updates needed for this task (repository pattern was documented in task 08a)
