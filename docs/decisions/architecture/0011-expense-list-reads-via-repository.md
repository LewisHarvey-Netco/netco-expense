# ADR-0011: Expense List Reads via Repository

## Status
Implemented (01-sync-expense-table, completed 2026-09-01)

## Context

The expense review workflow has two pages:
1. **Review List** (`/review`) — displays all expenses in a table
2. **Expense Detail** (`/review/:id`) — shows a single expense and allows finance users to approve or request changes

The stale-data bug: After a finance user approves or requests changes on the detail page and navigates back to the list, the list still shows the old status. The detail page reads from the repository and gets the updated state, but the list was seeded from a static import of mock expenses and never refetches.

ADR-0010 introduced the repository pattern for mutations only. This ADR extends it to reads.

## Decision

1. **Add `getExpenses(): Promise<Expense[]>` method** to the `ExpenseRepository` interface
2. **Implement `getExpenses()` in `MockExpenseRepository`** — returns all stored expenses, reflecting prior mutations
3. **Refactor `ReviewPage` to call `repo.getExpenses()`** on mount instead of importing mock data
4. **Add three-phase rendering** to `ReviewPage`:
   - **Loading**: `allExpenses === null && !error` → show `Header` + "Loading expenses…"
   - **Error**: `error !== null` → show `Header` + destructive `Alert` with error message
   - **Success**: render the list with loaded expenses
5. **Keep filtering and other UI logic unchanged** — the page still filters, counts, and displays the same way; it just sources the data from the repository

## Rationale

- **Single source of truth** — the repository is now the only place expenses are read from; all writes already go through it
- **Stale UX fixed** — each time the page mounts (including SPA navigation back from detail), `getExpenses()` refetches, so updated statuses appear immediately
- **Mirrors detail-page pattern** — both pages now use the same async load → state → render pattern (see ExpenseDetailPage)
- **Minimal loading state** — a simple "Loading expenses…" message during the fetch, matching the detail page
- **Degrades cleanly to real backend** — when an API replaces MockRepository, the page continues to work; no component changes needed
- **In-memory repository limitation documented** — mock re-seeds from JSON on full page reload (only affects E2E tests); real API will persist

## Consequences

- `ExpenseRepository` interface has changed; any other implementations (e.g., ApiRepository) must implement `getExpenses()`
- `ReviewPage` is now async and must handle loading/error states
- The list always refetches on mount; in the mock environment, this means re-reading from memory (fast); in production, it means an API call
- Known limitation: full page reload in the mock environment resets all mutations (the mock JSON is re-read). Real API will persist across reloads.
- E2E tests now verify that the list shows updated statuses after navigation (see e2e/review-decision.spec.ts)

## Related ADRs

- **ADR-0010** (Mock Repository Pattern) — extended by this ADR; now covers both reads and mutations
- **ADR-0005** (In-memory Filtering) — filtering still works on the in-memory list loaded by `getExpenses()`
- **ADR-0007** (Expense Status Workflow) — expense statuses are now consistently reflected in both detail and list views
