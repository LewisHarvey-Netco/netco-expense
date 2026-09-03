# 01: Repository Layer: Add `getExpensesBySubmitter()` Method

**What to build:** A new repository method that filters expenses by submitter ID, establishing the data-access boundary for consultant-scoped queries. When called, the method returns only expenses matching the provided submitter ID. This method will be invoked by the consultant expense list page and serves as the enforcement point for consultant data access—a pattern that will scale to backend authorization once a real API is introduced.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Add `getExpensesBySubmitter(submitterId: string): Promise<Expense[]>` method to `ExpenseRepository` interface in `src/lib/repositories/ExpenseRepository.ts`
- [x] Implement method in `MockExpenseRepository` to filter in-memory expenses by submitter ID
- [x] Add unit tests in `MockExpenseRepository.test.ts` covering: empty result, single consultant's expenses, multiple consultants filtered correctly
- [x] Verify method is async (prepared for backend swap)
