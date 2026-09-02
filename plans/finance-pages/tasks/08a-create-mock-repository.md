# 08a: Create Mock Repository for Data Mutations

**What to build:** Create the `MockRepository` class and React Context that abstracts expense data mutations. This establishes the data-access boundary for the finance review workflow.

**Blocked by:** 02 - Create Mock Expenses Dataset

**Status:** done

**Note:** This task is part of the architecture decision documented in `docs/decisions/architecture/0010-mock-repository-pattern.md` and `TASK-ADJUSTMENTS-01.md`. It runs in parallel with (not before) task 08, and is a blocker for task 09.

---

## Implementation Checklist

### Core Files

- [x] Create `src/lib/repositories/ExpenseRepository.ts`
  - Define `ExpenseRepository` interface with these methods:
    - `getExpense(id: string): Promise<Expense | null>`
    - `updateExpenseStatus(id: string, status: Status, comment?: string): Promise<Expense>`
  - Add JSDoc explaining this is the abstraction boundary; real implementation will be `ApiRepository`

- [x] Create `src/lib/repositories/MockExpenseRepository.ts`
  - Implement `ExpenseRepository` interface
  - Constructor: accepts array of initial `Expense[]`, stores in private `Map<id, Expense>`
  - `getExpense(id)`: return expense from map, or `null` if not found
  - `updateExpenseStatus(id, status, comment?)`:
    - Find expense in map or throw `Error('Expense not found')`
    - Create new object: `{ ...expense, status, internalNotes: comment ?? expense.internalNotes }`
    - Store back in map
    - Return updated expense (never mutate the original, always return a new object)
  - Add `reset(initialExpenses: Expense[]): void`:
    - Clear the map
    - Repopulate from `initialExpenses`
    - Used by tests to ensure clean state between runs

- [x] Create `src/context/RepositoryContext.tsx`
  - Export `RepositoryProvider` component wrapping children with context
  - Export `useRepository()` hook that:
    - Returns the repository instance
    - Throws descriptive error if called outside `RepositoryProvider` (fail-fast)
  - Create singleton `mockRepository` instance that loads the mock expenses on startup

### Integration

- [x] Wrap `App` (in `src/main.tsx`) with `<RepositoryProvider>` inside `<BrowserRouter>` but outside `<AuthProvider>` (or after, depending on structure — just ensure it's a top-level provider)
  - **Decision note:** Where should it be relative to `AuthProvider`? Either order works; choose based on logical grouping (both are providers, so it's a stylistic choice). Document the chosen order in a comment.

### Testing

- [x] Write `src/lib/repositories/MockExpenseRepository.test.ts`
  - Test instantiation: repository can be created with initial expenses
  - Test `getExpense()`: 
    - Returns correct expense when found
    - Returns `null` when expense not found
  - Test `updateExpenseStatus()`:
    - Updates status only: `updateExpenseStatus(id, 'Approved')` returns expense with new status
    - Updates status and comment: `updateExpenseStatus(id, 'Changes Requested', 'comment')` updates both status and `internalNotes`
    - Does not mutate original: calling `getExpense()` before and after update shows the change in the returned object, but verify the original mock data is not mutated by checking the map contains the new object
    - Throws error when expense not found: `updateExpenseStatus('nonexistent', ...)` throws
  - Test `reset()`:
    - After mutation, call `reset(originalExpenses)` and verify `getExpense()` returns to baseline
    - Verify that calling `reset()` with different data loads new data (not just reverts)

- [x] Write `src/context/RepositoryContext.test.tsx`
  - Test `useRepository()` hook:
    - Returns repository instance inside provider
    - Throws error when called outside provider
  - Test provider wraps children correctly (render a component that calls `useRepository()` inside the provider, verify it works)

### Documentation Updates

- [x] Update `docs/decisions/architecture/0010-mock-repository-pattern.md`:
  - Change status from "Accepted (Implementation pending)" to "Implemented"
  - Remove the "Implementation (Pending)" section
  - Add a "Completed" timestamp or reference to the task

- [x] Update `docs/architecture.md`:
  - Replace the "PLANNED" callout in the "Data Mutations" section with current-tense description
  - Change heading from "### Data Mutations (Finance Review Workflow) — PLANNED" to "### Data Mutations (Finance Review Workflow)"
  - Remove "**Status:** Not yet implemented..." note
  - Update component usage pattern code block — remove "(future)" comment
  - Update "Reads vs. Writes" section to remove "will flow" and replace with "flow"

---

## Acceptance Criteria

- [x] Repository interface is defined and clearly typed
- [x] `MockRepository` loads mock expenses into in-memory Map on construction
- [x] All mutations return new `Expense` objects, never mutate originals
- [x] `reset()` method works correctly for test setup
- [x] `useRepository()` hook is available and can be called from components
- [x] All unit tests pass
- [x] Architecture docs are updated to remove "PLANNED" status
- [x] ADR-0010 status is updated to "Implemented"
- [x] No TypeScript errors

---

## Notes

- This task runs in parallel with task 08 (form component is pure UI). Task 09 depends on both completing.
- `MockRepository` will be replaced with `ApiRepository` when a real backend is introduced — keep the interface clean and testable.
- Do not wire the repository into components yet; that's task 09. This task just builds and tests the infrastructure.
- The mock data loaded should be a fresh copy from the mock expenses module; ensure that mutations don't affect the original mock module (use `.map()` or spread to create a copy if needed).

---

## Related ADR & Documentation

- `docs/decisions/architecture/0010-mock-repository-pattern.md` — decision and rationale
- `plans/finance-pages/TASK-ADJUSTMENTS-01.md` — context and architectural impact
