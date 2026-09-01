# ADR-0010: Mock Repository Pattern for Data Mutations

## Status
Accepted (Implementation pending — see Task 08a in plans/finance-pages/tasks/)

## Context

When implementing data mutation features (e.g., updating expense status during the finance review workflow), we face a tension:

1. We're currently working with mock data loaded from JSON files
2. Tests depend on this data remaining unmodified between runs
3. We'll eventually move to a real backend with a proper API
4. Components need to call code that feels like persisting data (async, returns updated result)
5. If we mutate React state directly or modify JSON files, we'll end up with temporary code that needs complete replacement when the backend arrives

## Decision

Implement a **mock repository pattern** that abstracts data mutations behind a stable interface:

- Create a `MockRepository` class that loads JSON mock data into memory once at startup
- Provide CRUD methods (read, update, etc.) that operate on the in-memory copy, not the filesystem
- Expose this via React Context so components can inject it
- Implement the same interface for the real backend later (swap implementations, components stay the same)

This establishes a service/data-access boundary that did not exist before (see ADR-0001 and architecture.md "API / Service Boundaries" section).

## Rationale

- **No file mutations** — tests remain deterministic and independent; fresh JSON is read at startup
- **Data flow matches real backend** — components call a service, get back a result, update local state with it
- **Zero component refactoring later** — when you add a real backend, implement `ExpenseRepository` API client with the same interface; drop it in place of `MockRepository`; components never change
- **Explicit seam for testing** — you can swap implementations in tests (e.g. mock a failure scenario)
- **Clear architectural boundary** — mutations flow through the repository, not scattered across components or state management
- **Preserves mock data integrity** — in-memory mutations are isolated per test run; original JSON is pristine for the next test

## Consequences

- A new layer of abstraction is introduced, but only for mutation operations (reads can still load directly from mock data initially)
- `MockRepository` will be temporary code (replaced when backend arrives), but it's well-contained and doesn't pollute component logic
- Components must call async methods (even though mock methods are synchronous) to prepare for real API calls later
- Requires careful seeding/reset in tests to ensure each test starts with fresh data

## Implementation (Pending)

This decision is planned but not yet implemented. Implementation will be done in Task 08a:

- `src/lib/repositories/ExpenseRepository.ts` — interface definition
- `src/lib/repositories/MockExpenseRepository.ts` — mock implementation (in-memory mutations)
- `src/context/RepositoryContext.tsx` — React Context to inject repository
- Tests use `mockRepository.reset()` before each test to restore baseline data

Once Task 08a is complete, this ADR will be updated to remove this "Pending" callout and the status will change to "Implemented".

## Related ADRs

- **ADR-0001** (Auth state via Context) — establishes Context as the pattern for shared app state
- **ADR-0005** (In-memory filtering) — related in-memory data pattern; filtering also works with loaded data
