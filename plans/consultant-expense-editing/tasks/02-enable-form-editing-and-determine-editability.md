# 02: Enable Form Editing & Determine Editability

**What to build:** The complete editability logic across component and page layers. `ExpenseDetailCard` accepts an `isEditable` prop that enables/disables form fields. `ExpenseDetailPage` computes `isEditable` based on user role and expense status: consultants see editable forms for `Submitted`, `Changes Requested`, `Resubmitted`; disabled forms for `Approved`; finance always sees disabled forms.

**Blocked by:** 01-add-updateexpense-to-repository

**Status:** ready-for-agent

- [ ] `ExpenseDetailCard` accepts `isEditable: boolean` prop (defaults to `false` for backward compatibility)
- [ ] When `isEditable={true}`, all form input fields are enabled (remove `disabled` attribute)
- [ ] When `isEditable={false}`, all form input fields remain disabled (current behavior preserved)
- [ ] `ExpenseDetailPage` computes `isEditable` for consultant: `true` if status ∈ {Submitted, Changes Requested, Resubmitted}, `false` if status = Approved
- [ ] `ExpenseDetailPage` computes `isEditable` for finance: always `false` (review workflow unchanged)
- [ ] Form validation state is preserved regardless of `isEditable` value (errors still show when appropriate)
- [ ] Component passes `isEditable={true/false}` to `ExpenseDetailCard` based on computed logic
- [ ] Component tests verify field disabled state matches `isEditable` prop in all cases
- [ ] Integration tests verify correct behavior for all status combinations (consultant: Submitted, Changes Requested, Resubmitted, Approved; finance: all statuses)
