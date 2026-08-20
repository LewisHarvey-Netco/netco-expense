# Plan: Build the Finance Pages

## 1. Goal

Replace the placeholder `ReviewPage` (`/review`, "Expense review queue coming soon.") with a
real, working finance experience, translating the four finance screens already designed in the
static prototype (`prototype/finance/*.html`) into React: a flagged-receipts queue, a per-expense
review/decision detail view with a messaging thread, an all-expenses table, and a statistics
dashboard. This requires introducing the app's first real expense data model and its second
React Context (`ExpensesContext`), since no expense data exists anywhere in the codebase today.

## 2. Current State

- **Routing** (`src/App.tsx`): flat `<Routes>`/`<Route>` JSX, one route per page, each wrapped in
  `<ProtectedRoute allowedRoles={[...]}>`. `/review` → `ReviewPage` (finance-only), a stub.
- **Auth** (`src/context/AuthContext.tsx`, `src/types.ts`): `AuthContext` is the only context.
  `Role = 'consultant' | 'finance'`. `roleHome('finance') === '/review'`. Mock users in
  `src/mocks/users.json`: only `Alice Nielsen` (consultant) and `Bob Madsen` (finance) exist today.
- **No expense data model exists anywhere** — no `Expense` type, no mock expenses, no second
  context. `docs/architecture.md` explicitly anticipated this gap: *"If more cross-cutting state
  is added in the future (e.g. a shared expenses list consumed by both `ExpensesPage` and
  `ReviewPage`), re-evaluate whether Context is still appropriate."*
- **Design reference**: `prototype/finance/flagged.html`, `review.html`, `all.html`, `stats.html`
  (static HTML/CSS, non-functional). These are the source of truth for layout/content, not for
  literal numbers (see mock data section below — real computed values will differ).
- **UI primitives available**: `src/components/ui/{label,input,card,button,badge,alert}.tsx`
  (shadcn, vendored). **Missing**: `table`, `select`, `textarea` — needed for this feature.
- **Forms pattern**: react-hook-form + zod + `@hookform/resolvers/zod`, used today only in
  `LoginPage`.
- **Testing**: Vitest+RTL (`src/App.test.tsx`, integration-style, renders real `App` in
  `MemoryRouter`) + Playwright (`e2e/`, one spec per login role). `e2e/login-finance.spec.ts`
  currently asserts on `ReviewPage`'s stub text — **will break** once this plan lands.
- **Design guidelines**: Netcompany palette only, coral as accent (this plan treats functional
  status badges as exempt from the "one coral per page" rule — confirmed with user).

## 3. Key Decisions (from interview)

| # | Decision |
|---|---|
| 1 | Build all four finance screens in this plan (Flagged Queue, Review Detail, All Expenses, Statistics). |
| 2 | Routes nested under `/review`: `/review`, `/review/:id`, `/review/all`, `/review/stats`. |
| 3 | Introduce `ExpensesContext` (mirrors `AuthContext`: seeded once, held in state, persisted to `sessionStorage`). New ADR required. |
| 4 | `ExpensesPage` (consultant) stays exactly as today's stub. Not touched in this plan. |
| 5 | New `FinanceNav` component (tabs), rendered via a new `FinanceLayout` nested route (`<Outlet/>`), not folded into `Header`. |
| 6 | `Expense` and `Message` types added to `src/types.ts`. |
| 7 | Daily cap summary on Review Detail: **static, hardcoded per expense** in mock data. No aggregation engine. |
| 8 | Review decisions: Approve/Reject set status; Partial Approval treated as Approve (no amount input, no splitting logic — new TODO). Internal notes stored, never shown to consultant. Redirect to `/review` after submit. |
| 9 | Messaging thread: fully functional, `messages[]` lives on the `Expense` record, persisted via context. |
| 10 | Filters (Flagged Queue, All Expenses): functional, client-side, plain `useState` per page, applied on button click, no URL sync. |
| 11 | Status badges (`flagged`/`rejected`/`approved`/`submitted`): extend `badge.tsx`'s `cva` config with new variants; coral used for flagged/rejected is exempt from "one coral per page" (functional, not decorative). |
| 12 | Receipt Image: static placeholder box, no real image. New TODO for real image storage/display. |
| 13 | "Export" button on All Expenses: omitted entirely (existing Nice-to-Have TODO already covers real export). |
| 14 | Statistics: counts/totals/breakdowns/queue-health computed live from `ExpensesContext`; "Recent Actions" section is static mock data (new TODO for real action-history tracking). |
| 15 | Money aggregates on Statistics grouped **per-currency** (no blended sum, no fake exchange rates). |
| 16 | Testing: update broken E2E spec; add RTL tests for queue/detail/approve-reject/messaging; add one new Playwright spec for the full review journey. |
| 17 | Review Detail (`/review/:id`) always shows the full decision form regardless of expense status (no read-only mode). |
| 18 | "Back" button on Review Detail: `navigate(-1)` with fallback to `/review`. |
| 19 | Mock submitters: add John Smith, Sarah Johnson, Mike Chen, Emily Davis as real consultant entries in `users.json` (alongside Alice/Bob), matching the existing `firstname@netcompany.com` / `password123` pattern. No new login tests needed for them. |
| 20 | shadcn CLI must be run to add `table`, `select`, `textarea` before writing page code — not hand-authored. |
| 21 | Mock expense dates computed **relative to current date** (`daysAgo(n)` helper) so aging-bucket stats stay realistic over time. Consequently mock data lives in `src/mocks/expenses.ts` (a generator module), not a static `.json`. |
| 22 | Currencies: `'GBP' | 'EUR' | 'USD' | 'SEK' | 'DKK'`. Mock data includes a mix. Format via `Intl.NumberFormat` with per-currency locale. |
| 23 | `flagReason` is a strict enum (`FlagReason` union in `types.ts`) with a label lookup map, for reliable grouping in stats. Prototype's stray "Meals" expense type is normalized to a real `ExpenseType` value. |
| 24 | `/review/:id` with an unknown id → render "Expense not found" message + link back to `/review` (no silent redirect). |
| 25 | New TODO items (all **Should-Do** tier): partial-approval amount-splitting logic; real receipt image storage/display; real "Recent Actions" activity-history tracking. |
| 26 | One new ADR: `docs/decisions/0004-expenses-state-via-react-context.md`. Nested routing documented as an `architecture.md` update, not a separate ADR. |
| 27 | `ExpensesProvider` added to composition root (`src/main.tsx`), nested inside `AuthProvider`, wrapping the whole app (even though only finance pages consume it today). |

## 4. Proposed Changes

### 4.1 Setup

1. Run `npx shadcn@latest add table select textarea` to vendor the three missing UI primitives
   into `src/components/ui/`. Do not hand-write them.

### 4.2 Data model (`src/types.ts`)

2. Add to `src/types.ts`:
   - `type Currency = 'GBP' | 'EUR' | 'USD' | 'SEK' | 'DKK'`
   - `type ExpenseType = 'breakfast' | 'lunch' | 'dinner' | 'transport' | 'accommodation' | 'other'`
   - `type ExpenseStatus = 'submitted' | 'approved' | 'flagged' | 'rejected'`
   - `type FlagReason = 'over_daily_cap' | 'missing_receipt' | 'duplicate_submission' | 'missing_project_info' | 'requires_approval'`
     plus `flagReasonLabels: Record<FlagReason, string>` lookup map (e.g. `over_daily_cap` →
     "Over Daily Cap").
   - `interface Message { id: string; author: string; authorRole: Role; text: string; timestamp: string }`
   - `interface DailyCapSummary { breakfast: { spent: number; cap: number }; lunch: { spent: number; cap: number }; dinner: { spent: number; cap: number }; total: { spent: number; cap: number } }`
     (currency assumed to match the parent expense's currency; static/display-only, not computed).
   - `interface Expense { id: string; submitterId: string; submitterName: string; description: string; type: ExpenseType; amount: number; currency: Currency; region: string; project: string; submittedDate: string; status: ExpenseStatus; flagReason?: FlagReason; dailyCapSummary?: DailyCapSummary; internalNotes?: string; decision?: 'approve' | 'reject' | 'partial'; messages: Message[] }`
   - Currency formatting helper `formatCurrency(amount: number, currency: Currency): string` using
     `Intl.NumberFormat` with a per-currency locale map (e.g. `GBP→en-GB`, `EUR→de-DE`,
     `USD→en-US`, `SEK→sv-SE`, `DKK→da-DK`).

### 4.3 Mock users (`src/mocks/users.json`)

3. Add four new consultant entries (John Smith, Sarah Johnson, Mike Chen, Emily Davis) following
   the existing shape/pattern (`firstname@netcompany.com`, `password123`, `role: 'consultant'`),
   with new ids `u3`–`u6`. Do not modify Alice/Bob.

### 4.4 Mock expenses (`src/mocks/expenses.ts`)

4. Create `src/mocks/expenses.ts`:
   - A `daysAgo(n: number): string` helper returning an ISO date string offset from `new Date()`.
   - An exported `createMockExpenses(): Expense[]` function producing ~10-12 records:
     - 5 flagged (matching prototype's examples: over-cap dinner, missing-receipt transport,
       duplicate-submission lunch, missing-project-info accommodation, requires-approval other),
       attributed across John/Sarah/Mike/Emily, using a realistic date spread across the aging
       buckets (some `daysAgo(1)`, some `daysAgo(3)`, some `daysAgo(6)`) so Statistics' queue-health
       buckets are non-trivial.
     - The over-cap dinner expense carries a hardcoded `dailyCapSummary` (breakfast £5/£10, lunch
       £10/£15, dinner £62/£25, total £77/£40) matching the prototype's numbers.
     - A handful of `approved`/`submitted` expenses (matching All Expenses prototype examples),
       including at least one non-GBP currency each for SEK and DKK (and optionally EUR/USD) to
       exercise multi-currency display and stats grouping.
     - Each expense gets a `messages: []` or a short seeded thread (the flagged dinner expense
       gets the 3-message thread from the prototype, reattributed to its real submitter).
     - Normalize the prototype's stray "Meals" label to `'lunch'` in mock data.

### 4.5 `ExpensesContext` (`src/context/ExpensesContext.tsx`)

5. Create `ExpensesContext`, modeled directly on `AuthContext`:
   - `STORAGE_KEY = 'netco-expense-expenses'`.
   - State initializes from `sessionStorage` if present, else calls `createMockExpenses()`.
   - `useEffect` persists state to `sessionStorage` on every change.
   - Exposed API:
     - `expenses: Expense[]`
     - `getExpenseById(id: string): Expense | undefined`
     - `submitDecision(id: string, decision: 'approve' | 'reject' | 'partial', notes?: string): void`
       — sets `status` (`approve`→`'approved'`, `reject`→`'rejected'`, `partial`→`'approved'`),
       sets `decision`, sets `internalNotes`.
     - `addMessage(id: string, text: string, author: string, authorRole: Role): void` — appends a
       `Message` (generate `id` via `crypto.randomUUID()`, `timestamp: new Date().toISOString()`)
       to that expense's `messages`.
   - `useExpenses()` hook throws if used outside `ExpensesProvider`, matching `useAuth()`'s
     fail-fast pattern.
   - Add a code comment marking `expenses.ts` as mock/temporary, consistent with the
     `AuthContext.tsx` comment style pointing at `TODO.md`.

### 4.6 Composition root (`src/main.tsx`)

6. Wrap `App` with `<ExpensesProvider>` nested inside `<AuthProvider>`:
   `BrowserRouter → AuthProvider → ExpensesProvider → App`.

### 4.7 Badge variants (`src/components/ui/badge.tsx`)

7. Extend `badgeVariants`'s `cva` config with four new semantic variants: `submitted` (muted/
   secondary tone), `approved` (green tone), `flagged` (coral tone), `rejected` (coral or a
   distinct muted-destructive tone). Use only palette tokens already defined in `src/index.css`
   (no new arbitrary colors). Add a small `statusBadgeVariant: Record<ExpenseStatus, BadgeVariant>`
   lookup (co-located in `src/types.ts` or a new `src/lib/expense-ui.ts` helper) so pages don't
   repeat the mapping.

### 4.8 Shared finance nav (`src/components/FinanceNav.tsx`)

8. New component: three `NavLink`s (Flagged Queue → `/review`, All Expenses → `/review/all`,
   Statistics → `/review/stats`) with active-state styling (e.g. underline/background using
   existing tokens). Rendered only within `FinanceLayout`, not inside `Header`.

### 4.9 Finance layout (`src/pages/FinanceLayout.tsx`)

9. New layout component: renders `<Header/>`, `<FinanceNav/>`, then `<Outlet/>` for the nested
   child route's page content.

### 4.10 Routing (`src/App.tsx`)

10. Restructure the `/review` route as a parent route wrapped in
    `<ProtectedRoute allowedRoles={['finance']}>` rendering `<FinanceLayout/>`, with nested
    children (React Router v7 classic JSX nested-route syntax):
    - index route (`/review`) → `FlaggedQueuePage`
    - `:id` (`/review/:id`) → `ReviewDetailPage`
    - `all` (`/review/all`) → `AllExpensesPage`
    - `stats` (`/review/stats`) → `StatisticsPage`
    Remove the old flat `/review` → `ReviewPage` route and delete `src/pages/ReviewPage.tsx`.

### 4.11 Page: Flagged Queue (`src/pages/FlaggedQueuePage.tsx`)

11. Build per `prototype/finance/flagged.html`:
    - Filters bar: Flag Reason (`Select`, options from `FlagReason` + "All"), Submitter (`Input`,
      free-text match against `submitterName`), Region (`Select`, options derived from distinct
      regions in mock data + "All"). "Apply Filters" button applies `useState` filter values to
      the displayed list (client-side `.filter()`).
    - Table (`Table` primitive) listing `expenses.filter(e => e.status === 'flagged')` (post
      client-side filters): Submitted date, Submitter, Description, Type, Amount (formatted),
      Flag Reason (badge/label), Review button → `/review/:id`.
    - "Quick Stats" card: computed live (pending count, total-at-risk grouped per-currency,
      awaiting-response count — awaiting-response defined as flagged expenses whose most recent
      message author is finance, i.e. waiting on the submitter).

### 4.12 Page: Review Detail (`src/pages/ReviewDetailPage.tsx`)

12. Build per `prototype/finance/review.html`:
    - Read `:id` param via `useParams()`; look up via `useExpenses().getExpenseById(id)`. If not
      found, render an "Expense not found" message with a link back to `/review`.
    - Expense Details card (description, type, amount+currency, region, project, submitted date)
      — read-only display.
    - Receipt Image card: static gray placeholder box (no real image).
    - Daily Food Cap Summary card: rendered only if `expense.dailyCapSummary` is present, showing
      the static hardcoded breakdown.
    - Flag Details card: rendered only if `expense.flagReason` is present, showing the label +
      any prose (can reuse `flagReasonLabels`).
    - Review Decision card: react-hook-form + zod form.
      - zod schema: `{ action: z.enum(['approve','reject','partial'], { required_error: '...' }), notes: z.string().optional() }`.
      - `Select` bound via `register`/`Controller` (whichever the vendored shadcn `select.tsx`
        requires) for the decision.
      - `Textarea` for internal notes (optional).
      - Submit calls `submitDecision(id, action, notes)`, then `navigate('/review')`.
      - Always shown regardless of expense status (per decision #17 — no read-only mode).
    - Communication with Submitter card: renders `expense.messages` (styled per `message-sender`/
      `message-finance` prototype classes, translated to Tailwind), plus a plain `useState`-backed
      text `Input` + Send `Button` that calls `addMessage(id, text, user.name, user.role)` and
      clears the input.
    - "Back to Queue" button: `navigate(-1)`; if there's no router history (e.g. direct load),
      fall back to `navigate('/review')`. (Note in code comment that `history.state?.idx` or a
      simple try/fallback pattern is acceptable given no dedicated history-depth API exists.)

### 4.13 Page: All Expenses (`src/pages/AllExpensesPage.tsx`)

13. Build per `prototype/finance/all.html`, minus the Export button (omitted per decision #13):
    - Filters bar: Status (`Select`: All/Submitted/Approved/Flagged/Rejected), Submitter
      (`Input`), Type (`Select`, from `ExpenseType`), Date Range (`Input type="date"`, filters
      `submittedDate >= value`). Functional, client-side, applied on button click.
    - Table listing all `expenses` (post-filter): Submitted date, Submitter, Description, Type,
      Amount (formatted per-currency), Status (badge), action button — "Review" for
      flagged/submitted rows, "View" for approved/rejected rows, both linking to `/review/:id`
      (same page, per decision #17 the form always renders regardless of status).
    - Header count reflects actual filtered/total count from `ExpensesContext`, not a fake
      hardcoded number.

### 4.14 Page: Statistics (`src/pages/StatisticsPage.tsx`)

14. Build per `prototype/finance/stats.html`, with computed (not hardcoded) values except where
    noted:
    - Top stat cards: Total This Month (count, computed), Total Amount (**grouped per-currency**,
      e.g. rendered as a small stacked list "£X · krY · €Z" rather than one figure), Flagged
      (Need Review) count, Approved count. All computed from `ExpensesContext`.
    - "Expense Breakdown by Type": grouped by `ExpenseType`, summed **per-currency within each
      type** (or per-currency totals shown per type row) — keep the currency-grouping rule
      consistent everywhere money is summed.
    - "Top Submitters": grouped by `submitterName`, summed per-currency.
    - "Common Flag Reasons": grouped by `FlagReason` via `flagReasonLabels`, counted (counts are
      currency-agnostic, no aggregation issue here).
    - "Review Queue Health": bucket flagged expenses by age
      (`daysSince(submittedDate)`: 0-2 / 2-5 / 5+), computed live, with the same proportional bar
      style as the prototype.
    - "Recent Actions": **static mock array** (not derived from real decisions), clearly commented
      in code as a placeholder pending real action-history tracking (new TODO, see below).

### 4.15 `docs/architecture.md` updates

15. Update to reflect:
    - New route table rows (nested `/review/*` structure) and the fact that `App.tsx` now uses
      nested `<Route>`/`<Outlet/>` for the finance section — first use of nesting in this app,
      still within the classic JSX Routes/Route API (not the data-router/loader API).
    - New "State Management" / "Context Usage" content describing `ExpensesContext` alongside
      `AuthContext`, and a pointer to the new ADR.
    - Update the Mermaid diagram to include `ExpensesContext`, `mocks/expenses.ts`, and the four
      new pages.
    - Note that `src/mocks/expenses.ts` (unlike `users.json`) is a `.ts` generator (not static
      JSON) because mock dates are computed relative to the current date.

### 4.16 New ADR

16. Add `docs/decisions/0004-expenses-state-via-react-context.md` following the existing ADR
    format (Status/Context/Decision/Rationale/Consequences), explicitly referencing
    ADR-0001's open question about a second context and explaining why plain Context remains
    sufficient (two contexts, no cross-context dependency issues, no server to sync).

### 4.17 `TODO.md` updates

17. Add three new items under **Should-Do**:
    - "Implement real partial-approval amount-splitting logic (currently Partial Approval behaves
      identically to full Approve; see `ExpensesContext.submitDecision`)."
    - "Add real receipt image upload, storage, and display for expenses (Review Detail currently
      shows a static placeholder)."
    - "Track real finance action history for the Statistics page's 'Recent Actions' feed (currently
      static mock data, not derived from actual approve/reject/message events)."

### 4.18 Tests

18. **Fix existing E2E test**: update `e2e/login-finance.spec.ts` — replace the
    `getByText('Review Queue', { exact: true })` assertion with an assertion matching the new
    Flagged Queue page's actual heading (e.g. "Flagged Receipts").
19. **New RTL tests** (colocated, e.g. `src/pages/FlaggedQueuePage.test.tsx` and/or extend
    `src/App.test.tsx`), rendering real `App` + `AuthProvider` + `ExpensesProvider` in
    `MemoryRouter`, covering:
    - Logging in as finance lands on `/review` and shows the flagged queue table with expected
      row count.
    - Clicking "Review" on a flagged row navigates to `/review/:id` and shows expense details.
    - Submitting an Approve decision removes that expense from the Flagged Queue view after
      navigating back.
    - Sending a message on Review Detail appends it to the visible thread.
20. **New Playwright spec** `e2e/finance-review-flow.spec.ts`: login as finance → see flagged
    queue → click into a review → approve → back to queue → assert the expense is no longer
    listed as flagged.

## 5. Risks / Open Questions

- **shadcn `select`/`textarea` API shape is unknown until generated** — the plan assumes
  `register()`-compatible or `Controller`-compatible bindings consistent with `LoginPage`'s
  pattern; the executing agent should check the generated component's actual props before wiring
  the decision form, and adjust the zod/RHF wiring if the vendored `Select` requires
  `Controller` instead of plain `register()` (common for non-native select primitives).
- **`navigate(-1)` fallback**: there's no built-in "do we have history" check in React Router v6/7
  without extra state tracking; the plan accepts a best-effort fallback (e.g. wrapping in a
  try/catch or checking `window.history.state`) rather than building a robust solution — acceptable
  for a demo, but worth flagging during implementation review.
- **Per-currency stats formatting** adds visual complexity the prototype never had to solve (it
  only ever showed `£`). The exact layout for "stacked per-currency totals" isn't dictated by the
  prototype and will need a small amount of original design judgment during implementation,
  still bound by `DESIGN-GUIDELINES.md`.
- **Coral-badge/design-guideline tension**: confirmed exempt per user decision, but worth a brief
  one-line note in `DESIGN-GUIDELINES.md` or a code comment if a future design review questions
  the repeated coral badges — not necessarily required, flagging for awareness.
- **Mock data realism**: `dailyCapSummary` numbers are static/hand-authored and will not stay
  consistent with whatever other mock expenses exist for that submitter/day (accepted per decision
  #7 — display-only, not derived).