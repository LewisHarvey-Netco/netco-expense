# PRD: Consultant Expense Viewing (MVP)

## Problem Statement

Consultants currently have no way to view their own submitted expenses. They see only a placeholder message on the `/expenses` page ("Expense submission form coming soon"). Finance users can view all expenses and make approval decisions, but consultants are locked out of the workflow entirely. This is a critical gap for the MVP: consultants need visibility into their expense submissions to understand their status and prepare for reviews.

## Solution

Enable consultants to view a filtered list of their own expenses and inspect individual expense details in a read-only view, using the same table and detail layouts already built for finance users. Consultants will access expenses via `/expenses` (list) and `/expenses/:id` (detail). The expense detail page will be refactored into a single role-aware component that conditionally renders finance-specific approval controls when viewed by finance users, allowing both roles to share the same underlying detail component while maintaining clear role boundaries.

All data access will be protected at the repository layer: a new `getExpensesBySubmitter()` method will enforce that consultants can only retrieve their own expenses, establishing a security boundary that will enforce authorization server-side once a real backend is introduced.

## User Stories

1. As a consultant, I want to see a list of all my submitted expenses, so that I can track my submissions.
2. As a consultant, I want to filter my expenses by status (Submitted, Approved, Changes Requested, Resubmitted), so that I can find expenses in a particular state.
3. As a consultant, I want to filter my expenses by type (Breakfast, Lunch, Dinner, Transport, Accommodation), so that I can see only the categories I'm interested in.
4. As a consultant, I want to filter my expenses by date range, so that I can find expenses from a specific time period.
5. As a consultant, I want to apply multiple filters at once, so that I can narrow down my expense list efficiently.
6. As a consultant, I want to clear all filters with a single button, so that I can quickly reset to see all my expenses again.
7. As a consultant, I want to see how many expenses match my filter criteria, so that I have visibility into the filter results.
8. As a consultant, I want to click on an expense row in the list, so that I can view its full details.
9. As a consultant, I want to see a loading state while my expenses are being fetched, so that I know the page is working.
10. As a consultant, I want to see an error message if the expense list fails to load, so that I understand what went wrong.
11. As a consultant, I want to see an empty state message if I have no expenses, so that I'm not confused by a blank page.
12. As a consultant, I want to view the full details of a single expense, so that I can review all information I submitted.
13. As a consultant, I want to see all expense fields in the detail view (amount, type, status, dates, submitter, region, project, description, internal notes, receipt placeholder), so that I have complete visibility into my submission.
14. As a consultant, I want all fields in the expense detail view to be read-only, so that I cannot accidentally modify my submission before it is reviewed.
15. As a consultant, I want to see a back button on the detail page that returns me to my expense list, so that I can easily navigate back.
16. As a consultant, I want to see internal notes added by finance users, so that I understand feedback on my submission.
17. As a consultant, I want to see a loading state while a single expense is being fetched, so that I know the page is working.
18. As a consultant, I want to see an error message if the expense detail fails to load, so that I understand what went wrong.
19. As a consultant, I want to be redirected if I try to view another consultant's expense by URL manipulation, so that my expense data is protected.
20. As a consultant, I want a navigation link to my expenses in the header, so that I can easily access my expense list.
21. As a finance user, I want the existing expense review table to continue showing all expenses (not filtered by submitter), so that I can review all submissions.
22. As a finance user, I want the existing expense detail page to show the review decision form on the right side, so that I can approve or request changes.
23. As a finance user, I want the expense detail card to be the same across finance and consultant views, so that both roles see consistent information.
24. As a finance user, I want finance-specific content (the review decision form) to only appear when I am logged in as finance, so that there is no confusion about who can make decisions.
25. As a developer, I want the repository layer to prevent consultants from accessing other consultants' expenses, so that data access is enforced at a security boundary.
26. As a developer, I want the expense detail card component to be reusable by both finance and consultant pages, so that I'm not duplicating detail-rendering logic.
27. As a developer, I want the expense detail page to know the user's role and render appropriately, so that the same page can serve both roles without duplication.
28. As a developer, I want the filter panel to be configurable so consultants don't see a submitter filter, so that the UI is not confusing for single-user views.
29. As a developer, I want clear tests for consultant-specific behavior (list filtering, ownership checks, navigation), so that regressions are caught early.
30. As a developer, I want E2E tests to verify the full consultant workflow (login, view list, click detail, back button, ownership check), so that the feature works end-to-end.

## Implementation Decisions

### 1. Repository Layer: `getExpensesBySubmitter()` Method

- A new method `getExpensesBySubmitter(submitterId: string): Promise<Expense[]>` will be added to the `ExpenseRepository` interface.
- In the mock implementation, this method filters expenses in-memory to return only those where `submitterId` matches the parameter.
- This establishes a security boundary: the repository is the enforcement point for data access. When a real backend is introduced, the API layer will validate that the calling user matches the `submitterId`.
- **Rationale:** Centralizes authorization at the data-access layer, making it clear where security decisions are enforced and easier to transition to backend validation later.

### 2. Expense Detail Card Component: React Hook Form + Zod

- A new `ExpenseDetailCard` component will be extracted into `src/components/expenses/ExpenseDetailCard.tsx`.
- It will use React Hook Form internally with a Zod schema (located in `src/schemas/expense.ts`) from the start.
- All form fields will be **disabled by default** (read-only mode for phase 1) to prepare for inline editing in phase 2.
- The component will accept a `role` prop (`'consultant' | 'finance' | undefined`). When `role === 'consultant'`, internal notes remain visible (consultants see all notes). When `role === 'finance'` or undefined, all fields display normally.
- **Rationale:** Building with React Hook Form now avoids a major refactor during phase 2. The disabled-fields pattern is standard and will enable seamless transition to editable fields. The `role` prop keeps the component flexible without overcomplicating it; the caller decides what to pass.

### 3. Expense Detail Page: Single Role-Aware Component

- `ExpenseDetailPage` will remain a single component handling both `/review/:id` (finance) and `/expenses/:id` (consultant) routes.
- The component will use `useAuth()` to determine the current user's role and render conditionally:
  - **Finance users:** Display the two-column layout with `ExpenseDetailCard` (left) and `ExpenseReviewSection` (right).
  - **Consultant users:** Display a single-column layout with only `ExpenseDetailCard`.
- The component will perform an **ownership check** for consultants: before rendering, it will verify `expense.submitterId === user.id`. If the check fails, it will redirect to the 404 page (no indication the resource exists).
- **Rationale:** A single component avoids duplication and reduces maintenance burden. Using `useAuth()` keeps the component in its natural context (auth awareness is already required for role-based routes). The ownership check at the page level is clearer than burying it in a component.

### 4. Finance Review Section: Extracted Component

- A new `ExpenseReviewSection` component will be extracted into `src/components/ExpenseReviewSection.tsx`.
- This component will be minimal: it renders the decision status message (if the expense is not decidable) and the `ReviewDecisionForm` with decision handling logic.
- It receives `expense`, `disabled`, `onSubmit` props.
- **Rationale:** Separates finance-specific logic from the detail component, making the detail component truly reusable and keeping the page layout clear.

### 5. Filter Panel: Configurable Submitter Filter

- The `FilterPanel` component will accept an optional `showSubmitterFilter?: boolean` prop (defaults to `true` for backward compatibility).
- When `showSubmitterFilter === false`, the submitter filter UI is hidden. This is used on the `/expenses` (consultant) page.
- When `showSubmitterFilter === true`, the submitter filter is shown. This is used on the `/review` (finance) page.
- No other filter behavior changes; the component remains client-side filtering.
- **Rationale:** Allows consultants to use the same filter component without seeing a meaningless "submitter" filter. Simple configuration without introducing role awareness into FilterPanel itself.

### 6. Consultant Expenses Page: Filtered List View

- `ExpensesPage` will be refactored from its placeholder state to a functional consultant expense list.
- It will fetch expenses using `repository.getExpensesBySubmitter(user.id)`.
- It will render `FilterPanel` with `showSubmitterFilter={false}`.
- It will render `ExpenseTable` with filtered results and an `onRowClick` handler navigating to `/expenses/:id`.
- It will display loading, error, and empty states matching the pattern in `ReviewPage`.
- **Rationale:** Mirrors the finance workflow but scoped to the current user. Using `getExpensesBySubmitter()` ensures the repository enforces data access, not just the UI.

### 7. Routes and Navigation

- A new route `/expenses/:id` will be added to `App.tsx`, protected by `ProtectedRoute` with `allowedRoles={['consultant']}`.
- The route will render `ExpenseDetailPage` (the role-aware page that also serves `/review/:id` for finance).
- The `Header` component will be updated to show a conditional navigation link:
  - For consultants: "My Expenses" → `/expenses`
  - For finance: "Review Expenses" → `/review`
- **Rationale:** Clear role-based navigation without cluttering the header. The single `ExpenseDetailPage` serves both routes; the `ProtectedRoute` ensures only the intended role can access each entry point.

### 8. Ownership Check Security Boundary

- The ownership check in `ExpenseDetailPage` is a **UX boundary only** for the MVP. It redirects consultants who attempt URL manipulation.
- The repository layer (`getExpensesBySubmitter()`) is the actual **data-access boundary** and will become a **security boundary** once a real backend validates authorization server-side.
- An ADR will document that client-side ownership checks are not sufficient for production; backend enforcement is mandatory for phase 2+.
- **Rationale:** Makes the UX robust for typical use while acknowledging that true security requires backend validation. Prevents surprise 404s for typos.

### 9. Module Structure and Testing Boundaries

#### Deep Modules (Testable in Isolation):
- **Repository Layer:** `ExpenseRepository.getExpensesBySubmitter()` — tests mock data filtering and can be swapped for API implementation.
- **Validation Schema:** `src/schemas/expense.ts` — Zod schema can be tested independently for all field validation rules.
- **Filter Utility:** `filterExpenses()` already exists; the existing test pattern continues for consultant-filtered results.
- **Ownership Check Logic:** A custom hook `useExpenseOwnershipCheck()` will encapsulate the check (consultant verify their ID, handle redirect), making it testable and reusable.

#### Page-Level Organization:
- **`ExpensesPage`** — Consultant expense list page. Tests verify: loading state, error state, empty state, filtering, navigation to detail.
- **`ExpenseDetailPage`** — Shared detail page. Tests verify: role-aware rendering, finance user sees review form, consultant sees detail-only, ownership check redirects on mismatch.
- **Component Integration:** `ExpenseDetailCard` + `ExpenseReviewSection` tests verify that they render correctly in isolation and together.

### 10. Zod Schema Location and Expense Field Definitions

- The Zod schema will live in `src/schemas/expense.ts` (centralized, alongside other schemas).
- It will define validation rules for all expense fields: amount, type, status, dates, submitter, region, project, description, internal notes, receipt.
- Fields will be defined as `disabled` in the form, but the schema ensures type safety and is ready for validation rules when fields become editable in phase 2.
- **Rationale:** Centralized schema library supports shared components and makes validation testable without rendering.

### 11. Architecture Documentation: Section + ADR

- `docs/architecture.md` will be updated with a new section documenting:
  - The consultant expense viewing pattern (role-aware detail component, repository-level filtering).
  - Why the detail page serves both roles (code reuse, clear separation via route protection).
  - The repository as a data-access boundary (will become security boundary with backend).
  - Phase 2 vision: inline editing via React Hook Form, status transitions (`Resubmitted`).
- A new ADR (`docs/decisions/ADR-00XX-role-aware-expense-detail.md`) will document:
  - **Decision:** Use a single `ExpenseDetailPage` with role-aware conditional rendering rather than separate pages.
  - **Rationale:** Avoids duplication, centralizes business logic, reduces maintenance.
  - **Consequences:** Component must be aware of role (via `useAuth()`), but this is acceptable because auth context is natural to pages.
  - **Alternatives Considered:** Separate pages (more duplicated code), configuration object pattern (more abstract but less clear).

## Testing Decisions

### What Makes a Good Test

- **Test external behavior, not implementation details.** Tests should verify what the user sees and experiences (list appears, detail loads, filter works), not how it's done internally (e.g., which hook is called, which state variable changes).
- **Isolate the unit under test.** Mock repository calls, mock auth context, so tests don't depend on other components working correctly.
- **Avoid testing framework details.** Don't test React Hook Form's internal behavior; test that the form fields render disabled and that the component responds to data changes.

### Modules to Test

1. **Repository Layer**
   - `MockExpenseRepository.getExpensesBySubmitter()` — Tests verify filtering returns only expenses matching the submitter ID.
   - Test cases: empty list, single consultant's expenses, multiple consultants filtered correctly.

2. **`ExpenseDetailCard` Component**
   - Tests verify all fields render with correct data (amount, type, status, dates, submitter, region, project, description, internal notes, receipt placeholder).
   - Tests verify fields are disabled (read-only).
   - Tests verify role-based visibility: consultant sees all notes, other roles show nothing special.
   - Test cases: complete expense data, missing optional fields (e.g., no internal notes), different roles.

3. **`ExpenseReviewSection` Component**
   - Tests verify the review form and decision message render.
   - Tests verify disabled state (when expense is not decidable).
   - Tests verify submit handler is called with correct decision.

4. **`ExpensesPage` Component**
   - Tests verify consultant's expenses are loaded and displayed.
   - Tests verify loading state renders while fetching.
   - Tests verify error state renders if fetch fails.
   - Tests verify empty state if consultant has no expenses.
   - Tests verify filters (status, type, date range) apply correctly to the list.
   - Tests verify submitter filter is hidden.
   - Tests verify row click navigates to `/expenses/:id`.

5. **`ExpenseDetailPage` Component**
   - Tests verify expense is loaded and `ExpenseDetailCard` renders for consultants.
   - Tests verify consultant cannot access another consultant's expense (ownership check redirects).
   - Tests verify finance user sees `ExpenseReviewSection` in addition to detail card.
   - Tests verify back button returns to `/expenses` (consultant) or `/review` (finance).
   - Tests verify loading and error states.

6. **`useExpenseOwnershipCheck()` Hook**
   - Tests verify the hook returns true if user ID matches expense submitter ID.
   - Tests verify the hook returns false if they don't match.
   - Tests verify hook integration with navigation (redirect on failure).

7. **`FilterPanel` Component (Existing + New Prop)**
   - Tests verify submitter filter is hidden when `showSubmitterFilter={false}`.
   - Tests verify submitter filter is shown when `showSubmitterFilter={true}` (existing finance behavior unchanged).

### Prior Art

- **Component Tests:** `ReviewPage.test.tsx` is a good model for testing list pages with filtering, loading, error, and empty states. `ExpenseDetailPage.test.tsx` (will be created) follows the same pattern.
- **Repository Tests:** `MockExpenseRepository.test.ts` already exists and shows how to test repository methods with various data scenarios.
- **E2E Tests:** See E2E section below.

### E2E Tests (Playwright)

- **Consultant Login & List Flow**
  - Login as consultant (Alice).
  - Verify `/expenses` shows the consultant's own expenses only.
  - Verify filters (status, type, date range) work on the list.
  - Verify all my expenses are shown (no finance expenses appear).

- **Consultant Detail & Back**
  - Click an expense row from the list.
  - Verify `/expenses/:id` shows the expense detail.
  - Verify all fields are read-only (no input allowed).
  - Verify back button returns to `/expenses`.

- **Consultant Ownership Check**
  - Attempt to navigate directly to `/expenses/{other-consultant-expense-id}` by URL manipulation.
  - Verify redirect to 404 page (resource not found).

- **Finance Review Flow (Unchanged)**
  - Login as finance (Bob).
  - Verify `/review` shows all expenses (from all consultants).
  - Verify `/review/:id` shows the detail card + review decision form.
  - Verify decision form works (submit approval, see status change).

- **Navigation Links**
  - As consultant, verify "My Expenses" link in header navigates to `/expenses`.
  - As finance, verify "Review Expenses" link in header navigates to `/review`.

## Out of Scope

1. **Consultant Expense Submission Form** — Creating new expenses is phase 3. Consultants can only view existing expenses in this phase.
2. **Inline Editing** — Consultants cannot modify expenses in this phase. Phase 2 will enable editing of submitted/rejected expenses.
3. **Status Transition `Resubmitted`** — Currently, the allowed statuses are `Submitted`, `Approved`, and `Changes Requested`. The `Resubmitted` status (triggered when a consultant re-edits a rejected expense) is part of phase 2.
4. **Backend Authentication & Authorization** — The repository layer accepts `submitterId` as a parameter and filters in-memory. Real backend integration (OAuth, server-side validation of ownership) is phase 2+.
5. **Receipt Upload** — The receipt placeholder exists but is not functional. Receipt handling is deferred to a later phase.
6. **Multi-role Users** — The design assumes a user has a single role (consultant or finance). Support for users with multiple roles is out of scope.
7. **Bulk Actions** — Actions like "bulk approve" or "bulk export" are not included.
8. **Reporting/Analytics** — Dashboards, charts, or analytics on expense data are out of scope.

## Further Notes

### Why React Hook Form + Zod From the Start?

Building with disabled form fields now (instead of plain text) may seem like premature complexity, but it:
1. Eliminates a major refactor during phase 2 (no field extraction/re-wiring).
2. Establishes a consistent pattern for both roles' views of the detail card.
3. Keeps the Zod schema (validation rules) in one place, ready for reuse.
4. Demonstrates that the component is *ready* for editing, just not *enabled* yet.

If this adds too much friction during implementation, the decision can be revisited: plain text in phase 1, migrate to React Hook Form in phase 2. However, the grill-me interview confirmed this approach is desired.

### Security Model: MVP vs. Production

**MVP (Now):** Ownership checks are client-side. A consultant cannot view another consultant's expense via the UI, but a determined user could modify the URL or intercept the repository call.

**Production (Phase 2+):** Backend must validate authorization. The `getExpensesBySubmitter()` method will call an API endpoint that server-side authenticates the user and returns only their expenses. The client-side ownership check becomes a UX optimization (early redirect), not the security boundary.

### Role-Aware Detail Page: Why Not Separate Pages?

The decision to use a single `ExpenseDetailPage` for both roles stems from:
1. **Code reuse:** Both roles render the same `ExpenseDetailCard`; no duplication.
2. **Consistent data model:** A single place to load, cache, and update the expense.
3. **Clear role separation:** The route protection (`/expenses/:id` for consultant, `/review/:id` for finance) keeps roles from colliding. The `useAuth()` hook determines what to render.

Alternatives (separate pages, or a configuration object) were considered and rejected because they either duplicate code or introduce unnecessary abstraction layers.

### Placeholder vs. Real Backend Data

The MVP uses `MockExpenseRepository` with in-memory data. All methods are async to prepare for backend swaps without component changes. Tests that need to verify behavior can mock the repository; tests that verify UI can use the mock data directly.

### Navigation: Back Button Behavior

The back button on the detail page navigates to `/expenses` (consultant) or `/review` (finance) **without retaining filter state**. This is simpler to implement and less prone to bugs (e.g., if filters are invalid, the page might not render). If a user wants to return to a filtered view, they can re-apply filters. This decision trades UX convenience for implementation simplicity; future phases can add filter state persistence if desired.

### Phase 2 Preview: Inline Editing

Phase 2 will:
1. Pass `isEditable={true}` to `ExpenseDetailCard` from the consultant detail page when a consultant is viewing a "Changes Requested" or "Submitted" (re-submission) expense.
2. Wire the form's `onSubmit` handler to `repository.updateExpense()`, which will update fields and transition status to `Resubmitted`.
3. Lock editing when status is `Approved` (terminal state).
4. The finance review form will remain in `ExpenseReviewSection` and will not change.

All structure is in place; phase 2 is purely enabling fields and wiring handlers.

