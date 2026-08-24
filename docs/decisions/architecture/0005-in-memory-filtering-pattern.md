# ADR-0005: In-memory filtering with pure, non-mutating filter logic

## Status
Accepted

## Context

The All Expenses page (`/review`) needs to filter expenses by status, submitter, type, and date range. A decision was needed on how to load data, how to apply filters, and how to restore the full dataset when filters are cleared.

## Decision

**All expenses are loaded once on component mount** into local state (`useState<Expense[]>`) and remain in memory for the page's lifetime. Filtering is implemented as a **pure function** (`filterExpenses(expenses, criteria)`) that returns a new filtered array without mutating the original. The full dataset is never removed from state.

Filters are applied **on-demand** via an "Apply Filters" button, not in real-time. Clearing filters resets the filter criteria to empty, causing the filtered list to equal the full dataset again (no re-fetch).

**Date range contract:** `dateRange.from`/`dateRange.to` are interpreted as **UTC calendar days** — each `Date` is normalized to its UTC day (year/month/day in UTC) before comparison, and the range is inclusive of both bounds. The date range filters on `receiptDate` (an ISO `YYYY-MM-DD` string). Callers must construct range dates as UTC midnights (e.g. `new Date('YYYY-MM-DD')`, which parses as UTC) — passing a local-midnight `Date` from a non-UTC timezone would shift the boundary by a day. `FilterPanel` always produces UTC-midnight dates from its `Input type="date"` values, so the app is internally consistent.

## Rationale

- **Mock data is small:** The current dataset (~10 expenses) fits comfortably in memory. Loading once and filtering in-memory is simpler than fetching on every filter change.
- **Pure functions are testable:** `filterExpenses()` can be unit-tested in isolation with no side effects, making filter logic easy to verify and maintain.
- **No re-fetch needed:** Since data is in memory, clearing filters is a state update (O(1)), not a network call. This keeps the UX snappy and avoids unnecessary complexity.
- **On-demand filtering:** An "Apply Filters" button gives users control over when filtering happens, avoiding performance concerns with real-time filtering on large datasets (future-proofing).

## Consequences

- **Memory grows with dataset:** If the expense list grows to thousands of items, the in-memory approach may become untenable. At that point, server-side filtering/pagination would be needed. This ADR covers the current mock-data scale.
- **No caching layer:** Because data is held in component state, navigating away from `/review` and returning will reload the dataset (from mock). If persistence across navigation is needed, a shared state layer (Context, Zustand, etc.) would be required.
- **Filter logic is decoupled:** The `filterExpenses()` utility is independent of React, making it reusable in tests, future API layers, or backend code.
- **Clear filters is a state reset:** The filter criteria object is reset to `{}`, not the dataset. This keeps the mental model simple: "all expenses are always in state; filtering is a view concern."
