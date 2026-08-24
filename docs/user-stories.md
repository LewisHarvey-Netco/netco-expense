# User Stories

## Finance Review Pages

### Finance Reviewer Stories

1. As a finance reviewer, I want to see a table of all expenses so that I can understand the volume and status of submissions at a glance.

2. As a finance reviewer, I want to filter expenses by status (Submitted, Approved, Changes Requested, Resubmitted) so that I can focus on expenses requiring action.

3. As a finance reviewer, I want to filter expenses by submitter so that I can review expenses from a specific consultant.

4. As a finance reviewer, I want to filter expenses by type (Breakfast, Lunch, Dinner, Transport, Accommodation) so that I can verify policy compliance by category.

5. As a finance reviewer, I want to filter expenses by date range so that I can manage expenses by reporting period.

6. As a finance reviewer, I want to apply filters with an "Apply Filters" button so that I can batch my filter selections before viewing results.

7. As a finance reviewer, I want to click on an expense in the table so that I can view its full details and make a decision.

8. As a finance reviewer, I want to see the expense details including amount, type, currency, date, submitter, region, project, and description so that I have all information needed to make a decision.

9. As a finance reviewer, I want to see a receipt image placeholder on the detail page so that I can preview supporting documentation (future feature).

10. As a finance reviewer, I want to click an "Approve" button so that I can approve an expense for reimbursement.

11. As a finance reviewer, I want to click a "Request Changes" button so that I can ask the submitter to revise the expense.

12. As a finance reviewer, I want to write a comment when requesting changes so that I can communicate the reason for the request to the submitter.

13. As a finance reviewer, I want the comment to be required when I select "Request Changes" so that submitters always know why changes are needed.

14. As a finance reviewer, I want the status to change to "Approved" after I click Approve so that the workflow reflects my decision.

15. As a finance reviewer, I want the status to change to "Changes Requested" after I click Request Changes so that the submitter knows action is required.

16. As a finance reviewer, I want the updated status reflected immediately after my decision so that I know my action was recorded.

17. As a finance reviewer, I want the "All Expenses" link in the navigation to take me to the review page so that I can quickly access the review interface.

### Consultant Stories

18. As a consultant submitting an expense, I want the status to show "Changes Requested" so that I understand feedback is waiting.

19. As a consultant submitting an expense, I want to revise my expense after receiving feedback so that I can address the finance reviewer's concerns.

20. As a consultant submitting an expense, I want the status to change to "Resubmitted" after I save my revision so that the finance reviewer knows I've acted on their feedback.

21. As a consultant submitting an expense, I want the finance reviewer to be able to see my revised submission so that they can re-review with the corrections applied.

### System Stories

22. As a system, I want expenses to support four statuses (Submitted, Approved, Changes Requested, Resubmitted) so that the workflow is clear and unambiguous.

23. As a system, I want expenses to support five types (Breakfast, Lunch, Dinner, Transport, Accommodation) so that policy compliance can be enforced by category.

24. As a system, I want the expense data model to include all necessary fields (id, submitterId, description, type, amount, currency, receiptDate, status, submittedAt, internalNotes, region, project) so that the review interface has all information needed.

### System Administrator Stories

25. As a system administrator, I want the expense data model documented in JSON Schema so that future integrations with a backend API can reference the authoritative format.
