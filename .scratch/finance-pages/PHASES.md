# Development Phases

Tickets are grouped into phases by what can be worked **in parallel**. Within each phase, all tickets have their blockers satisfied and can be started simultaneously.

Work one phase at a time, top to bottom. Do not skip ahead.

---

## Phase 1: Foundation

**Tickets:** 01

| # | Ticket | Notes |
|---|--------|-------|
| 01 | Define Expense Data Model & Schema | No blockers — start here |

**When to move on:** When the expense schema, TypeScript interfaces, and unit tests are complete.

---

## Phase 2: Mock Data

**Tickets:** 02

| # | Ticket | Blocked By |
|---|--------|-----------|
| 02 | Create Mock Expenses Dataset | 01 |

**When to move on:** When mock expenses are generated and conform to the model.

---

## Phase 3: Building Blocks (Parallel)

**Tickets:** 03, 07, 08

| # | Ticket | Blocked By |
|---|--------|-----------|
| 03 | Create Expense Table Component | 02 |
| 07 | Create Expense Detail Page (/review/:id) | 02 |
| 08 | Build Review Decision Form Component | 02 |

These three tickets are **independent of each other** and can be worked in parallel by different agents or in the same session. They all depend only on the mock data being ready.

**When to move on:** When all three components are built and tested.

---

## Phase 4: Pages & Integration (Parallel)

**Tickets:** 04, 05, 09

| # | Ticket | Blocked By |
|---|--------|-----------|
| 04 | Build All Expenses Page (/review) | 03 |
| 05 | Implement Filter Logic & Form | 03 |
| 09 | Integrate Decision Form & Status Updates | 07, 08 |

Three independent tracks:
- **04** wires the table into the All Expenses page
- **05** builds the filter utility and form (decouples from the page)
- **09** integrates the decision form into the detail page and implements status updates

All three can run in parallel once Phase 3 is done.

**When to move on:** When all three tickets are complete.

---

## Phase 5: Wiring & Navigation (Parallel)

**Tickets:** 06, 10

| # | Ticket | Blocked By |
|---|--------|-----------|
| 06 | Integrate Filters into All Expenses Page | 04, 05 |
| 10 | Add Navigation Link to Header | 04 |

Two independent tickets:
- **06** connects the filter form to the All Expenses page (needs both the page and the filter logic)
- **10** adds the "All Expenses" link to the Header (needs the page to exist)

Both can run in parallel once Phase 4 is done.

**When to move on:** When filters are wired and navigation is in place.

---

## Phase 6: End-to-End Testing

**Tickets:** 11

| # | Ticket | Blocked By |
|---|--------|-----------|
| 11 | Add E2E Tests for Finance Review Workflows | 09, 10 |

Final phase: write Playwright E2E tests covering the full finance review workflow. Requires all features to be integrated.

**When to move on:** When E2E tests pass in headless mode.

---

## Dependency Graph

```
01 → 02 → 03 → 04 → 06 → 11
         ↘    ↘  ↗  ↘  ↗
          → 07 → 09 → 10 → 11
          → 08 → 09
```

**Critical path:** 01 → 02 → 03 → 04 → 06 → 11 (6 tickets, sequential)

**Maximum parallelism:** Phase 3 and Phase 4 each have 3 tickets that can run simultaneously.

---

## Tips for Working the Phases

- **Single agent:** Work through phases sequentially. Within a phase, complete tickets in order (they're listed in logical order).
- **Multiple agents:** Assign parallel tickets in the same phase to different agents. Ensure Phase N is complete before starting Phase N+1.
- **CI discipline:** Each ticket should land green on its own. If a ticket breaks CI, fix it before moving to the next phase.
- **Testing:** Run `npm run test` (unit/component) and `npm run lint` after each ticket. Save `npm run test:e2e` for Phase 6.
