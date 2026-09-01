# 01: Sync Expense Table with Repository Decisions

**What to build:** When a finance reviewer approves or requests changes on an expense detail page, those decisions now immediately appear in the expense list table when the reviewer navigates back to `/review`, fixing the stale-data bug. The expense repository becomes the single source of truth for all reads and writes, supported by a new `getExpenses()` interface method and full-page loading/error states matching the detail page pattern.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

## Acceptance Criteria

### ExpenseRepository Interface & Implementation
- [ ] Add `getExpenses(): Promise<Expense[]>` method to `ExpenseRepository` interface in `src/lib/repositories/ExpenseRepository.ts`
- [ ] Implement `getExpenses()` in `MockExpenseRepository` — returns all stored expenses as a new array, preserving seed order, reflecting prior mutations (e.g., status updates)
- [ ] Update interface documentation to reflect it now covers both reads and mutations
- [ ] Unit tests for `MockExpenseRepository.getExpenses()` verify it returns all seeded expenses in order, reflects prior mutations, and returns a new array each call (safe from external mutation)

### ReviewPage Refactor
- [ ] Remove `import mockExpenses from '@/mocks/expenses'` from ReviewPage
- [ ] Add `const repo = useRepository()` hook to ReviewPage
- [ ] Replace `useState` that seeds from mock data with two state variables: `allExpenses: Expense[] | null` (null = not loaded) and `error: string | null`
- [ ] Add `useEffect` on component mount that calls `repo.getExpenses()`, sets `allExpenses` on success, or `setError()` on failure; includes cleanup flag to handle StrictMode double-invocation
- [ ] Implement three-phase rendering:
  - **Loading:** `allExpenses === null && !error` → show `Header` + loading message "Loading expenses…" in muted gray text
  - **Error:** `error !== null` → show `Header` + destructive `Alert` with error message "Failed to load expenses. Please try again."
  - **Success:** render current layout (FilterPanel, Card, count, ExpenseTable) with the loaded expenses
- [ ] Integration test: render ReviewPage, navigate to detail page, approve an expense, navigate back to `/review`, verify the row shows "Approved" badge with updated status
- [ ] Extend E2E test `e2e/review-decision.spec.ts` to assert the specific approved row shows the updated status badge on return to list

### Test Fixes
- [ ] Fix `App.test.tsx` to wrap rendered `App` in `RepositoryProvider` with a fresh `MockExpenseRepository` instance, so ReviewPage can call `useRepository()` without crashing
- [ ] Verify existing `ExpenseDetailPage.test.tsx`, `ReviewPage.test.tsx`, component stories, and other E2E tests still pass unchanged
- [ ] All unit, integration, and E2E tests pass with no regressions

### Documentation
- [ ] Create new ADR-0011: "Expense List Reads via Repository"
  - Status: Implemented
  - Context: stale-table bug; ADR-0010 anticipated reads would follow mutations
  - Decision: add `getExpenses()` to interface; ReviewPage reads on mount; full-page loading placeholder and minimal error handling
  - Rationale: single source of truth; remount-refetch fixes stale UX without reactivity; mirrors detail-page pattern; degrades cleanly to real backend
  - Consequences: interface change; ReviewPage becomes async; known limitation — in-memory repo re-seeds from mock JSON on full-page reload (real API will persist)
  - Related: ADR-0010 (extends), ADR-0005 (filtering)
- [ ] Update ADR-0010 top note: "Extended by ADR-0011" — now covers reads + mutations
- [ ] Update `docs/architecture.md`:
  - Mermaid diagram: remove `ReviewPage → mocks/expenses.json` edge, add `ReviewPage → RepositoryContext`
  - Update note after diagram: both ReviewPage and ExpenseDetailPage now read through repository
  - Update "Reads vs. Writes" section: explain list refetches on every mount, how decisions become visible on return
- [ ] Update `docs/decisions/architecture/README.md` (ADR index table): add rows for ADR-0009, ADR-0010 (if missing), and new row for ADR-0011

### TODO Consolidation
- [ ] Replace "Remove mocked users" Blocking Go-Live item in `TODO.md` with consolidated: "Replace mock data with a real backend: remove `src/mocks/users.json` and `src/mocks/expenses.json`, backing both with real API calls — real user accounts for authentication, and an `ApiRepository` implementing `ExpenseRepository` for expense reads/writes. Server-side persistence replaces in-memory mock, so decisions are repulled from API rather than persisted client-side (see ADR-0011)."
- [ ] Delete the old "Sync expense table with repository decisions" Should-Do item (superseded by above)
- [ ] Keep "Implement token-based sessions" as separate Blocking Go-Live item
