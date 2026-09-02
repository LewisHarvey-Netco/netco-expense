# ADR-0007: Expense status workflow as a four-state machine

## Status
Accepted

## Context

The Finance Review feature requires expenses to progress through a review workflow with multiple stages. A decision was needed on how many statuses to support, what transitions are valid, and how to represent this in the data model and UI.

## Decision

Support **four statuses** with defined transitions:

```
Submitted
  ├─→ Approved (terminal)
  └─→ Changes Requested
      └─→ Resubmitted
          ├─→ Approved (terminal)
          └─→ Changes Requested (cycles)
```

- **Submitted:** Consultant has submitted an expense; finance must review
- **Approved:** Finance approved; workflow complete (terminal state)
- **Changes Requested:** Finance requested changes; consultant must revise
- **Resubmitted:** Consultant revised and resubmitted; finance must re-review

The status is stored as an enum (`ExpenseStatus`) on the expense record. Transitions are triggered by user actions: "Approve" → Approved, "Request Changes" → Changes Requested.

## Rationale

- **Clear workflow:** Four statuses cover the review cycle without ambiguity. Each status has a clear meaning and expected next action.
- **Terminal state:** "Approved" is terminal — once approved, the expense cannot be changed. This matches real-world expense approval processes.
- **Cycling support:** "Changes Requested" → "Resubmitted" → "Changes Requested" can cycle, allowing multiple revision rounds. This is common in expense review workflows.
- **No "Rejected" today:** Reject and Partial Approval are out of scope. Adding them later would require new statuses and transitions, which can be done without breaking the current model.

## Consequences

- **Status transitions are not validated today:** The frontend does not enforce valid transitions (e.g., preventing "Approved" → "Submitted"). This is acceptable for a mock-data demo but would be required in production. A backend API would enforce transitions server-side.
- **UI reflects status:** Each status has a visual representation (badge color, form state). The detail page disables the review form when the expense is in a terminal state ("Approved").
- **Consultant workflow is separate:** The "Resubmitted" status is set by the consultant (not finance). This ticket focuses on the finance side; the consultant revision flow is a separate feature.
- **Audit trail is not tracked:** Who approved/requested changes and when is not recorded. This is a future enhancement (tracked as "Permissions & Audit" in the PRD).
