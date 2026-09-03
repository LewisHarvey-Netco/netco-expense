# 03: Add Resubmit Form Submission & Feedback UI

**What to build:** Form submission and user feedback. The form captures edited changes, validates against `expenseSchema`, wires `onResubmit` callback to call `repository.updateExpense()`, and shows loading/success/error feedback states. Users can retry on failure. Displayed expense updates to show new `Resubmitted` status after successful submission.

**Blocked by:** 02-enable-form-editing-and-determine-editability

**Status:** done (2026-09-02)

- [x] `ExpenseDetailCard` accepts `onResubmit(updatedExpense: Expense): Promise<void>` callback prop
- [x] "Resubmit" button is visible only when `isEditable={true}`; hidden when `isEditable={false}`
- [x] Clicking "Resubmit" validates form against `expenseSchema` before submission
- [x] Invalid form data prevents submission; inline validation errors displayed as-is (no duplicate error messages)
- [x] Valid form submission calls `onResubmit` with updated expense object (form values + ID)
- [x] During submission: "Resubmit" button shows loading spinner/text and is disabled; form fields remain editable
- [x] On successful submission: inline success message appears below form; "Back to Expenses" navigation link appears; success message auto-dismisses after ~3 seconds; displayed expense object updates to reflect new status `Resubmitted`
- [x] On failed submission: inline error message appears below form; "Resubmit" button remains enabled for immediate retry
- [x] `ExpenseDetailPage` wires `onResubmit` callback to call `repository.updateExpense(id, updatedFormValues)`
- [x] Component tests verify form validation, loading state, success message, error message, and retry capability
- [x] Integration tests verify status transition from Submitted/Changes Requested/Resubmitted to Resubmitted and displayed update
