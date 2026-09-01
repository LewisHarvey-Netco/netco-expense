# Plan: Sync expense table with repository decisions

**Folder name (repo docs):** `plans/expense-list-use-live-mock/`
**TODO item addressed:** Should-Do → "Sync expense table with repository decisions"

## Goal

Make the `/review` expense table read from the expense repository instead of the static
`@/mocks/expenses` module, so statuses decided on the detail page are visible when the user
returns to the list. Record the decision as ADR-0011 and document the work in
`plans/expense-list-use-live-mock/live-mock-grill-me-output.md`.

## Current state

- `src/pages/ReviewPage.tsx:19` seeds local state from the static mock module
  (`useState<Expense[]>(() => [...mockExpenses])`) and never re-reads it → stale table after a
  decision on the detail page.
- `src/pages/ExpenseDetailPage.tsx` already reads via `useRepository().getExpense(id)` and writes
  via `updateExpenseStatus` — the repository is the source of truth for mutations, just not the list.
- `src/lib/repositories/ExpenseRepository.ts` has only `getExpense(id)` and
  `updateExpenseStatus(id, status, comment?)` — no list method.
- ADR-0010 (`docs/decisions/architecture/0010-mock-repository-pattern.md`) anticipated this:
  "reads can still load directly from mock data initially".
- `docs/architecture.md` ("Reads vs. Writes", mermaid diagram) and E2E comments in
  `e2e/review-decision.spec.ts` (lines 11–13, 87–89) document the stale table as current behavior.
- `RepositoryProvider` is mounted in `src/main.tsx` (not in `App`), so `App.test.tsx` renders the
  tree without it — today harmless, breaking after this change (see test plan).

## Decisions (from interview)

1. **Mechanism — read-on-mount (Option A).** Add `getExpenses(): Promise<Expense[]>` to the
   `ExpenseRepository` interface; `ReviewPage` fetches the list on mount. Navigating to the detail
   page unmounts `ReviewPage`, so returning remounts it and re-reads the repository — the table is
   always fresh on arrival. No reactive/subscription machinery, no shared list state in Context.
2. **ADR — new ADR-0011** (`docs/decisions/architecture/0011-expense-list-reads-via-repository.md`)
   that *extends* ADR-0010 (writes boundary → reads + writes). A note goes at the top of ADR-0010:
   **"Extended by ADR-0011"** — accurate semantics; 0011 supersedes only ADR-0010's consequence
   that "reads can still load directly from mock data initially". Also fix the stale ADR index
   table in `docs/decisions/architecture/README.md` (missing rows 0009, 0010; add 0011).
3. **Loading state — full-page placeholder (Option A).** Mirror `ExpenseDetailPage`: `Header` +
   one-line "Loading expenses…" in muted text, swap to the real page when the promise resolves.
4. **Error handling — minimal (Option B).** try/catch around the fetch; on failure render a
   destructive `Alert` ("Failed to load expenses. Please try again."), no retry button. Matches the
   detail page's write-error precedent.
5. **Full-page-reload persistence — out of scope (Option A).** The in-memory repository re-seeds
   from mock JSON on refresh; documented as a known limitation in ADR-0011. Client-side
   persistence is intentionally *not* built — the real backend will repull data from the API.
6. **TODO.md — consolidate.** Replace the "Remove mocked users" Blocking Go-Live item with one
   consolidated item covering users **and** expenses (wording below); token-based sessions stays a
   separate item. Check off and remove the Should-Do "Sync expense table" item when this lands.
7. **Plan documentation — single file** `plans/expense-list-use-live-mock/live-mock-grill-me-output.md`
   (user will turn it into tasks later). No `tasks/` folder.

## Implementation steps (ordered)

### 1. Repository interface + mock

**`src/lib/repositories/ExpenseRepository.ts`**
- Add `getExpenses(): Promise<Expense[]>` to the interface.
- Update header doc comment: boundary now covers reads **and** mutations; reference ADR-0011.

**`src/lib/repositories/MockExpenseRepository.ts`**
- Implement: `async getExpenses(): Promise<Expense[]> { return Array.from(this.expenses.values()) }`
- Semantics: new array each call (callers can't corrupt repo state); insertion/seed order
  (Map order = JSON order, so table order is unchanged); shared object references are safe because
  the repository never mutates objects in place (updates store new objects).

### 2. ReviewPage

**`src/pages/ReviewPage.tsx`**
- Remove `import mockExpenses from '@/mocks/expenses'`.
- Add `const repo = useRepository()`.
- State: `allExpenses: Expense[] | null` (null = not loaded), plus `error: string | null`.
  (A single `allExpenses === null` check covers loading; no separate `loaded` flag needed.)
- `useEffect` on mount (with `cancelled` cleanup flag, same pattern as `ExpenseDetailPage:77-93`):
  `repo.getExpenses().then(setAllExpenses).catch(() => setError('Failed to load expenses. Please try again.'))`
- Render branches:
  - `allExpenses === null && !error` → `Header` + `main` + `<p className="text-sm text-muted-foreground">Loading expenses…</p>`
  - `error` → `Header` + `main` + `PageTitle` + destructive `Alert` with the error message
  - otherwise → current layout unchanged (`FilterPanel`, Card, count line, `ExpenseTable`).
- `submitters` derivation and `filterExpenses` usage stay as-is (now derived from the loaded list).

### 3. Tests

**`src/lib/repositories/MockExpenseRepository.test.ts`** — new `describe('getExpenses')`:
- returns all seeded expenses
- preserves seed order
- reflects a prior `updateExpenseStatus`
- returns a new array each call (mutating the result doesn't affect the repo)

**`src/pages/ReviewPage.test.tsx`** — one new integration test (the regression test for the bug):
render at `/review` → click a "Submitted" row → approve on the detail page → "Back to All
Expenses" → assert that row now shows the **Approved** badge.
Existing tests need no changes: the loading placeholder doesn't render the "All Expenses"
heading, so existing `findByRole('heading', { name: 'All Expenses' })` calls already wait for the
async load; `renderAppAt` already injects a fresh `MockExpenseRepository`.

**`src/App.test.tsx`** — wrap `renderApp()` in
`<RepositoryProvider repository={new MockExpenseRepository(mockExpenses.map((e) => ({ ...e })))}>`
(same fresh-repo pattern as `ReviewPage.test.tsx`). Without this, "logs in as finance and lands on
/review" crashes: `ReviewPage` will now call `useRepository()` and the provider is absent
(`RepositoryProvider` lives in `main.tsx`, not `App`). No assertion changes.

**`e2e/review-decision.spec.ts`**:
- Rewrite the comment block at lines 11–13 (currently: "The /review table reads directly from the
  mock module… always shows baseline statuses") — the table now reads from the repository.
- Rewrite the comment at lines 87–89 (currently: "the /review table also still shows baseline
  statuses") — keep the full-reload caveat, drop the stale-table claim.
- Extend "a recorded decision persists across navigation": after "Back to All Expenses", assert
  the *row* for "Taxi to Copenhagen airport for client visit" contains the "Approved" badge
  (scope to the row via `getByRole('row').filter({ hasText: … })` — 3 mock expenses are already
  Approved, so an unscoped text match is ambiguous).

**Unaffected (verified by sweep):** `ExpenseDetailPage.test.tsx`, `RepositoryContext.test.tsx`,
`ExpenseTable.stories.tsx` (inline data), `e2e/review-page.spec.ts`, `e2e/review-filters.spec.ts`.

### 4. Documentation

**`docs/decisions/architecture/0011-expense-list-reads-via-repository.md`** (new ADR):
- Status: Implemented (with date)
- Header note: extends ADR-0010; supersedes only its "reads can still load directly from mock
  data" consequence
- Context: stale-table bug (TODO item); ADR-0010 anticipated reads would follow
- Decision: `getExpenses()` on the interface; `ReviewPage` reads the list on mount; full-page
  loading placeholder; minimal error state
- Rationale: single source of truth; remount-refetch fixes the stale UX with no reactivity;
  mirrors the detail-page pattern; degrades to a real backend as `GET /expenses`
- Consequences: interface change (any future `ApiRepository` must implement `getExpenses`);
  `ReviewPage` becomes async (loading/error states); **known limitation** — in-memory repository
  re-seeds on full page reload, so decisions don't survive refresh; client-side persistence
  intentionally not built (real API will be the persistence layer — see TODO)
- Related: ADR-0010 (extended), ADR-0005 (in-memory filtering still applies to the loaded list)

**`docs/decisions/architecture/0010-mock-repository-pattern.md`** — note at top (after title):
> **Extended by [ADR-0011](./0011-expense-list-reads-via-repository.md)** — expense list reads now
> also go through the repository. This ADR covers the mutation boundary; ADR-0011 extends it to
> reads and supersedes the consequence that reads could still load directly from mock data.

**`docs/decisions/architecture/README.md`** — ADR index table: add missing rows 0009, 0010 and
new row 0011.

**`docs/architecture.md`**:
- Mermaid diagram: remove `ReviewPage --> ExpensesMock[mocks/expenses.json]` and
  `ExpenseDetailPage --> ExpensesMock` edges (the latter is already stale), remove the now-unused
  `ExpensesMock` node, add `ReviewPage --> RepositoryContext`.
- Note under the diagram (line ~37): update "ExpenseDetailPage will be the first component to use
  it" → both `ReviewPage` (list) and `ExpenseDetailPage` (detail) read through the repository.
- "Reads vs. Writes" section: rewrite the Reads bullet — list and detail both load through the
  repository on mount (`getExpenses` / `getExpense`); the list refetches on every mount, which is
  how decisions recorded on the detail page appear when returning to `/review`.

**`TODO.md`** — Blocking Go-Live becomes:
```markdown
- [ ] Replace mock data with a real backend: remove `src/mocks/users.json` and
      `src/mocks/expenses.json`, backing both with real API calls — real user
      accounts for authentication, and an `ApiRepository` implementing
      `ExpenseRepository` for expense reads/writes. Server-side persistence
      replaces the in-memory mock repository, so decisions are repulled from
      the API rather than persisted client-side (see ADR-0011).
- [ ] Implement token-based sessions: store JWT in sessionStorage instead of
      the user object, attach to API requests, and handle token expiry and
      refresh
```
(Old "Remove mocked users" item deleted — replaced by the consolidated one.)
Should-Do: check off and remove "Sync expense table with repository decisions".

### 5. Plan documentation (repo)

**`plans/expense-list-use-live-mock/live-mock-grill-me-output.md`** (new, single file):
- Goal + context (the stale-data bug, ADR-0010's anticipated follow-up)
- All 7 interview decisions with the rejected alternatives (mechanism A vs reactive vs shared
  state; ADR-0011 vs amend vs none; "extended by" wording; full-page placeholder; minimal error
  state; reload persistence out of scope; consolidated TODO)
- Ordered implementation checklist (steps 1–4 above, file-level)
- Test plan (section 3 above)
- Known limitations (reload re-seed; no retry on fetch error)
- Note: to be broken into tasks later by the user

## Verification

1. `npm run lint`
2. `npm run test` (Vitest)
3. `npm run build` (tsc + Vite)
4. `npm run test:e2e` (Playwright, headless)

## Risks / open questions

- None blocking. Assumption to confirm via the e2e sweep: `review-page.spec.ts` and
  `review-filters.spec.ts` are unaffected (same baseline data, same assertions — the repository is
  seeded from the same mock JSON).
- StrictMode double-invokes effects in dev; the `cancelled` cleanup flag in the mount effect
  handles this (same pattern already proven in `ExpenseDetailPage`).
