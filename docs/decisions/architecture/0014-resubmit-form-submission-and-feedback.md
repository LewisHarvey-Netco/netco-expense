# ADR-0014: Consultant resubmit form submission and feedback

## Status

Accepted (03-add-resubmit-submission-and-feedback-ui, completed 2026-09-02)

## Context

ADR-0013 made the consultant detail form editable (role + status → `isEditable`) and ticket 01
added `repository.updateExpense()` (merge partial updates, validate, force status `Resubmitted`,
reject `Approved`). What was missing was the **submission path**: a way for a consultant to commit
their edits and get feedback. Two questions needed deciding:

1. **Who owns the submission feedback** (loading, success, error, retry)? The card renders the
   form and the button; the page owns the data mutation.
2. **How does the card hand the edited values to the page?** The card is shared by the finance and
   consultant views (ADR-0012) and must stay reusable.

This completes the consultant editing feature tracked in `plans/consultant-expense-editing/`.

## Decision

Extend the ADR-0008 "form dumb / page smart, callback-driven" pattern to the resubmit action:

1. **The card owns submission feedback, the page owns the mutation.** `ExpenseDetailCard` takes an
   optional `onResubmit?: (updatedExpense: Expense) => Promise<void>` prop. On a valid submit the
   card calls `onResubmit` with the current form values plus the expense's `id`. The card renders
   all submission feedback itself:
   - **Loading** — while `onResubmit` is pending, the "Resubmit" button shows a spinner +
     "Resubmitting…" and is disabled (driven by react-hook-form's `formState.isSubmitting`); the
     form fields stay enabled.
   - **Success** — on fulfilment, an inline success message appears below the form and a
     "Back to Expenses" link appears. The success message auto-dismisses after ~3 seconds; the
     back link persists (it is gated on a separate `resubmitted` flag, not on the message).
   - **Error** — on rejection, an inline error message appears and the "Resubmit" button stays
     enabled for an immediate retry.
2. **The page performs the data access.** `ExpenseDetailPage` supplies `onResubmit` as a handler
   that calls `repository.updateExpense(id, updatedExpense)` and stores the returned expense in
   local state (`setExpense`), which re-renders the card with the new `Resubmitted` status. The
   handler lets rejections propagate to the card (no local try/catch), so the card's error path is
   the single place failures are surfaced.
3. **The button is opt-in.** The "Resubmit" button is rendered only when `isEditable` **and**
   `onResubmit` are both provided. A read-only card (`isEditable=false`) or a card without a
   callback shows no button, so an editable form with no wired handler cannot be submitted.
4. **Feedback resets only on a different expense.** The `message` and `resubmitted` state reset
   when `expense.id` changes, but not when the same expense is updated in place (a successful
   resubmit updates the same expense and must keep the success message and back link).

## Rationale

- **Consistent with ADR-0008.** `ReviewDecisionForm` already emits a decision via an `onSubmit`
  callback and leaves the data mutation to the page. Resubmit is the same shape (a form action that
  mutates the expense), so reusing the callback-driven pattern keeps one mental model for all
  forms.
- **Feedback belongs with the form.** Loading/success/error are presentation of the *submission*,
  which the card renders. Pushing that state to the page would force the page to know the card's
  internal UI (message text, auto-dismiss timing, back-link placement) and would couple the two
  more tightly than the single callback already does.
- **The page stays the data owner.** ADR-0010/0012 establish that pages own data access through the
  repository and components never edit data directly. Keeping `updateExpense` in the page preserves
  that boundary; the card never sees the repository.
- **Opt-in button keeps the card reusable.** A card with no `onResubmit` is exactly the read-only
  card from ADR-0012/0013, so existing callers (finance, approved expenses) are unaffected and the
  card can be reused in contexts where editing isn't available.

## Alternatives Considered

- **Page owns the feedback state and passes it down as props.** Rejected: the page would need to
  mirror the card's message/`resubmitted`/timer state and pass it back down, duplicating UI logic
  across the boundary for no gain.
- **Card calls the repository directly.** Rejected: breaks the ADR-0010/0012 boundary (components
  never touch the repository) and would make the card untestable without a repository.
- **A separate resubmit button component.** Rejected: the button, its loading state, and the
  feedback messages are tightly coupled to the form's submit lifecycle; splitting them adds indirection
  for no reuse benefit.

## Consequences

- `ExpenseDetailCard` has a new optional `onResubmit` prop and now uses `useNavigate` (for the
  "Back to Expenses" link), so it requires a Router in scope — its Storybook stories wrap it in a
  `MemoryRouter` decorator.
- `ExpenseDetailPage` is the single place that calls `repository.updateExpense()` for the
  consultant flow, mirroring how it already calls `updateExpenseStatus()` for the finance flow.
- The success message is transient (auto-dismiss ~3s) while the back link persists; this is
  deliberate so a consultant who lingers on the page still has a way back to the list.
- **Known follow-up (validator mismatch):** the form validates `id` with Zod's strict RFC 4122
  `uuid()` (version/variant checked), while the data layer (`src/lib/expense-validation.ts`, AJV)
  uses a lenient uuid regex (no version/variant). Mock data was corrected to real v4 UUIDs so both
  validators agree, but the two validators can still diverge on edge inputs. Aligning them (or
  documenting which is authoritative for `id`) is a follow-up.

## Related ADRs

- **ADR-0008** (Review decision form pattern) — the "form dumb / page smart, callback-driven" pattern this extends.
- **ADR-0013** (Consultant expense editability) — the `isEditable` rule that gates the resubmit button.
- **ADR-0012** (Role-aware expense detail page) — the page that supplies `onResubmit` and owns the mutation.
- **ADR-0010** (Mock repository pattern) — `updateExpense()` is the data-access boundary this flow calls.
