# 03: Extract `ExpenseReviewSection` Component

**What to build:** A new finance-only component that encapsulates the expense review decision workflow. Renders the decision status message (if expense is not decidable) and the `ReviewDecisionForm` with decision handling. This extraction separates finance-specific logic from the detail card, making the detail component truly reusable across roles while keeping the page layout clear.

**Blocked by:** 2

**Status:** ready-for-agent

- [ ] Create `src/components/expenses/ExpenseReviewSection.tsx` component
- [ ] Accept `expense`, `disabled`, and `onSubmit` props
- [ ] Render decision status message when expense is not decidable
- [ ] Render `ReviewDecisionForm` with submit handler wired to `onSubmit` callback
- [ ] Add tests in `ExpenseReviewSection.test.tsx` verifying: form and status message render correctly, disabled state works, submit handler is called
