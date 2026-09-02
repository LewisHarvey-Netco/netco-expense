# PRD: Finance Review Pages Implementation

**Date:** 2026-08-24  
**Status:** Ready for Implementation  
**Source:** Comprehensive Grill-Me Interview (FINANCE-PAGES-GRILL-ME-OUTPUT.md)

---

## Problem Statement

Finance reviewers need a dedicated interface to review expenses submitted by consultants and make approval decisions. Currently, there is no structured workflow for:
- Viewing all submitted expenses in one place
- Reviewing individual expense details with supporting information
- Making approval decisions (approve or request changes)
- Communicating feedback to submitters about required changes

Without this, the expense review process is incomplete, and finance staff cannot properly manage and govern consultant expense submissions.

---

## Solution

Implement two new finance review pages:

1. **All Expenses Page** (`/review`) — A table-based interface showing all expenses with filtering capabilities. Finance staff can search, filter by status/type/submitter, and navigate to individual expenses for review.

2. **Expense Detail Page** (`/review/:id`) — A detailed view of a single expense showing:
   - Expense information (amount, type, date, submitter, etc.)
   - Receipt image placeholder (for future implementation)
   - Review decision form with "Approve" or "Request Changes" actions
   - Comment field (required when requesting changes; will integrate with conversation thread in future)

Both pages are protected by finance role access control. The workflow supports multiple revisions: finance can request changes, submitters revise, and finance re-reviews the resubmitted expense.

---

## User Stories

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

16. As a finance reviewer, I want to see the updated status reflected immediately after my decision so that I know my action was recorded.

17. As a finance reviewer, I want the "All Expenses" link in the navigation to take me to the review page so that I can quickly access the review interface.

18. As a consultant submitting an expense, I want the status to show "Changes Requested" so that I understand feedback is waiting.

19. As a consultant submitting an expense, I want to revise my expense after receiving feedback so that I can address the finance reviewer's concerns.

20. As a consultant submitting an expense, I want the status to change to "Resubmitted" after I save my revision so that the finance reviewer knows I've acted on their feedback.

21. As a consultant submitting an expense, I want the finance reviewer to be able to see my revised submission so that they can re-review with the corrections applied.

22. As a system, I want expenses to support four statuses (Submitted, Approved, Changes Requested, Resubmitted) so that the workflow is clear and unambiguous.

23. As a system, I want expenses to support five types (Breakfast, Lunch, Dinner, Transport, Accommodation) so that policy compliance can be enforced by category.

24. As a system, I want the expense data model to include all necessary fields (id, submitterId, description, type, amount, currency, receiptDate, status, submittedAt, internalNotes, region, project) so that the review interface has all information needed.

25. As a system administrator, I want the expense data model documented in JSON Schema so that future integrations with a backend API can reference the authoritative format.

---

## Implementation Decisions

### Routing & Access Control

- Routes are `/review` (all expenses table) and `/review/:id` (detail page)
- Both routes are protected by the existing `ProtectedRoute` guard with `role="finance"`
- The `roleHome('finance')` function already returns `/review`, so no changes needed there
- This reuses the existing routing structure and minimizes changes to current code

### Review Page Scope

The `/review` page implements:
- Table of all expenses with columns: Submitted (date), Submitter, Description, Type, Amount, Status, Action (link to detail)
- Filter panel with fields: Status, Submitter, Type, Date Range
- Filters are applied via an "Apply Filters" button (not real-time)
- Table is desktop-only; responsive design is out of scope

**Out of scope for this phase:**
- Sorting by column headers
- Pagination
- Cap summary calculations
- Flag details display
- Conversation/messaging thread

### Detail Page Scope

The `/review/:id` page implements:
- Left column: Expense details (amount, type, currency, date, submitter, region, project, description) and receipt image placeholder
- Right column: Review decision form with "Approve" and "Request Changes" buttons
- When "Request Changes" is selected, a comment field becomes required
- After decision, status is updated and page reflects the change

**Out of scope for this phase:**
- Conversation thread display (will be integrated when messaging feature is built)
- Cap summary or flag details in side panels
- Receipt image upload/viewer (placeholder only)

### Status Workflow

Expenses progress through four statuses:

```
Submitted
  ├─→ Approved ✓ (terminal)
  └─→ Changes Requested
      └─→ Resubmitted
          ├─→ Approved ✓ (terminal)
          └─→ Changes Requested (cycles)
```

- **Submitted**: Consultant has submitted an expense; finance must review
- **Approved**: Finance approved; workflow complete
- **Changes Requested**: Finance requested changes; consultant must revise
- **Resubmitted**: Consultant revised and resubmitted; finance must re-review

### Review Decision Actions

The review decision form offers two actions:
- **Approve**: Changes status to `Approved` and ends the workflow
- **Request Changes**: Changes status to `Changes Requested` and records a comment (required field)

**Out of scope:** Reject and Partial Approval; these are separate features to be added later.

### Review Decision Comment

When the finance reviewer selects "Request Changes":
- A comment field is required and must contain text before submission is allowed
- The comment is stored in the `internalNotes` field on the expense record
- **Future integration:** This comment will be auto-added to a conversation thread when messaging is integrated (tracked as Blocking Go-Live TODO)

### Data Model

The authoritative expense data model is defined in **JSON Schema Draft 2020-12** format (`docs/data-models/expense.schema.json`) with a Markdown summary (`docs/data-models/expense.md`).

**Fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string (UUID) | Yes | Unique identifier |
| `submitterId` | string | Yes | User ID of expense submitter (references existing user) |
| `description` | string | Yes | User-provided description of the expense |
| `type` | enum | Yes | One of: Breakfast, Lunch, Dinner, Transport, Accommodation |
| `amount` | number | Yes | Must be > 0 |
| `currency` | string | Yes | ISO 4217 code (e.g., "EUR", "USD", "DKK") |
| `receiptDate` | string (ISO 8601 date) | Yes | Date on the receipt (YYYY-MM-DD) |
| `status` | enum | Yes | One of: Submitted, Approved, Changes Requested, Resubmitted |
| `submittedAt` | string (ISO 8601 timestamp) | Yes | When the expense was first submitted |
| `internalNotes` | string or null | No | Finance reviewer comments; typically populated when status = Changes Requested |
| `region` | string | Yes | Geographic region (e.g., "EMEA", "DACH", "Nordics") |
| `project` | string | Yes | Project code or name associated with the expense |

### Expense Types

Five expense types are supported:
- Breakfast
- Lunch
- Dinner
- Transport
- Accommodation

These are constrained by policy and will be used for compliance verification.

### Mock Data

~10 mock expenses will be generated to support development and testing. The mock dataset will include:
- All four statuses represented (Submitted, Approved, Changes Requested, Resubmitted)
- All five expense types
- Multiple submitters (Alice Nielsen, Bob Madsen)
- Mixed regions, projects, and currencies for realism

### Navigation

The existing Header component will be extended with a navigation section. The "All Expenses" link will be added to allow finance staff to quickly access the review page. The navigation follows DESIGN-GUIDELINES and maintains the restrained, technical aesthetic.

**Scope:** Only "All Expenses" link is added now. "Flagged Queue" and "Statistics" are separate features.

### Table Component

The all expenses table is rendered using the **shadcn Table component** (added via `npx shadcn@latest add table`). This component is vendored within the project per AGENTS.md convention and provides accessible, styled table rendering without external dependencies.

### Responsive Design

For this MVP phase, the review pages are **desktop-only**. Mobile and tablet responsiveness (card-based layout or horizontal scroll) are out of scope and will be added in a later phase.

### Styling

All styling follows `DESIGN-GUIDELINES.md`:
- Use only the defined Netcompany palette (green, dark-green, white, coral)
- No arbitrary colours or heavy decoration
- Studio 6 typography; Regular weight default, Demibold/Bold only for hierarchy
- One prominent coral use per page maximum (used only for primary action)
- Clean, technical, restrained aesthetic — no gradients or heavy shadows
- All CSS uses CSS variables (`--primary`, `--foreground`, etc.) — never hardcoded hex values
- Component variants are extended in shadcn component definitions, not patched inline

---

## Testing Decisions

### What Makes a Good Test

Tests should verify **external behavior and user workflows**, not implementation details:
- Test what a user or system observer can verify
- Test the interface (props, callbacks, rendered output), not internal state or methods
- Avoid snapshot tests and assertions about DOM structure details
- Focus on meaningful business logic: status changes, form validation, filter application, navigation

### Modules to Test

1. **Expense Data Model & Schema**: Unit tests verifying JSON Schema validation, type correctness, and constraint enforcement
2. **Status Workflow Logic**: Unit tests for valid status transitions (e.g., submitted → approved, changes requested → resubmitted)
3. **Filter Logic**: Unit tests for filter application (status filter, date range filter, etc.)
4. **Review Decision Form**: Component tests verifying:
   - "Approve" button triggers status change to Approved
   - "Request Changes" button requires a comment before submission
   - Form submission calls the expected callbacks
5. **All Expenses Table**: Component tests verifying:
   - Table renders mock expenses correctly
   - Filters apply correctly when "Apply Filters" is clicked
   - Clicking a row navigates to the detail page
6. **Expense Detail Page**: Component/integration tests verifying:
   - Expense details are displayed correctly
   - Review decision form is functional
   - Status update is reflected after decision

### E2E Tests

Playwright E2E tests should cover the core user journeys:
1. **Finance review workflow**: Log in as finance user → navigate to All Expenses → filter by status → click an expense → review details → approve → verify status updated
2. **Request changes workflow**: Log in as finance user → navigate to expense detail → select "Request Changes" → enter comment → submit → verify status changed and comment stored
3. **Access control**: Verify non-finance users cannot access `/review` or `/review/:id`

### Prior Art / Existing Test Patterns

- Look at existing tests in `src/` for component testing patterns (Vitest + React Testing Library)
- Look at existing E2E tests in `e2e/` for Playwright patterns and navigation flows
- Use mocks (or mock context providers) for `AuthContext` and any data-fetching dependencies

---

## Out of Scope

The following features are explicitly **not** included in this implementation and will be addressed in future work:

1. **Conversation/Messaging Thread**: Comments will be stored but not displayed in a threaded conversation. Conversation integration is tracked as a Blocking Go-Live TODO and will be implemented in a separate effort.

2. **Daily Food Cap Summary & Calculations**: The right-column panel showing cap summary, deductions, and warnings is not implemented. This requires cap policy logic and thresholds that are out of scope for this phase.

3. **Flag Details Display**: Flagged exceptions and their details (from the prototype) are not shown. Flag logic will be added when the conversation and cap features are ready.

4. **Reject and Partial Approval Actions**: The review form only supports Approve and Request Changes. Reject and Partial Approval are separate decisions to be added later.

5. **Sorting by Column Headers**: Table columns are not sortable. Sorting logic and state management can be added in a later phase.

6. **Pagination**: The table displays all expenses; pagination is out of scope.

7. **Receipt Image Upload & Viewer**: The receipt image is a placeholder only. Upload and viewing functionality will be added when document handling is integrated.

8. **Mobile & Tablet Responsiveness**: Pages are desktop-only for this MVP. Responsive design (card-based mobile layout, horizontal scroll, etc.) will be added after core desktop functionality is validated.

9. **Search Bar**: Full-text search of expenses is not included; filtering is by specific fields only.

10. **Statistics Page & Flagged Queue**: The prototype nav mentions "Statistics" and "Flagged Queue" pages, but only "All Expenses" is implemented now.

---

## Further Notes

### Integration Points for Future Work

- **Conversation Threading**: When messaging is implemented, the `internalNotes` field and comment submission flow will be expanded to auto-populate a conversation thread visible to both finance and consultant.
- **Backend API**: This implementation uses mock data. When a backend API is available, the data-fetching layer can be swapped without changing component logic.
- **Real Receipt Images**: The receipt placeholder will be replaced with actual upload/view functionality when document storage is available.
- **Permissions & Audit**: Future work should add audit logging for who approved/requested changes and when.

### Architecture Compliance

- Follows existing `ProtectedRoute` pattern for access control (no new patterns introduced)
- Uses existing `AuthContext` for user information
- No new service or API layer is added; this remains view-focused with mock data
- Will integrate with backend via a future data-fetching layer when available

### Design Compliance

All UI components and styling adhere to `DESIGN-GUIDELINES.md`:
- Netcompany palette strictly enforced
- Studio 6 typography with restrained hierarchy
- Clean, technical aesthetic
- Coral used only for the primary action (Approve button)

### Component Library

Uses only the following:
- **shadcn/ui** components (Table, Button, Form, Input, Select, DatePicker, etc. — added via CLI as needed)
- **Tailwind CSS v4** for layout and spacing
- **lucide-react** icons
- **react-hook-form + zod** for form handling and validation
- **React Router v7** for navigation

No external table, date picker, or form libraries beyond shadcn/ui.
