# 03: Implement submission flow with success and error handling in `ExpenseCreatePage`

**What to build:** When a consultant fills the form and clicks Submit, the expense is created with loading feedback, success confirmation, and error recovery; form data is retained on failure for retry. Also add a "New Expense" button on the `/expenses` list page so consultants can discover and navigate to the creation page.

**Blocked by:**
- Ticket 01 (needs `createExpense()` method)
- Ticket 02 (needs page and card prop)

**Status:** ready-for-agent

## Acceptance Criteria

- [ ] Implement `handleCreate()` callback that calls `repo.createExpense(expense)` with validated form data
- [ ] Show loading spinner and disable Submit button during submission
- [ ] On success: display success message/toast, then navigate to `/expenses/{id}` after short delay (1-2 seconds)
- [ ] On error: display error alert/message, retain form data intact (no clearing on error)
- [ ] User can correct form and retry without losing input
- [ ] Tests cover: successful submission and navigation, error display and form persistence, loading state visibility during submission, successful retry after error
- [ ] Form validation still works on blur (no regression)
- [ ] Expense is created with `Submitted` status (immutable on creation)
- [ ] "New Expense" button rendered on the `/expenses` list page (consultant view), linking to `/expenses/new`
- [ ] Button uses the primary button variant and is placed in the page title/action area
- [ ] Test covers: button is visible on the consultant expense list and navigates to `/expenses/new`