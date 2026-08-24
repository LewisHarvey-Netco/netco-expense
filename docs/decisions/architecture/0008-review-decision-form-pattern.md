# ADR-0008: Review decision form with conditional required comment

## Status
Accepted

## Context

The Expense Detail page requires a form for finance reviewers to make approval decisions. The form must support two actions (Approve, Request Changes) and conditionally require a comment when requesting changes. A decision was needed on how to structure the form, validate inputs, and handle submission.

## Decision

Use **react-hook-form + zod** for form state and validation, with shadcn/ui components for rendering. The form has two mutually exclusive actions:

- **Approve:** No comment required. Submitting changes status to "Approved".
- **Request Changes:** Comment field appears and becomes **required**. Submitting changes status to "Changes Requested" and stores the comment in `internalNotes`.

The form is a standalone component (`ReviewDecisionForm.tsx`) that receives an `onSubmit` callback. It does not manage expense state or perform status updates — it only validates and emits the decision.

## Rationale

- **Existing pattern:** The app already uses react-hook-form + zod for forms (see `LoginPage.tsx`). This decision reuses that pattern rather than introducing a new one.
- **Conditional validation:** Zod schemas can express conditional required fields natively (e.g., `when` clause), making the "comment required only when requesting changes" rule easy to express and test.
- **Component isolation:** The form is decoupled from the expense data and status update logic. This makes it testable in isolation and reusable if other pages need a review form.
- **Callback-driven:** The form emits a decision via callback, not by mutating state directly. This keeps the form dumb and the page smart (consistent with the app's component architecture).

## Consequences

- **Two submit paths:** The form has two buttons ("Approve", "Request Changes"), but only one is active at a time. The zod schema validates based on which action is selected.
- **Comment is stored in `internalNotes`:** The comment field maps to the `internalNotes` field on the expense record. This is a temporary home for the comment; when conversation threading is added, the comment will also be added to a conversation thread.
- **Form disables after submission:** Once a decision is recorded, the form is disabled (or the page navigates away). This prevents double-submission and makes the UI state clear.
- **No draft state:** If the user starts typing a comment but navigates away, the comment is lost. This is acceptable for an MVP; draft persistence can be added later if needed.
