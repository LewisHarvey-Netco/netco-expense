# 11: Add E2E Tests for Finance Review Workflows

**What to build:** Write Playwright E2E tests covering the core finance review user journeys: finance login → navigate to All Expenses → filter → view detail → approve/request changes → verify status update.

**Blocked by:** 09 - Integrate Decision Form & Implement Status Updates, 10 - Add Navigation Link to Header

**Status:** done (all tests implemented and passing — 10/10, verified 2026-09-01)

## ✅ Completed

- [x] **Navigation & access control** (`review-page.spec.ts`):
  - Finance login and navigation to `/review` with table display
  - Clicking expense row navigates to detail page with correct data
  - Consultant redirect from `/review` back to `/expenses`
- [x] **Filtering** (`review-filters.spec.ts`):
  - Status filters (Approved, etc.)
  - Submitter filters (combobox selection)
  - Category filters
  - Date range filters
  - Combined multi-filter scenarios
- [x] **Decision workflows** (`review-decision.spec.ts`):
  - Approve: finance clicks "Approve" → "Submit Decision" → status badge becomes "Approved", confirmation alert shown, decision form disabled
  - Request changes: finance clicks "Request Changes" → enters comment → "Submit Decision" → status badge becomes "Changes Requested", comment stored and rendered under "Internal notes", form disabled
  - Validation: submitting "Request Changes" with an empty comment shows "Comment is required when requesting changes" and status stays "Submitted"
- [x] **Status persistence** (`review-decision.spec.ts`): approve an expense → back to All Expenses → re-enter detail → status still "Approved" with form disabled. (SPA navigation only — the repository is in-memory per ADR-0010, so a full page reload resets to the mock baseline by design.)
- [x] **Test data documentation**: header comment in `review-decision.spec.ts` lists each expense used, its ID, amount, submitter, and starting status
- [x] **Test helpers** (`e2e/helpers.ts`): Login utility function `loginAs(page, email)` set up

## Notes

- Tests use real browser navigation with mock data (auth mock + mock expenses list)
- All interactions are user-visible (clicks, form inputs, text assertions)
- The `/review` table reads directly from the mock module (ADR-0010), so it always shows baseline statuses; persistence is asserted on the detail page, which reads from the repository
- Each test gets a fresh page load → fresh in-memory repository, so tests are isolated and parallel-safe
- Run with `npm run test:e2e` — 10 tests passing
