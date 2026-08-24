# 09: Integrate Decision Form & Implement Status Updates

**What to build:** Wire the ReviewDecisionForm into the Expense Detail page. When the form is submitted, update the expense's status (and internalNotes if "Request Changes") and reflect the change immediately on the page.

**Blocked by:** 07 - Create Expense Detail Page (/review/:id), 08 - Build Review Decision Form Component

**Status:** ready-for-agent

- [ ] Update `ExpenseDetailPage.tsx` to include ReviewDecisionForm in right column
- [ ] Add local state for the current expense (loaded from mock)
- [ ] When ReviewDecisionForm submits:
  - If "Approve": set expense.status = "Approved"
  - If "Request Changes": set expense.status = "Changes Requested" and expense.internalNotes = comment
  - Update mock data (or app state) to reflect the change
  - Display success feedback (toast, message, or status badge color change)
- [ ] After submission, disable the form (or navigate away, or show "Decision recorded")
- [ ] Handle edge cases:
  - Expense is already Approved or in final state (disable form or show read-only)
  - Network error (future — for now, just update local state)
- [ ] Validate status transitions follow the workflow (Submitted → Approved or Changes Requested, etc.)
- [ ] Write integration tests verifying:
  - Clicking "Approve" updates status to "Approved" and reflects on page
  - Clicking "Request Changes" with comment updates status and stores comment
  - Form is disabled after successful submission
  - Incorrect status transitions are rejected
