# ADR-0012: Role-Aware Expense Detail Page

## Status
Implemented (04-refactor-expense-detail-page-role-aware, completed 2026-09-02)

## Context

The consultant expense viewing feature requires both roles to view expense details:

1. **Finance** reviews expenses at `/review/:id` and records a decision (approve / request changes).
2. **Consultants** view their own expenses at `/expenses/:id` in a read-only view (route added by ticket 07).

Both views render the same expense detail card (`ExpenseDetailCard`). The differences are:

- Finance sees an additional review section (`ExpenseReviewSection`) with the decision form; consultants do not.
- Consultants may only view their own expenses; finance may view any.

The detail page previously rendered everything inline (detail fields + review form) and assumed a finance viewer.

## Decision

1. **Single role-aware page.** `ExpenseDetailPage` serves both `/review/:id` and `/expenses/:id`. It reads the current user via `useAuth()` and renders conditionally:
   - **Finance** — two-column layout: `ExpenseDetailCard` (left) + a "Review Decision" card wrapping `ExpenseReviewSection` (right). Back button → `/review`.
   - **Consultant** — single-column layout: `ExpenseDetailCard` only. Back button → `/expenses`.
   - The `role` prop is passed to `ExpenseDetailCard` so the card's API matches the role-aware page (in phase 1 the card renders identically for all roles).
2. **Client-side ownership check.** For consultants, after loading, the page verifies `expense.submitterId === user.id`. On a mismatch it renders the same 404 (`NotFoundPage`) as an unknown id, so the response doesn't reveal that the expense exists.
3. **Fail closed on missing user.** The page is served behind `ProtectedRoute`, so a user is expected; if none is present (unexpected), the page renders the 404 rather than the detail.
4. **Load error state.** A rejected `getExpense()` now renders a destructive alert instead of hanging in the loading state (the previous code had no rejection handling).

## Rationale

- **No duplication.** Both roles share one load path, one detail card, and one set of page state; only the layout and the review section differ.
- **Role awareness in its natural context.** Route protection (`ProtectedRoute` with `allowedRoles`) keeps roles from colliding at the entry point; `useAuth()` inside the page is the natural place to branch on role (auth awareness is already required for role-based routes).
- **404 on ownership mismatch.** Rendering the identical 404 as an unknown id avoids leaking the existence of another consultant's expense.
- **UX boundary, not a security boundary.** The client-side ownership check is an early-redirect optimization. The data-access boundary is the repository (`getExpensesBySubmitter()`), which must enforce authorization server-side once a real backend is introduced. Client-side checks alone are not sufficient for production.

## Alternatives Considered

- **Separate pages per role** (`ReviewDetailPage` + `ConsultantExpenseDetailPage`). Rejected: both
  pages would render the same `ExpenseDetailCard` and share the same load/error/ownership logic,
  so the split duplicates the load path, state, and layout scaffolding for a difference that is
  only "does the review section render?" — more code to keep in sync on every change to the detail
  card or load handling.
- **Configuration-object pattern** (one page driven by a per-role config: which sections render,
  which back link, etc.). Rejected: the only role difference today is the review section and the
  back link; a config layer abstracts a two-case branch into indirection without buying
  extensibility (there is no third role in scope). Revisit if a third viewer role appears.
- **Redirect on ownership mismatch** (e.g. to `/expenses`) instead of rendering the 404 in place.
  Rejected: a redirect reveals that the resource exists (the user is sent somewhere meaningful
  about *their* data), and a client-side redirect is an extra hop for no benefit; rendering the
  same 404 as an unknown id keeps the two failure cases indistinguishable.

## Consequences

- `ExpenseDetailPage` is role-aware and is rendered by two routes with different `allowedRoles`; it must stay correct for both.
- The `/expenses/:id` route (ticket 07) renders the same page behind `ProtectedRoute allowedRoles={['consultant']}`.
- Consultants see all detail fields read-only, including a "No notes yet" placeholder when there are no internal notes — the same detail card finance sees.
- When a real backend is introduced, the ownership check must be mirrored server-side; the client check remains only as an early redirect.

## Related ADRs

- **ADR-0010** (Mock Repository Pattern) — the repository is the data-access boundary the ownership check complements.
- **ADR-0009** (Catch-all 404 Page) — the ownership mismatch reuses the same 404 presentation as an unknown id.
- **ADR-0008** (Review Decision Form Pattern) — the decision form is hosted by `ExpenseReviewSection` (extracted in ticket 03); the page wires its `onSubmit` to `updateExpenseStatus()`.
