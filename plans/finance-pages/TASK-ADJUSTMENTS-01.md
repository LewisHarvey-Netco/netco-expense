# Task Adjustments 01: Mock Repository Pattern for Data Mutations

## Problem Statement

Tasks 08–09 introduce the first data mutation operations in the finance review workflow (approve/request changes on an expense). The original task specs were vague about how to persist these changes:

> "Update mock data (or app state) to reflect the change"

This creates three risks:

1. **Test pollution** — Mutating the JSON files directly breaks test isolation; tests would interfere with each other
2. **Technical debt** — Mutating React state directly or modifying JSON bypasses a proper data abstraction; this code becomes dead weight when a real backend arrives
3. **Re-architecture tax** — When switching to a backend API, components would need complete refactoring to call the API instead of manipulating local state

## Solution: Mock Repository Pattern

We will establish a **data-access abstraction layer** (repository pattern) that sits between components and data sources:

- Components call methods on a repository interface (e.g., `updateExpenseStatus(id, status, comment)`)
- Today, the implementation is `MockRepository` — in-memory mutations of loaded JSON data
- Tomorrow, you'll implement `ApiRepository` with the same interface — HTTP calls to a backend
- Components never change; the implementation swaps out

This is a deliberate, well-documented architectural boundary, not a temporary hack.

## Changes to Tasks

### New Task: Task 08a - Create Mock Repository

**What to build:** Create the `MockRepository` class that abstracts expense data mutations.

**Location:** Between tasks 02 (mock data created) and 08 (review decision form built).

**Checklist:**
- [ ] Create `src/lib/repositories/ExpenseRepository.ts` (interface)
- [ ] Create `src/lib/repositories/MockExpenseRepository.ts` (implementation)
- [ ] `MockRepository` loads mock expenses into a `Map<id, Expense>` on construction
- [ ] Implement `getExpense(id: string): Promise<Expense | null>`
- [ ] Implement `updateExpenseStatus(id: string, status: Status, comment?: string): Promise<Expense>`
- [ ] Implement `reset(initialExpenses: Expense[]): void` for test setup
- [ ] Create `src/context/RepositoryContext.tsx` with React Context + hook
- [ ] Export `useRepository()` hook (throws if used outside provider)
- [ ] Write tests verifying:
  - Repository can be instantiated with initial expenses
  - `getExpense()` returns correct expense
  - `updateExpenseStatus()` mutates in-memory state and returns updated expense
  - `reset()` restores data to baseline
  - Calling `getExpense()` after `reset()` returns clean data

**Notes:** This is pure data infrastructure — no UI changes, no component integration yet.

### Updated Task 08: Build Review Decision Form Component

**Change:** No functional change. This task remains as-is.

**Rationale:** The form is purely a UI component; it doesn't know about persistence. Task 09 wires it to the repository.

### Updated Task 09: Integrate Decision Form & Implement Status Updates

**Change:** Replace the vague "Update mock data" language with explicit repository usage.

**Old language (lines 10–15):**
```
- [ ] Add local state for the current expense (loaded from mock)
- [ ] When ReviewDecisionForm submits:
   - If "Approve": set expense.status = "Approved"
   - If "Request Changes": set expense.status = "Changes Requested" and expense.internalNotes = comment
   - Update mock data (or app state) to reflect the change
   - Display success feedback (toast, message, or status badge color change)
```

**New language:**
```
- [ ] Load the expense via `useRepository().getExpense(id)` on mount
- [ ] Store current expense in local state: `useState<Expense>`
- [ ] When ReviewDecisionForm submits:
   - Call `useRepository().updateExpenseStatus(id, decision, comment)` (returns Promise<Expense>)
   - Update local state with the returned expense
   - Display success feedback (toast, message, or status badge color change)
```

**Additional note:** Add a test case that mocks `useRepository()` and verifies the hook is called with correct args.

---

## Architectural Impact

### What this changes in `docs/architecture.md`

Add a new section under "API / Service Boundaries":

```markdown
## Data Mutation Layer

Starting with the finance review workflow (Task 09+), data mutations flow through a repository abstraction:

- `src/lib/repositories/ExpenseRepository.ts` — interface for expense data access
- `src/lib/repositories/MockExpenseRepository.ts` — mock implementation (in-memory mutations)
- `src/context/RepositoryContext.tsx` — React Context + `useRepository()` hook

**Today:** `MockRepository` loads mock JSON into memory, methods mutate in-memory state and return results.

**Tomorrow:** Replace with `ApiRepository` that calls a backend API. Components do not change.

**Component usage:** `const repo = useRepository(); await repo.updateExpenseStatus(id, status, comment)`

This establishes the data-access boundary that was documented as missing in the original architecture (see "API / Service Boundaries").
```

### Related ADR

New decision recorded in `docs/decisions/architecture/0010-mock-repository-pattern.md` — explains the rationale and consequences.

---

## Test Implications

### Existing tests (Tasks 01–07)

No changes needed. Mock data is still loaded from JSON and used directly in component tests; no mutations happen yet.

### New tests (Task 08a)

Write unit/integration tests for `MockRepository` itself:
- Instantiation, getters, setters, reset
- Data starts clean, survives mutations, can be reset to baseline

### Task 09 tests

Integration tests should:
- Set up the repository with fresh data (call `reset()` before each test)
- Mock `useRepository()` in component tests
- Verify component calls `updateExpenseStatus()` with correct args
- Verify component updates local state with returned value

---

## No Breaking Changes

- Existing task specs for 01–07 are unaffected
- Existing code and tests continue to work
- Task 08 remains unchanged (form is pure UI)
- Task 09 is clarified, not restructured

---

## File Locations

```
src/
  lib/
    repositories/
      ExpenseRepository.ts       [NEW] — interface
      MockExpenseRepository.ts   [NEW] — implementation
  context/
    RepositoryContext.tsx        [NEW] — React Context + hook
```

`docs/decisions/architecture/0010-mock-repository-pattern.md` — ADR explaining the pattern

---

## Rationale Summary

1. **Cleanest abstraction** — Not forcing mutations through React state or JSON file mutations
2. **Test-safe** — Data is in-memory, resets cleanly, tests don't interfere
3. **Future-proof** — Swapping to a real API is a drop-in replacement of the implementation
4. **Single responsibility** — Component handles UI, repository handles data access
5. **Clear seam** — When onboarding a new developer, the repository boundary is obvious; they don't have to guess where mutations are supposed to happen
