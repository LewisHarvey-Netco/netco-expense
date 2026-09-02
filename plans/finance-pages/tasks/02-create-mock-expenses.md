# 02: Create Mock Expenses Dataset

**What to build:** Generate a realistic mock dataset of ~10 expenses with variety across all four statuses, all five types, multiple submitters, and realistic regions/projects/currencies. This provides test data for development and E2E testing.

**Blocked by:** 01 - Define Expense Data Model & Schema

**Status:** done

- [ ] Create `src/mocks/expenses.json` with ~10 expenses, ensuring representation of:
  - All four statuses: Submitted, Approved, Changes Requested, Resubmitted
  - All five types: Breakfast, Lunch, Dinner, Transport, Accommodation
  - Multiple submitters (e.g., Alice Nielsen, Bob Madsen)
  - Mixed regions (e.g., EMEA, DACH, Nordics) and projects
  - Multiple currencies (EUR, USD, DKK, GBP)
  - Varied amounts and dates
  - Some expenses with internalNotes (for Changes Requested status)
- [ ] Ensure all mock expenses conform to the TypeScript `Expense` interface defined in ticket 01
- [ ] Add mock expenses to a singleton mock data provider for use in pages (or directly export from mocks file)
