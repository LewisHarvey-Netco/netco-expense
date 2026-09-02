# PRD: Sync Expense Table with Repository Decisions

## Problem Statement

When a finance reviewer approves or requests changes on an expense detail page, the decision is recorded in the expense repository and correctly displays inline on that page. However, when the reviewer navigates back to the `/review` list page, the updated status does **not** appear — the table still shows the old "Submitted" status. This is a stale-data bug.

The root cause: the `/review` page reads its initial table data directly from the static mock JSON file (`src/mocks/expenses.json`) and never re-reads it, whereas the detail page mutates through the `ExpenseRepository` (the in-memory source of truth for all mutations). Navigating back to the list should refresh the data and show the updated status, but it currently doesn't.

This is a poor user experience: the system appears inconsistent, and users can't trust that decisions are saved.

## Solution

The `/review` page will fetch the full expense list from the `ExpenseRepository` (instead of reading the static mock file) when the component mounts. Because navigating away from the detail page **unmounts** the review page, navigating back **remounts** it and re-fetches the list from the repository — ensuring the table always shows fresh, current data.

This approach:
- Makes the repository the single source of truth for all reads and writes
- Requires no reactive/subscription machinery (a simpler mental model)
- Mirrors the existing `ExpenseDetailPage` pattern
- Gracefully degrades when a real backend is introduced (the repository interface already supports async, so an `ApiRepository` implementation swaps in without component changes)

### Scope

This change is **pure data flow**:
1. Add a `getExpenses(): Promise<Expense[]>` method to the `ExpenseRepository` interface
2. Implement it in `MockExpenseRepository` (returns all stored expenses as a new array)
3. Update `ReviewPage` to call `repo.getExpenses()` on mount instead of reading mock data
4. Add a loading placeholder and minimal error state while fetching
5. Update documentation (add ADR-0011, update architecture diagram, fix the ADR index)
6. Add tests to verify the stale-data bug is fixed

**Out of scope:** Client-side persistence across full-page reloads (known limitation; real backend will handle this), retry logic, or reactive/subscription patterns.

## User Stories

1. As a finance reviewer, I want the expense list to reflect status changes I just made on the detail page, so that I can see the impact of my decisions immediately when I return to the list.

2. As a finance reviewer, I want to be assured that when I approve or request changes on an expense, the change is visible and persistent, so that I can have confidence in the system's data integrity.

3. As a finance reviewer, I want to see a brief loading indicator when returning to the expense list, so that I understand why the table might take a moment to appear and know the app is fetching fresh data.

4. As a finance reviewer, if the app fails to load the expense list, I want to see a clear error message, so that I understand what went wrong and know what to do next (e.g., try again or contact support).

5. As a developer, I want the expense list to read through the same repository boundary that mutations use, so that I have a single source of truth and simpler testing.

6. As a developer, I want the repository interface to define both reads and mutations, so that future implementations (like an API client) can implement both in one place without component refactoring.

7. As a developer, I want the loading and error patterns on the review page to match the detail page pattern, so that the codebase is consistent and easier to maintain.

8. As a developer, I want comprehensive tests verifying that decisions recorded on the detail page appear when returning to the list, so that this stale-data bug never regresses.

9. As a developer, I want clear architectural documentation explaining why list reads now go through the repository, so that future team members understand the design and don't accidentally revert it.

10. As a developer, I want the TODO list to be consolidated and updated, so that the "sync table" task is checked off and replaced with a higher-level backend replacement task.

## Implementation Decisions

### 1. Repository Interface Extension
- Add `getExpenses(): Promise<Expense[]>` to the `ExpenseRepository` interface in `src/lib/repositories/ExpenseRepository.ts`
- This method returns all stored expenses as a **new array each call** (preventing callers from corrupting repository state)
- Update the interface documentation to reflect that the repository now covers both reads and mutations (not just mutations)

### 2. MockExpenseRepository Implementation
- Implement `getExpenses()` in `MockExpenseRepository`:
  ```
  async getExpenses(): Promise<Expense[]> {
    return Array.from(this.expenses.values())
  }
  ```
- The returned array preserves insertion order (Map order = JSON seed order), so the table order remains stable
- Shared object references are safe because the repository never mutates objects in place; updates always create new objects

### 3. ReviewPage Data Loading
- Remove the import of `mockExpenses` from `src/mocks/expenses`
- Add `const repo = useRepository()` to use the repository context
- Replace the `useState` that seeds from mock data with two pieces of state:
  - `allExpenses: Expense[] | null` (null means not loaded yet; `null` check covers both loading and initial state)
  - `error: string | null` (null means no error)
- Add a `useEffect` on mount that:
  - Calls `repo.getExpenses()`
  - On success: `setAllExpenses(result)`
  - On failure: `setError('Failed to load expenses. Please try again.')`
  - Includes a cleanup flag (same pattern as `ExpenseDetailPage`) to handle StrictMode double-invocation in dev
- Render three branches:
  - **Loading (no error):** `allExpenses === null && !error` → show `Header` + `main` + `<p className="text-sm text-muted-foreground">Loading expenses…</p>`
  - **Error:** `error !== null` → show `Header` + `main` + `PageTitle` + destructive `Alert` with the error message
  - **Success:** otherwise → current layout (FilterPanel, Card, count line, ExpenseTable)
- The `submitters` derivation and `filterExpenses` logic remain unchanged; they now work on the loaded list

### 4. Error Handling
- Minimal, non-disruptive approach:
  - Wrap the fetch in try/catch
  - On error, show a destructive `Alert` saying "Failed to load expenses. Please try again."
  - No retry button (intentional simplification; real backend will have proper error handling)
  - Matches the precedent set by `ExpenseDetailPage`'s write-error handling

### 5. Loading State
- Full-page placeholder:
  - Show `Header` (not hidden; user knows they're still logged in)
  - Show "Loading expenses…" in muted gray text
  - Hide the filter panel and table
  - When the promise resolves, swap to the real page (no skeleton screens or streaming)
  - Mirrors the detail page loading pattern

### 6. Architecture Documentation
- Create a new ADR-0011: **"Expense List Reads via Repository"**
  - Status: Implemented
  - Context: the stale-table bug; ADR-0010 anticipated that reads would follow mutations
  - Decision: add `getExpenses()` to the interface; `ReviewPage` reads on mount; use full-page loading placeholder and minimal error handling
  - Rationale: single source of truth, remount-refetch fixes stale UX without reactivity, mirrors detail-page pattern, degrades cleanly to a real backend
  - Consequences: interface change (future `ApiRepository` must implement `getExpenses`); `ReviewPage` becomes async; **known limitation** — in-memory repo re-seeds from mock JSON on full-page reload, so decisions don't survive refresh (real API will repull from the server)
  - Related: ADR-0010 (extends), ADR-0005 (in-memory filtering still applies)

- Update ADR-0010 to note at the top: **"Extended by ADR-0011"** — now covers reads + mutations, not just mutations

- Update `docs/architecture.md`:
  - Update the mermaid diagram to remove the direct `ReviewPage → mocks/expenses.json` edge and add `ReviewPage → RepositoryContext`
  - Update the note after the diagram: both `ReviewPage` and `ExpenseDetailPage` now read through the repository
  - Update the "Reads vs. Writes" section to explain that list and detail both load via the repository on mount; list refetches on every mount, which is how decisions appear when returning

- Update `docs/decisions/architecture/README.md` (ADR index table): add missing rows for ADR-0009, ADR-0010 (already exist), and new row for ADR-0011

### 7. TODO Consolidation
- Replace the "Remove mocked users" Blocking Go-Live item with a consolidated one:
  ```markdown
  - [ ] Replace mock data with a real backend: remove `src/mocks/users.json` and
        `src/mocks/expenses.json`, backing both with real API calls — real user
        accounts for authentication, and an `ApiRepository` implementing
        `ExpenseRepository` for expense reads/writes. Server-side persistence
        replaces the in-memory mock repository, so decisions are repulled from
        the API rather than persisted client-side (see ADR-0011).
  ```
- Delete the old "Sync expense table with repository decisions" Should-Do item (superseded by the above)
- Keep "Implement token-based sessions" as a separate Blocking Go-Live item

## Testing Decisions

### Testing Philosophy
A good test verifies external behavior (what the user sees and does), not implementation details (how state is managed). Tests should be colocated with their components and use the same patterns already established in the codebase.

### Which Modules Get Tests

1. **`MockExpenseRepository.getExpenses()`** — unit test
   - Verify it returns all seeded expenses
   - Verify it preserves seed (insertion) order
   - Verify it reflects prior `updateExpenseStatus` calls
   - Verify it returns a new array each call (mutations to the result don't affect the repo)

2. **`ReviewPage` — integration test** (the regression test for this bug)
   - Scenario: render the page, click a "Submitted" expense row, approve it on the detail page, navigate back to `/review`, verify the row now shows "Approved" badge
   - This directly tests the stale-data bug is fixed

3. **`App.test.tsx` — wrap setup in `RepositoryProvider`**
   - The existing test "logs in as finance and lands on /review" crashes after this change because `ReviewPage` now calls `useRepository()` but the provider is absent in the test render tree
   - Fix: wrap `renderApp()` in `<RepositoryProvider repository={new MockExpenseRepository(...)}>` with a fresh repo instance

4. **`e2e/review-decision.spec.ts` — extend existing test**
   - Update the comment block describing the stale-table behavior (outdated after this change)
   - Extend the "a recorded decision persists across navigation" test to assert that the specific row for the approved expense shows the "Approved" badge (use `getByRole('row').filter({ hasText: ... })` to scope the assertion to the correct row, since other expenses are already approved)

### Existing Tests (Unaffected)
- `ExpenseDetailPage.test.tsx` — no changes (detail page behavior is unchanged)
- `RepositoryContext.test.tsx` — no changes (context behavior is unchanged)
- `ExpenseTable.stories.tsx` — no changes (uses inline mock data, not the repository)
- `e2e/review-page.spec.ts` — no changes (same baseline mock data, same assertions)
- `e2e/review-filters.spec.ts` — no changes (same baseline mock data, same assertions)

### Prior Art
The loading/error pattern on `ReviewPage` mirrors `ExpenseDetailPage:77-93` (cleanup flag in effect) and error rendering in `ExpenseDetailPage` (destructive Alert). The mutation tests in `MockExpenseRepository.test.ts` already have examples of testing seeding, updates, and array returns.

## Out of Scope

1. **Client-side persistence across full-page reloads** — The in-memory repository re-seeds from mock JSON on every page reload, so decisions made within a session don't survive a browser refresh. This is documented as a known limitation in ADR-0011. When a real backend is introduced, the API will be the source of truth and decisions will persist automatically. Intentionally not implementing localStorage or IndexedDB here.

2. **Reactive/subscription patterns** — No pub/sub, no shared list state in Context, no `useEffect` subscriptions that listen for mutations elsewhere in the app. The remount-refetch approach is simpler and sufficient for this use case.

3. **Retry logic for failed loads** — The error state is minimal: show the error message, no retry button. Real error handling (exponential backoff, user-triggered retry, etc.) will come with the backend.

4. **Filtering on the loaded list** — The existing `filterExpenses` utility already works on the in-memory list; no changes needed.

5. **Pagination or lazy-loading** — The mock dataset is small (~3 expenses); load all at once.

## Further Notes

### Known Limitations
1. **Full-page reload re-seeds from mock JSON** — Decisions recorded during a session are lost if the user refreshes. This is a known limitation and is documented in ADR-0011. When the backend is introduced, API responses will repull the data, making decisions permanent.

2. **No reactive list updates** — If the app evolves to have multiple places where expenses can be modified, the list won't automatically update. Each place would need its own refetch or shared state. This is a deliberate trade-off to keep the code simple for now.

### Deprecation Path
The `MockExpenseRepository` is intentionally temporary code. When a real backend is introduced:
1. Create an `ApiRepository` implementing the same `ExpenseRepository` interface
2. Swap the implementation in `src/context/RepositoryContext.tsx` (one line change)
3. No component refactoring needed (ReviewPage, ExpenseDetailPage, etc. all already call the interface methods)

### Effort Estimate
Approximately 2–3 hours of development time:
- ~30 min: Repository interface + `getExpenses()` implementation
- ~45 min: ReviewPage refactor + loading/error states
- ~30 min: Documentation (ADR, architecture updates, TODO consolidation)
- ~30 min: Tests (unit + integration + E2E)
- ~15 min: verification (lint, build, test suite pass)

### User Stories Update
When implementing this PRD, update `docs/user-stories.md` to add the following new stories under the "Finance Reviewer Stories" section (after story #17, "All Expenses link"):

**NEW stories to add:**
- **Story 18:** "As a finance reviewer, when I return to the expense list after making a decision, I want the table to fetch fresh data from the repository so that I see the updated status immediately (not stale data)."
- **Story 19:** "As a finance reviewer, I want to be assured that when I approve or request changes on an expense, the change is visible and persistent in the system so that I have confidence in the system's data integrity."
- **Story 20:** "As a finance reviewer, I want to see a brief loading indicator (and "Loading expenses…" message) when the list is fetching data so that I understand why the table might take a moment to appear."
- **Story 21:** "As a finance reviewer, if the app fails to load the expense list, I want to see a clear error message so that I understand what went wrong and know what to do next (e.g., try again or contact support)."

**Deduplication notes:**
- Story 1 (view all expenses) remains: focuses on the overview table itself, not refreshing after decisions
- Story 16 (updated status reflected immediately) remains: focuses on inline update during detail page edit, not list-page refresh on return
- These new stories are specifically about the list re-fetching and showing fresh data when returning from the detail page, which is the bug this PRD fixes
- Developer stories in the PRD (repository interface, testing, docs) are not added to `user-stories.md` because that file focuses on user-facing and system behaviors, not architecture/implementation decisions

### Related Tickets / ADRs
- Addressed: TODO item "Sync expense table with repository decisions" (Should-Do tier)
- Extends: ADR-0010 (Mock Repository Pattern)
- Related: ADR-0005 (In-Memory Filtering), ADR-0001 (Auth Context)
