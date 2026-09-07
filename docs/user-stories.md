# User Stories

## Authentication & Login

1. As a user, I want to log in with an email and password so that I can access my role-specific expense management interface.

2. As a finance user, I want to log in and be routed to the review queue so that I can immediately begin my work reviewing expenses.

3. As a consultant user, I want to log in and be routed to my expenses so that I can see my submissions and current status.

## Finance Reviewer Stories

### Review Page & Navigation

4. As a finance reviewer, I want to see a table of all expenses so that I can understand the volume and status of submissions at a glance.

5. As a finance reviewer, I want to filter expenses by status (Submitted, Approved, Changes Requested, Resubmitted) so that I can focus on expenses requiring action.

6. As a finance reviewer, I want to filter expenses by submitter so that I can review expenses from a specific consultant.

7. As a finance reviewer, I want to filter expenses by type (Breakfast, Lunch, Dinner, Transport, Accommodation) so that I can verify policy compliance by category.

8. As a finance reviewer, I want to filter expenses by date range so that I can manage expenses by reporting period.

9. As a finance reviewer, I want to apply filters with an "Apply Filters" button so that I can batch my filter selections before viewing results.

10. As a finance reviewer, I want to click on an expense in the table so that I can view its full details and make a decision.

11. As a finance reviewer, I want the "All Expenses" link in the navigation to take me to the review page so that I can quickly access the review interface.

### Expense Detail & Decision Form

12. As a finance reviewer, I want to see the expense details including amount, type, currency, date, submitter, region, project, and description so that I have all information needed to make a decision.

13. As a finance reviewer, I want to see a receipt image placeholder on the detail page so that I can preview supporting documentation (future feature).

14. As a finance reviewer, I want to click an "Approve" button so that I can approve an expense for reimbursement.

15. As a finance reviewer, I want to click a "Request Changes" button so that I can ask the submitter to revise the expense.

16. As a finance reviewer, I want to write a comment when requesting changes so that I can communicate the reason for the request to the submitter.

17. As a finance reviewer, I want the comment to be required when I select "Request Changes" so that submitters always know why changes are needed.

18. As a finance reviewer, I want the status to change to "Approved" after I click Approve so that the workflow reflects my decision.

19. As a finance reviewer, I want the status to change to "Changes Requested" after I click Request Changes so that the submitter knows action is required.

20. As a finance reviewer, I want the updated status reflected immediately after my decision so that I know my action was recorded.

### List Refresh & Data Integrity

21. As a finance reviewer, when I return to the expense list after making a decision, I want the table to fetch fresh data from the repository so that I see the updated status immediately (not stale data).

22. As a finance reviewer, I want to be assured that when I approve or request changes on an expense, the change is visible and persistent in the system so that I have confidence in the system's data integrity.

23. As a finance reviewer, I want to see a brief loading indicator (and "Loading expenses…" message) when the list is fetching data so that I understand why the table might take a moment to appear.

24. As a finance reviewer, if the app fails to load the expense list, I want to see a clear error message so that I understand what went wrong and know what to do next (e.g., try again or contact support).

25. As a finance user, I want the existing expense review table to continue showing all expenses (not filtered by submitter) so that I can review all submissions.

26. As a finance user, I want the existing expense detail page to show the review decision form on the right side so that I can approve or request changes.

## Consultant Stories

### Expense Viewing

27. As a consultant, I want to see a list of all my submitted expenses so that I can track my submissions.

28. As a consultant, I want to filter my expenses by status (Submitted, Approved, Changes Requested, Resubmitted) so that I can find expenses in a particular state.

29. As a consultant, I want to filter my expenses by type (Breakfast, Lunch, Dinner, Transport, Accommodation) so that I can see only the categories I'm interested in.

30. As a consultant, I want to filter my expenses by date range so that I can find expenses from a specific time period.

31. As a consultant, I want to apply multiple filters at once so that I can narrow down my expense list efficiently.

32. As a consultant, I want to clear all filters with a single button so that I can quickly reset to see all my expenses again.

33. As a consultant, I want to see how many expenses match my filter criteria so that I have visibility into the filter results.

34. As a consultant, I want to click on an expense row in the list so that I can view its full details.

35. As a consultant, I want to see a loading state while my expenses are being fetched so that I know the page is working.

36. As a consultant, I want to see an error message if the expense list fails to load so that I understand what went wrong.

37. As a consultant, I want to see an empty state message if I have no expenses so that I'm not confused by a blank page.

### Expense Detail Viewing

38. As a consultant, I want to view the full details of a single expense so that I can review all information I submitted.

39. As a consultant, I want to see all expense fields in the detail view (amount, type, status, dates, submitter, region, project, description, internal notes, receipt placeholder) so that I have complete visibility into my submission.

40. As a consultant, I want all fields in the expense detail view to be read-only so that I cannot accidentally modify my submission before it is reviewed.

41. As a consultant, I want to see internal notes added by finance users so that I understand feedback on my submission.

42. As a consultant, I want to see a back button on the detail page that returns me to my expense list so that I can easily navigate back.

43. As a consultant, I want to see a loading state while a single expense is being fetched so that I know the page is working.

44. As a consultant, I want to see an error message if the expense detail fails to load so that I understand what went wrong.

45. As a consultant, I want to be redirected if I try to view another consultant's expense by URL manipulation so that my expense data is protected.

46. As a consultant, I want a navigation link to my expenses in the header so that I can easily access my expense list.

### Expense Editing & Resubmission

47. As a consultant, I want to edit an expense I just submitted so that I can correct mistakes before finance reviews it.

48. As a consultant, I want to see inline validation errors as I edit so that I know what needs to be fixed before resubmitting.

49. As a consultant, I want to resubmit an expense after fixing errors so that finance can re-review my corrected submission.

50. As a consultant, I want to see a success confirmation after resubmitting so that I know my changes were saved.

51. As a consultant, I want to manually navigate back to my expense list after resubmitting so that I have control over when I leave the detail page.

52. As a consultant, I want to edit an expense again if finance requests changes so that I can address their feedback without contacting support.

53. As a consultant, I want to continue editing a `Resubmitted` expense while it's awaiting finance review so that I can make further refinements if needed.

54. As a consultant, I want form fields to remain disabled on approved expenses so that I cannot accidentally edit a finalized expense.

55. As a consultant, I want to see an error message if resubmission fails so that I understand what went wrong and can retry.

56. As a consultant, I want to retry a failed resubmission so that I can recover from temporary network issues without losing my edits.

### Consultant Submission Status

57. As a consultant submitting an expense, I want the status to show "Changes Requested" so that I understand feedback is waiting.

58. As a consultant submitting an expense, I want to revise my expense after receiving feedback so that I can address the finance reviewer's concerns.

59. As a consultant submitting an expense, I want the status to change to "Resubmitted" after I save my revision so that the finance reviewer knows I've acted on their feedback.

60. As a consultant submitting an expense, I want the finance reviewer to be able to see my revised submission so that they can re-review with the corrections applied.


