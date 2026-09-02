# 03: Add Resubmit Form Submission & Feedback UI

**What to build:** Form submission and user feedback. The form captures edited changes, validates against `expenseSchema`, wires `onResubmit` callback to call `repository.updateExpense()`, and shows loading/success/error feedback states. Users can retry on failure. Displayed expense updates to show new `Resubmitted` status after successful submission.

**Blocked by:** 02-enable-form-editing-and-determine-editability

**Status:** ready-for-agent

- [ ] `ExpenseDetailCard` accepts `onResubmit(updatedExpense: Expense): Promise<void>` callback prop
- [ ] "Resubmit" button is visible only when `isEditable={true}`; hidden when `isEditable={false}`
- [ ] Clicking "Resubmit" validates form against `expenseSchema` before submission
- [ ] Invalid form data prevents submission; inline validation errors displayed as-is (no duplicate error messages)
- [ ] Valid form submission calls `onResubmit` with updated expense object (form values + ID)
- [ ] During submission: "Resubmit" button shows loading spinner/text and is disabled; form fields remain editable
- [ ] On successful submission: inline success message appears below form; "Back to Expenses" navigation link appears; success message auto-dismisses after ~3 seconds; displayed expense object updates to reflect new status `Resubmitted`
- [ ] On failed submission: inline error message appears below form; "Resubmit" button remains enabled for immediate retry
- [ ] `ExpenseDetailPage` wires `onResubmit` callback to call `repository.updateExpense(id, updatedFormValues)`
- [ ] Component tests verify form validation, loading state, success message, error message, and retry capability
- [ ] Integration tests verify status transition from Submitted/Changes Requested/Resubmitted to Resubmitted and displayed update
