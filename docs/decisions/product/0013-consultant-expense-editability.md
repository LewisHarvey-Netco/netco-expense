# ADR-0013: Consultant expense editability (role + status)

## Status

Implemented (02-enable-form-editing-and-determine-editability, completed 2026-09-02)

## Context

Consultants could only view their expenses read-only. The PRD
(`plans/consultant-expense-editing/PRD.md`) requires consultants to be able to edit their own
expense and resubmit it while it is in the review cycle, so they can correct mistakes or address
finance feedback without manual support. Two questions needed deciding:

1. **Which expenses may a consultant edit?** The status workflow (ADR-0007) has four states;
   `Approved` is terminal and must never be reopened.
2. **Where does the editability decision live?** The detail card (`ExpenseDetailCard`) is
   shared by the finance and consultant views of `ExpenseDetailPage` (ADR-0012).

## Decision

1. **Editable statuses for consultants:** `Submitted`, `Changes Requested`, and `Resubmitted`.
   `Approved` is the only status that locks the form.
   - `Submitted`: awaiting first finance review — the consultant may still correct mistakes.
   - `Changes Requested`: finance asked for changes — the consultant edits to address feedback.
   - `Resubmitted`: awaiting re-review — the consultant may keep refining until approved.
   - `Approved`: terminal; editing is refused by both the UI and the repository
     (`updateExpense()` throws `"Cannot edit an approved expense"`).
2. **Finance never edits.** The review workflow is unchanged; finance always sees a read-only
   form and acts through the review decision form.
3. **The page computes, the card renders.** `ExpenseDetailPage` computes a single `isEditable`
   boolean from the viewer's role and the expense status
   (`user.role === 'consultant' && status ∈ {Submitted, Changes Requested, Resubmitted}`) and
   passes it to `ExpenseDetailCard` as a prop. The card takes `isEditable` (default `false`)
   and only enables/disables its form fields; it contains no role or status logic.
4. **Validation is preserved.** The editable fields stay react-hook-form fields validated by
   `expenseSchema` (Zod); the form validates on blur and shows inline field errors as fields
   become invalid. `isEditable` only enables or disables the fields — it does not weaken,
   bypass, or remove the validation wiring.

## Rationale

- **Terminal state is immutable.** `Approved` means finance has finalised the expense; allowing
  edits after approval would invalidate the decision. Refusing edits in both the UI and the
  repository keeps the guarantee even if the UI is bypassed.
- **Editability is a product rule, not a presentation detail.** Which role may edit which
  status is workflow policy (ADR-0007), so it belongs next to the other role/status decisions —
  in the page, which already knows the role (via `useAuth()`) and the loaded expense. The card
  stays a dumb, reusable form: one boolean in, enabled/disabled fields out.
- **One boolean, not per-field flags.** All seven consultant-editable fields share the same
  editability; per-field flags would add surface area for no current benefit. Workflow-managed
  fields (status, submission date, submitter, internal notes, receipt) are display elements and
  are never editable by either role.
- **Default `false` is fail-safe.** A caller that omits `isEditable` gets a read-only card, so
  the safe behaviour is the default.

## Alternatives Considered

- **Card computes editability from `role` + `expense.status` itself.** Rejected: the card
  already takes a `role` prop it doesn't need for rendering; adding status logic to a shared
  presentational component would duplicate the workflow rule in two places (page and card) and
  make the card harder to reuse (e.g. in a future edit form).
- **Separate editable and read-only card variants.** Rejected: the two variants would render the
  same seven fields with only `disabled` differing; two components would drift on every field
  change. One component with a boolean is simpler and keeps a single source for the form.
- **Allow editing `Approved` expenses with an explicit "reopen" action.** Rejected: reopening a
  terminal state is a product decision with audit implications; it is out of scope for this
  feature (the PRD lists it under out-of-scope/future).

## Consequences

- `ExpenseDetailCard` has a new `isEditable` prop (default `false`); existing callers that omit
  it keep the previous read-only behaviour.
- `ExpenseDetailPage` is the single place that encodes the consultant editability rule; if the
  editable statuses change, only the page (and this ADR) need updating.
- The card now shows inline validation errors (on blur) for the editable fields, matching the
  error-display convention of `LoginPage` and `ReviewDecisionForm`.
- The resubmit action (submit → `repository.updateExpense()` → status `Resubmitted` →
  feedback) is a separate step tracked in `plans/consultant-expense-editing/`; until it lands,
  an editable form has no submit button yet.
- Supersedes the read-only consultant detail described in ADR-0012's consequences for the
  non-terminal statuses; the ownership check (consultants see only their own expenses) is
  unchanged and still gates the editable view.

## Related ADRs

- **ADR-0007** (Expense status workflow) — defines the four statuses and the terminal `Approved` state this rule builds on.
- **ADR-0012** (Role-aware expense detail page) — the page that computes `isEditable` and the card it renders.
- **ADR-0010** (Mock repository pattern) — `updateExpense()` (added with this feature's ticket 01) is the data-access boundary that enforces the `Approved` lock server-side-shaped.
