# Finance Pages Implementation Tickets

## Overview

This directory contains 11 tracer-bullet tickets for implementing the Finance Review Pages feature described in `plans/PRD-FINANCE-PAGES.md`.

Each ticket is a complete, demoable vertical slice cutting through all layers (schema, UI, tests). Tickets are numbered 01–11 in dependency order (blockers first), so you can work the frontier: any ticket whose dependencies are complete is ready to start.

## Ticket Breakdown

| # | Title | Blocked By | Status |
|---|-------|-----------|--------|
| 01 | Define Expense Data Model & Schema | None | Ready |
| 02 | Create Mock Expenses Dataset | 01 | Ready when 01 done |
| 03 | Create Expense Table Component | 02 | Ready when 02 done |
| 04 | Build All Expenses Page (/review) | 03 | Ready when 03 done |
| 05 | Implement Filter Logic & Form | 03 | Ready when 03 done |
| 06 | Integrate Filters into All Expenses Page | 04, 05 | Ready when 04 & 05 done |
| 07 | Create Expense Detail Page (/review/:id) | 02 | Ready when 02 done |
| 08 | Build Review Decision Form Component | 02 | Ready when 02 done |
| 09 | Integrate Decision Form & Status Updates | 07, 08 | Ready when 07 & 08 done |
| 10 | Add Navigation Link to Header | 04 | Ready when 04 done |
| 11 | Add E2E Tests | 09, 10 | Ready when 09 & 10 done |

## Key Architectural Decisions

### Data Loading & Filtering

- **All expenses loaded once** on component mount into local state (`useState`)
- **Full dataset stays in memory** throughout the page lifecycle — filtering never removes data
- **`filterExpenses()` is pure** — returns a new filtered array without mutating the original
- **Clearing filters** resets the filter criteria, causing the filtered list to equal the full dataset again

### Vertical Slices

Each ticket is independent after its blockers complete:
- Tickets 01–02 form a foundation (model + mock data)
- Tickets 03–06 build the All Expenses page (table, filtering, UI)
- Tickets 07–09 build the Expense Detail page (display, review form, status updates)
- Ticket 10 adds navigation
- Ticket 11 tests the whole flow

### Scope & Out of Scope

**In scope:**
- Two new routes: `/review` (all expenses) and `/review/:id` (detail)
- Role-based access control (finance only)
- Filter by status, submitter, type, date range
- Approve and Request Changes actions with required comment
- Status transitions (Submitted → Approved or Changes Requested → Resubmitted)
- Mock data and E2E tests

**Out of scope:**
- Conversation threading (future feature)
- Pagination, sorting, search
- Receipt upload/viewer (placeholder only)
- Mobile/tablet responsiveness
- Cap calculations or flag details

## Next Steps

1. **Start with ticket 01**: Define the expense data model and TypeScript interfaces
2. **Work the frontier**: As each ticket completes, its dependents become ready
3. **Run tests frequently**: Each ticket includes unit/component/integration tests; use them to verify behavior
4. **Reference the PRD**: `plans/PRD-FINANCE-PAGES.md` is the source of truth; check it for questions

## Files

All tickets are in `issues/` as individual markdown files:
- `01-define-expense-model.md`
- `02-create-mock-expenses.md`
- `03-create-expense-table-component.md`
- ... (and so on)
