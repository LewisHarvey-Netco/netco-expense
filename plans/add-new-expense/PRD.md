# PRD: Add New Expense Feature

**Created:** 2026-09-22  
**Feature:** Enable consultants to create new expenses via `/expenses/new` route  
**Status:** Ready for implementation

---

## Problem Statement

Consultants currently cannot create new expenses through the application. They can only view and edit existing expenses. To complete the expense workflow, they need a dedicated interface to submit new expense claims that are immediately ready for finance review.

---

## Solution

Create a new `/expenses/new` page that provides a form for consultants to submit new expenses. The form will be pre-populated with sensible defaults (today's date, current user ID, USD currency) and will initialize the expense with a `Submitted` status so it's ready for finance review immediately upon creation. The implementation will reuse the existing `ExpenseDetailCard` component with a new `buttonLabel` prop to customize the button text, keeping component logic stable while adapting its presentation to the creation context.

---

## User Stories

This feature implements user stories **61–85** from [`docs/user-stories.md`](../../docs/user-stories.md#expense-creation):

- **61:** Navigate to "New Expense" page
- **62:** Pre-populated receipt date (today)
- **63:** Pre-filled submitter (current user ID)
- **64:** Currency defaults to USD
- **65:** Expense type dropdown shows available options
- **66:** Fill in all required fields (amount, description, dates, etc.)
- **67:** Validation errors on form interactions
- **68:** "Submit" button to create the expense
- **69:** Loading state during creation
- **70:** Success message after creation
- **71:** Redirect to expense detail page after creation
- **72:** Newly created expenses have "Submitted" status
- **73:** System generates unique ID for new expense
- **74:** Back button on new expense page
- **75:** Page title clearly indicates new expense creation
- **76:** Error messages displayed on creation failure
- **77:** Retry capability if creation fails
- **78:** Role-based access control (consultants only)
- **79:** Authentication check (redirect to login if unauthenticated)
- **80:** Form is consistent with edit form
- **81:** Optional fields remain optional
- **82:** YYYY-MM-DD date format
- **83:** Region and project fields available but optional
- **84:** Internal notes field available but optional
- **85:** Date fields labeled and formatted consistently

---

## Implementation Decisions

### Component Enhancement
- **Add `buttonLabel` prop to `ExpenseDetailCard`:** Optional string prop that defaults to `'Resubmit'` for backward compatibility. When provided, it overrides the button text, allowing the component to be used in both edit (Resubmit) and create (Submit) contexts.
- **Rationale:** Keeps the card component's responsibility focused on form rendering. The page layer owns the distinction between new vs. existing expenses. No changes to form logic or behavior required.

### Repository Layer Enhancement
- **Add `createExpense(expense: Expense) => Promise<Expense>` method** to the `ExpenseRepository` interface and implement in `MockExpenseRepository`.
- **Behavior:** Accepts a complete `Expense` object with pre-generated ID and `Submitted` status. Validates against the expense schema, stores in the in-memory map, and returns the created expense.
- **Error handling:** Throws an error if an expense with the same ID already exists (extremely unlikely with UUID but a safety check).
- **Separation from `updateExpense`:** The `updateExpense` method auto-transitions to `Resubmitted` status (edit workflow). The new `createExpense` preserves `Submitted` status (creation workflow). This semantic clarity prevents accidental status mutations and makes the repository API clearer.

### Page Architecture
- **New page: `ExpenseCreatePage`** in `src/pages/`
- **Consultant-only access:** Protected by `ProtectedRoute` with `requiredRole="consultant"` to prevent finance users and unauthenticated users from accessing the creation interface.
- **Client-side UUID generation:** The page generates a UUID using `crypto.randomUUID()` before rendering the form. This simplifies the submission flow (one complete object sent to the repository) and aligns with optimistic UI patterns.
- **Initialization:** The template is created on mount with:
  - `id`: generated UUID
  - `submitterId`: current user's ID
  - `amount`: 0
  - `currency`: 'USD'
  - `type`: first available expense type
  - `receiptDate`: today's date in YYYY-MM-DD format
  - `status`: 'Submitted'
  - `submittedAt`: current timestamp in full ISO 8601 datetime format (e.g. `2026-09-22T12:34:56.789Z`)
  - `internalNotes`: null
  - `region`: empty string
  - `project`: empty string
  - `description`: empty string

### Form Behavior
- **Editable by default:** The page renders `ExpenseDetailCard` with `isEditable={true}`, providing a fully editable form to the user.
- **Zod validation:** The form validates on blur using the existing Zod schema. Users see validation feedback in real-time.
- **Callback:** The page passes `onResubmit={handleCreate}` to the card. When the user clicks "Submit", the card calls this callback with the validated, updated expense.
- **No auto-save:** The expense is only persisted when the user clicks Submit. There is no intermediate save or auto-draft behavior.

### Submission Flow
- **Success:** After `repo.createExpense(expense)` completes, the page navigates to `/expenses/{id}` to show the newly created expense detail.
- **Error:** If creation fails, an error alert is displayed. The user can keep the form data and retry (no data loss).
- **Loading state:** While creation is in progress, a loading spinner is shown and the Submit button is disabled.

### Routing
- **Route definition:** `/expenses/new` mapped to `<ProtectedRoute requiredRole="consultant"><ExpenseCreatePage /></ProtectedRoute>`
- **Route order:** Must be defined **before** `/expenses/:id` in the route tree. React Router matches routes in definition order, and the more specific route must come first.

### Navigation Entry Point
- **"New Expense" button on the expense list page:** A button on `/expenses` (consultant view) links to `/expenses/new`. Without it, the only way to reach the creation page is by typing the URL, which is not a discoverable workflow.
- **Placement:** Top of the list, aligned with the page title/action area, using the primary button variant.
- **Visibility:** Consultant role only (the `/expenses` page is already consultant-only, so no extra guard is needed).

### Date Handling
- **`receiptDate` format:** YYYY-MM-DD (ISO 8601 date), matching existing expense date format
- **`submittedAt` format:** Full ISO 8601 datetime (e.g. `2026-09-22T12:34:56.789Z`) — required by the Zod schema (`z.string().datetime({ offset: true })`)
- **Defaults:** Both default to "now" (receiptDate truncated to the date portion)
- **Rationale:** Minimizes user input and aligns with the implicit assumption that an expense is submitted on the day it's recorded

### ID Generation Strategy
- **Location:** Page (not repository) generates the UUID before form rendering
- **Timing:** Generated once on mount; does not change if the component re-renders
- **Rationale:** 
  - Keeps the repository's responsibility focused on validation and storage (no ID generation logic)
  - Allows the page to use the ID for any pre-render logic (if needed in future)
  - Aligns with optimistic UI patterns where the client can predict the ID immediately
  - Simplifies the submission: one complete object is sent, no round-trip needed just to get an ID

### Status Immutability on Creation
- **Initial status:** `Submitted` (not `Draft` or `Pending`)
- **Rationale:** Expenses are immediately ready for finance review. There is no draft/submission workflow; creation is submission.
- **Contrast:** Existing `updateExpense` auto-transitions to `Resubmitted` when an editable expense is modified. This distinction is intentional and semantically clear.

---

## Testing Decisions

### What Makes a Good Test
- **Test external behavior, not implementation details.** Tests should verify that the component/page renders correctly, form validation works, and the repository persists data as expected.
- **Do not test internal state or hook calls.** Do not test that `useState` was called, that specific functions were invoked internally, or how hooks are wired together. These are implementation details that change often.
- **Mock at boundaries.** Provide mock repositories, mock auth contexts, and mock navigation. The page should not need a real database or real auth service.
- **Verify user-facing outcomes.** After a user clicks Submit, verify that the success message appears, the navigation happened, or the data was persisted—not that an internal state variable changed.

### Modules to Test

#### `MockExpenseRepository.createExpense()`
- **Test case 1:** Successfully creates an expense with all required fields filled
  - Arrange: Build a complete `Expense` object with all fields populated
  - Act: Call `createExpense(expense)`
  - Assert: The returned expense matches the input, and subsequent `getExpense(id)` retrieves it
- **Test case 2:** Throws error if an expense with the same ID already exists
  - Arrange: Create an expense with ID 'abc123', then try to create another with ID 'abc123'
  - Act: Call `createExpense(secondExpense)` where `secondExpense.id === 'abc123'`
  - Assert: The method throws an error
- **Test case 3:** Validates expense against schema before storing
  - Arrange: Build an `Expense` object with invalid data (e.g., negative amount, missing required fields)
  - Act: Call `createExpense(invalidExpense)`
  - Assert: The method throws or the repository does not store the invalid expense

#### `ExpenseDetailCard` with `buttonLabel` prop
- **Test case 1:** Button renders with custom label when `buttonLabel` prop is provided
  - Arrange: Render the card with `buttonLabel="Submit"` and `onResubmit` callback
  - Act: Look for the button in the rendered output
  - Assert: The button text is "Submit" (not the default "Resubmit")
- **Test case 2:** Button renders with default label when `buttonLabel` prop is not provided
  - Arrange: Render the card with `isEditable={true}` and `onResubmit` callback, but no `buttonLabel`
  - Act: Look for the button
  - Assert: The button text is "Resubmit" (the default)
- **Test case 3:** Form fields are all editable when `isEditable={true}`
  - Arrange: Render the card with `isEditable={true}`
  - Act: Try to interact with form inputs (amount, description, etc.)
  - Assert: Inputs accept user input and do not have `disabled` attributes

#### `ExpenseCreatePage` component
- **Test case 1:** Page renders the form with empty/default template
  - Arrange: Render the page with mock auth (consultant user) and mock repository
  - Act: Wait for the page to load
  - Assert: The form is visible, amount field shows 0, currency is USD, receiptDate is today, etc.
- **Test case 2:** Successfully submits and navigates on success
  - Arrange: Render the page, fill in all form fields validly
  - Act: Click the "Submit" button and wait for the async operation to complete
  - Assert: `navigate` was called with `/expenses/{id}` path
- **Test case 3:** Shows error message if submission fails
  - Arrange: Render the page with a mock repository that throws an error
  - Act: Fill in the form and click Submit
  - Assert: An error message/alert is displayed to the user
- **Test case 4:** Redirects to login if user is not authenticated
  - Arrange: Render with no authenticated user
  - Act: Try to render the page (or component mounts)
  - Assert: Redirect to login occurs (handled by `ProtectedRoute`)
- **Test case 5:** Redirects to home if user is not a consultant
  - Arrange: Render with an authenticated finance user
  - Act: Try to render the page
  - Assert: Redirect to the finance user's home page occurs (handled by `ProtectedRoute`)

### Prior Art
- **Unit tests for repository methods:** See `src/lib/repositories/__tests__/MockExpenseRepository.test.ts` for examples of how the mock repository is tested. Follow the same pattern: arrange a complete input, act on the repository method, assert the output and side effects.
- **Component tests for form interaction:** See `src/components/expenses/__tests__/ExpenseDetailCard.test.tsx` for examples of rendering the card, filling in fields, and verifying callbacks are called.
- **Page-level tests:** See `src/pages/__tests__/ExpenseDetailPage.test.tsx` for examples of rendering a full page with contexts, mocking navigation, and verifying user workflows.
- **E2E tests:** See `e2e/expenses.spec.ts` for examples of full user workflows in Playwright (navigate, fill form, click button, verify redirect).

### Suggested Test Files
- `src/lib/repositories/__tests__/MockExpenseRepository.test.ts` — Add tests for `createExpense()`
- `src/components/expenses/__tests__/ExpenseDetailCard.test.tsx` — Add tests for `buttonLabel` prop
- `src/pages/__tests__/ExpenseCreatePage.test.tsx` — Add component-level tests for the new page (form rendering, submission, error handling)
- `e2e/add-expense.spec.ts` — Add E2E tests for the full workflow (navigate to page, fill form, submit, verify redirect)

---

## Out of Scope

The following are explicitly **not** included in this PRD:

- **Expense templates:** Users cannot create expenses from pre-defined templates or duplicated expenses. All expenses start from the same blank template.
- **Multi-currency default selection:** Currency defaults to USD. No user preference or locale-based defaults are implemented.
- **Bulk expense creation:** Users cannot create multiple expenses in one submission.
- **Receipt upload:** No file upload or attachment workflow is included.
- **Draft/auto-save:** Expenses are not saved as drafts. The form must be submitted explicitly; partial data is not persisted.
- **Pre-submission review:** Users cannot preview the expense or review before final submission.
- **Email confirmation:** No confirmation email is sent to the user after submission.
- **Finance notification:** The finance team is not automatically notified. They see the new expense in their normal review workflow.
- **Expense templates from previous submissions:** Users cannot quickly duplicate a prior expense to create a similar one.
- **Date range validation:** No business logic validates that receipt dates fall within certain ranges (e.g., within the current fiscal period).

---

## Further Notes

- **Currency strategy:** USD is chosen as a reasonable default. If the application needs to support multi-currency in the future, consider adding a user preference or organization setting. For now, the form allows selection of other currencies via the dropdown, but the initial default is USD.
- **Backward compatibility:** The `buttonLabel` prop is optional and defaults to `'Resubmit'`, ensuring all existing uses of `ExpenseDetailCard` (e.g., in the edit flow) continue to work without modification.
- **Status lifecycle:** Expenses created via this page will have `Submitted` status. Unlike edited expenses, they do not transition to `Resubmitted`. This is intentional: new expenses and re-submitted edits are distinct events from a business process perspective, even though they both represent user-initiated expense claims.
- **UUID uniqueness:** While UUID v4 collisions are astronomically unlikely, the `createExpense` method includes a check to prevent storing a duplicate ID. This is a safety measure; in production, a backend would enforce this constraint at the database level.
- **Route specificity:** The `/expenses/new` route must be defined before `/expenses/:id` in the React Router configuration. If not, the router will match `/expenses/new` against the `:id` parameter and try to render it as a detail page.
- **Future extensibility:** The page architecture allows for future creation-specific features (e.g., templates, pre-fills from context, guided workflows) without modifying the `ExpenseDetailCard` component.
- **Form validation timing:** Validation runs on blur and on submit. Real-time inline feedback helps users correct errors immediately, reducing friction.
