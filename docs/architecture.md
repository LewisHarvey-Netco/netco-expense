# Architecture

This document describes the architecture of Netco Expense **as it exists today**. It does not
describe planned backend, storage, or infrastructure work — see `TODO.md` for what's planned and
`docs/decisions/` for why certain choices were made.

## System Overview

Netco Expense is currently a **frontend-only single-page application (SPA)**. There is no backend
service, no database, and no network API calls. All application state lives in the browser
(React state/context + `sessionStorage`), and "data" is hardcoded mock files bundled with the
app (`src/mocks/users.json`, `src/mocks/expenses.json`).

```mermaid
flowchart TD
    subgraph Browser
        BrowserRouter --> AppRoutes[App / Routes]
        AppRoutes --> AuthContext
        AuthContext --> SessionStorage[(sessionStorage)]
        AuthContext --> UsersMock[mocks/users.json]
        AppRoutes --> LoginPage
        AppRoutes --> ExpensesPage[ExpensesPage - consultant]
        AppRoutes --> ReviewPage[ReviewPage - finance]
        AppRoutes --> ExpenseDetailPage[ExpenseDetailPage - finance]
        LoginPage --> AuthContext
        ExpensesPage --> AuthContext
        ReviewPage --> AuthContext
        ExpenseDetailPage --> AuthContext
        ReviewPage --> ExpensesMock[mocks/expenses.json]
        ExpenseDetailPage --> ExpensesMock
        ExpenseDetailPage --> RepositoryContext
        RepositoryContext --> MockExpenseRepository
        MockExpenseRepository --> InMemoryCache[(in-memory cache)]
    end
```

Note: The `RepositoryContext` is introduced for data mutations in the finance review workflow (Tasks 09+). It abstracts expense updates behind an interface that will later be replaced with an API client.

There is no server tier in this diagram because none exists. If/when a backend is introduced,
this document should be updated and a new ADR should record the API/service boundary decision.

## Frontend Architecture

The app is a standard Vite + React + TypeScript SPA rendered client-side (`src/main.tsx`). The
composition root wraps the app in, from outermost to innermost:

1. `<BrowserRouter>` (React Router v7, classic JSX API)
2. `<AuthProvider>` (React Context, see below)
3. `<App>` (route table)

There is no server-side rendering, no data-router/loader API, and no code-splitting — the app is
small enough that a single bundle and eager imports are sufficient.

## Routing Architecture

Routes are declared in `src/App.tsx` using classic `<Routes>`/`<Route>` JSX (not the v7
data-router/loader API). Route table:

| Path | Component | Access |
|---|---|---|
| `/login` | `LoginPage` | Public |
| `/expenses` | `ExpensesPage` | `consultant` role only |
| `/review` | `ReviewPage` | `finance` role only |
| `/review/:id` | `ExpenseDetailPage` | `finance` role only |
| `/` | `RootRedirect` (inline) | Redirects to role home if logged in, else `/login` |
| `*` (catch-all) | `NotFoundPage` | Public — renders a 404 page with a "Go home" button back to `/` |

Key principle: **there is no "return to originally requested URL" behavior.** After login, or
when a route guard rejects access, the user always lands on their role's default home
(`roleHome()` in `src/types.ts`). This is an intentional simplification, not an oversight.

Unmatched URLs (anything not in the route table above) render `NotFoundPage` instead of silently
redirecting to `/`. This is deliberate: a silent redirect makes a missing/mistyped route
indistinguishable from a normal navigation, whereas a 404 page makes the problem visible. See
`docs/decisions/architecture/0009-catch-all-404-page.md`. `NotFoundPage` is public (not wrapped in
`ProtectedRoute`) since a 404 shouldn't require login — its "Go home" button navigates to `/`,
which then applies the redirect rule above.

Route protection is implemented by a single reusable guard, not per-page checks:

- `src/components/ProtectedRoute.tsx` wraps a route's element, optionally taking
  `allowedRoles?: Role[]`.
  - No `user` → redirect to `/login`.
  - `user` present but role not in `allowedRoles` → redirect to that user's own role home
    (not to `/login`, since they are authenticated, just not authorized for this page).
  - Otherwise render `children`.

Any new protected page should be added as a `<Route>` wrapped in `<ProtectedRoute>`, not with
ad-hoc auth checks inside the page component.

## Component Structure

- `src/pages/` — route-level components (`LoginPage`, `ExpensesPage`, `ReviewPage`,
  `ExpenseDetailPage`, `NotFoundPage`). These own page layout and compose shared components +
  shadcn primitives.
- `src/components/` — shared, hand-written components used across pages (`Header`,
  `ProtectedRoute`, `ExpenseTable`, `FilterPanel`, `ReviewDecisionForm`).
- `src/components/ui/` — shadcn/ui-generated primitives (Button, Input, Card, etc.). These are
  vendored source, not a package dependency — see `AGENTS.md` for the convention of adding new
  ones via the shadcn CLI rather than hand-writing them.

There is currently no intermediate "feature" or "domain" folder layer (e.g. no
`features/expenses/`) — the app is too small to need one. If the app grows (e.g. a real expense
list, forms, filters), consider introducing a feature-oriented folder before it becomes
unmanageable; this is a decision to make deliberately, not by default.

## State Management

There is no external state management library (no Redux, Zustand, Jotai, etc.), and no server
state library (no React Query/SWR) — because there is no server to fetch from.

State lives in two places today:

1. **Local component state** (`useState`) for ephemeral, page-local concerns (e.g. `LoginPage`'s
   `loginError`, react-hook-form's internal form state, expense list and filter criteria on
   `ReviewPage`).
2. **`AuthContext`** for the one piece of state that is genuinely cross-cutting: the logged-in
   user. This is intentionally the *only* context in the app.

**In-memory filtering:** `ReviewPage` loads all mock expenses once on mount into local state.
Filtering is implemented as a pure function (`filterExpenses()`) that returns a new filtered
array without mutating the original. The full dataset stays in memory; clearing filters resets
the filter criteria, not the data. See `docs/decisions/0005-in-memory-filtering-pattern.md`.

Given the app's current size, plain Context is sufficient. If more cross-cutting state is added
in the future (e.g. a shared expenses list consumed by both `ExpensesPage` and `ReviewPage`),
re-evaluate whether Context is still appropriate before reflexively adding another provider — see
`docs/decisions/0001-auth-state-via-react-context.md`.

## Data Model

The expense data model is defined in **JSON Schema Draft 2020-12** in `src/schemas/expense.schema.json`. TypeScript interfaces (`Expense`, `ExpenseType`, `ExpenseStatus`) in `src/types.ts` are derived from the schema. A Markdown summary is maintained in `docs/data-models/expense.md` for reference.

The JSON Schema in `src/schemas/` is the authoritative source of truth.

**Runtime Validation:** All expense data is validated against the JSON Schema via `src/lib/expense-validation.ts` (using `ajv`). This includes mock expenses in `src/mocks/expenses.json`, API responses (when a backend exists), and form submissions. The validation functions are:
- `validateAndParseExpense(data)` — validates and returns typed `Expense`, or throws with details
- `isValidExpense(data)` — type guard that checks without throwing

See `docs/decisions/0004-expense-data-model-json-schema.md` for rationale and consequences.

## Context Usage

`src/context/AuthContext.tsx` is the only context in the app. It exposes:

```ts
{ user: User | null; login(email, password): { success, error?, user? }; logout(): void }
```

Behavior:

- On mount, hydrates `user` from `sessionStorage` (key `netco-expense-auth`) if present, so a
  page refresh doesn't log the user out.
- `login()` checks credentials against the hardcoded array in `src/mocks/users.json`
  (case-insensitive email, exact password match) and, on success, stores the user
  (**without the password field**) in both React state and `sessionStorage`.
  `logout()` clears both.
- `useAuth()` is the only way to read or mutate auth state; it throws if used outside
  `AuthProvider`, which fails fast on misuse rather than silently returning `undefined`.

This is explicitly mock authentication for a frontend-only demo — see
`docs/decisions/0002-mock-json-authentication-boundary.md` and `TODO.md` (Blocking Go-Live) for
the plan to replace it with real backend auth.

## Form / Validation Architecture

Forms use `react-hook-form` for form state/registration and `zod` for schema validation, wired
together via `@hookform/resolvers/zod`. Currently there is one form (`LoginPage`):

- The zod schema defines both field-level constraints and their user-facing error messages.
- Validation errors are deliberately generic ("Invalid email or password") for both the email
  and password fields, and for a failed credential match — the schema doesn't reveal whether an
  email was malformed or simply didn't match, avoiding leaking which part of a login attempt was
  wrong.
- Submission calls `AuthContext.login()`; a failure path (bad credentials) is surfaced via a
  shadcn `Alert`, separate from field-level errors (which come from zod/react-hook-form).

Any future forms should follow the same pattern: zod schema → `useForm({ resolver: zodResolver(...) })`
→ shadcn `Input`/`Label` bound via `register()` → submit handler calling into the relevant
context/service.

## API / Service Boundaries

### Authentication

`AuthContext` currently owns the one piece of "data access" the app had before the finance review workflow: reading and validating credentials from `mocks/users.json`. This is intentionally mock and is tracked for replacement in `TODO.md` (Blocking Go-Live tier).

### Data Mutations (Finance Review Workflow) — PLANNED

**Status:** Not yet implemented. Implementation will occur in Task 08a (`plans/finance-pages/tasks/08a-create-mock-repository.md`). Once complete, this section will be updated and moved to describe current architecture.

Starting with the finance review workflow (expense approval/rejection), data mutations will flow through a repository abstraction:

- **Interface:** `src/lib/repositories/ExpenseRepository.ts` — defines contract for expense data access
- **Mock implementation:** `src/lib/repositories/MockExpenseRepository.ts` — mutates in-memory loaded data
- **Provider:** `src/context/RepositoryContext.tsx` — React Context + `useRepository()` hook

**Today (mock):** `MockRepository` loads mock expenses into memory on construction, provides methods that mutate the in-memory copy and return results.

**Tomorrow (real backend):** Replace with `ApiRepository` (HTTP client calling a backend API) — same interface, different implementation. Components do not change.

**Component usage pattern (future):**
```typescript
const repo = useRepository()
const updated = await repo.updateExpenseStatus(id, status, comment)
setExpense(updated)
```

This will establish the data-access boundary that was documented as "not yet existing" in earlier versions. See `docs/decisions/architecture/0010-mock-repository-pattern.md` for rationale.

### Reads vs. Writes

- **Reads** (e.g., loading expense list) currently load directly from mock data in component state, no abstraction needed yet
- **Writes** (e.g., approving an expense) will flow through the repository (Tasks 08a+) to ensure mutations are isolated and reversible in tests

## Data Flow

1. User submits the login form → `LoginPage` validates via zod → calls `AuthContext.login()`.
2. `AuthContext` matches credentials against `mocks/users.json`, updates its internal `user`
   state, and persists it to `sessionStorage`.
3. Any component that calls `useAuth()` (e.g. `Header`, `ProtectedRoute`, `App`'s
   `RootRedirect`) re-renders with the new `user` value on the next React render triggered by
   the context update.
4. Route guards (`ProtectedRoute`) read `user` on every render to decide whether to render the
   protected page or redirect.

There is no caching layer, no background sync, and no optimistic updates — state changes are
synchronous and local to the browser tab.

## Testing Architecture

Three distinct layers, each with a different purpose (see
`docs/decisions/0003-two-layer-testing-strategy.md`):

- **Vitest + React Testing Library** (`src/App.test.tsx`, colocated `.test.tsx` files) —
  integration-style tests that render the real `App` component tree (routes, context, guards)
  inside a `MemoryRouter`, and drive it through user-facing interactions (typing, clicking) rather
  than calling internal functions directly. This is the primary place login/routing/auth logic is
  verified. Run via `npm run test`.
- **Storybook** (`.stories.tsx` files) — Visual component development and manual testing. Renders
  individual components in isolation with different prop combinations. Run via `npm run storybook`.
  Useful for QA visual verification before integration and for exploring component behavior
  interactively.
- **Playwright** (`e2e/`) — full-browser end-to-end tests that exercise the app the way a real
  user would, through an actual dev server. These validate things RTL/jsdom can't (real
  navigation, real rendering), at the cost of being slower. Run via `npm run test:e2e` (headless)
  or `npm run test:e2e:headed` (visible browser). Use `PLAYWRIGHT_SLOW_MO=<ms>` to slow down
  actions for visual debugging, e.g. (PowerShell) `$env:PLAYWRIGHT_SLOW_MO=800; npm run test:e2e:headed`.

E2E tests cover the finance review workflow: login as finance → navigate to All Expenses → filter
→ view detail → approve/request changes → verify status update.

There are currently no isolated unit tests for individual functions (e.g. `roleHome()`) — coverage
is achieved through the integration-style tests above, which was a deliberate choice given the
app's current size, not an oversight.

## Architectural Boundaries and Principles

- **Auth state has exactly one owner:** `AuthContext`. No component reads `sessionStorage`
  directly or duplicates auth logic.
- **Route access control lives in one place:** `ProtectedRoute`. Pages do not implement their own
  redirect-if-unauthorized logic.
- **shadcn `ui/` components are vendored, not authored:** don't hand-edit generated primitives
  beyond their `cva` variant config; see `AGENTS.md` styling rules.
- **No premature abstraction:** there is no service layer, no state management library, and no
  feature-folder structure, because the current app doesn't need them yet. Introduce these
  deliberately, with a documented reason (ideally an ADR), rather than by convention or habit.
- **Mock data is explicitly temporary:** anything reading `src/mocks/` is expected to be replaced
  when a real backend exists (tracked in `TODO.md`, Blocking Go-Live tier).
- **Expense data model is schema-first:** `docs/data-models/expense.schema.json` is the
  authoritative source; TypeScript interfaces are derived from it. See ADR-0004.
- **Filtering is pure and in-memory:** `filterExpenses()` is a pure function; the full dataset
  stays in component state. See ADR-0005.
- **Status workflow is a state machine:** Four statuses (Submitted, Approved, Changes Requested,
  Resubmitted) with defined transitions. See ADR-0007.
