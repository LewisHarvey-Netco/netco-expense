# 11: Add E2E Tests for Finance Review Workflows

**What to build:** Write Playwright E2E tests covering the core finance review user journeys: finance login → navigate to All Expenses → filter → view detail → approve/request changes → verify status update.

**Blocked by:** 09 - Integrate Decision Form & Implement Status Updates, 10 - Add Navigation Link to Header

**Status:** ready-for-agent

- [ ] Create `e2e/finance-review.spec.ts` with three test cases:
  1. **Finance review workflow**: Log in as finance → navigate to All Expenses → verify table displays → click an expense → verify detail page shows correct data → click "Approve" → verify status changed to "Approved"
  2. **Request changes workflow**: Log in as finance → navigate to expense detail → click "Request Changes" → enter comment → submit → verify status changed to "Changes Requested" and comment stored
  3. **Access control**: Attempt to access `/review` as consultant (should redirect to `/expenses` or show access denied)
- [ ] Tests use real browser navigation and mock data
- [ ] All steps are user-visible (click, type, navigate, verify visible UI)
- [ ] Run with `npm run test:e2e` and pass
- [ ] Document any test data assumptions (which expense to use, expected mock data state, etc.)
