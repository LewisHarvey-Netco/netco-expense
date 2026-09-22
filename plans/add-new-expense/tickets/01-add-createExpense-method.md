# 01: Add `createExpense()` method to `ExpenseRepository`

**What to build:** Repository layer accepts and persists a complete expense object with validation, enabling the creation workflow without backend changes.

**Blocked by:** None (can start immediately).

**Status:** done (2026-09-22)

## Acceptance Criteria

- [x] `createExpense(expense: Expense) => Promise<Expense>` is added to `ExpenseRepository` interface in `src/lib/repositories/ExpenseRepository.ts`
- [x] `MockExpenseRepository` implements `createExpense()`: validates expense against Zod schema, checks for duplicate ID (throws if found), stores in internal map, returns created expense
- [x] Unit tests cover: successful creation with all fields, duplicate ID error, schema validation failure
- [x] Method rejects `Approved` expenses (immutable status)
- [x] Tests pass without breaking existing repository tests