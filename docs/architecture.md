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
        BR[BrowserRouter] --> APP[App / Routes]
        APP --> AC[AuthContext]
        AC --> SS[(sessionStorage)]
        AC --> MOCK[mocks/users.json]
        APP --> LP[LoginPage]
        APP --> EP[ExpensesPage - consultant]
        APP --> RP[ReviewPage - finance]
        APP --> RDP[ExpenseDetailPage - finance]
        LP --> AC
        EP --> AC
        RP --> AC
        RDP --> AC
        RP --> MOCK2[mocks/expenses.json]
        RDP --> MOCK2
    end
```

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
| `*` (catch-all) | — | Redirects to `/` |

Key principle: **there is no "return to originally requested URL" behavior.** After login, or
when a route guard rejects access, the user always lands on their role's default home
(`roleHome()` in `src/types.ts`). This is an intentional simplification, not an oversight.

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
  `ExpenseDetailPage`). These own page layout and compose shared components + shadcn primitives.
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

The expense data model is defined in **JSON Schema Draft 2020-12** in `docs/data-models/expense.schema.json`, with a Markdown summary in `docs/data-models/expense.md`. TypeScript interfaces (`Expense`, `ExpenseType`, `ExpenseStatus`) in `src/types.ts` are derived from the schema.

The JSON Schema is the authoritative source of truth. See `docs/decisions/0004-expense-data-model-json-schema.md`.

Mock expenses are stored in `src/mocks/expenses.json` (~10 records covering all statuses, types, and submitters).

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

**There are none today.** No `src/services/` or `src/api/` layer exists because there is no
backend to call. `AuthContext` currently plays the role that an API/service layer would normally
play (owning the one piece of "data access" the app has: reading `users.json`).

If a backend is introduced, expect this to change: `AuthContext` should call into a dedicated
service/client layer rather than reading mock data directly, so the context stays about *state*
and a new layer owns *data access*. This is a natural seam to introduce at that point — it does
not exist yet, so it is not documented as if it does.

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

Two distinct layers, each with a different purpose (see
`docs/decisions/0003-two-layer-testing-strategy.md`):

- **Vitest + React Testing Library** (`src/App.test.tsx`, colocated `.test.tsx` files) —
  integration-style tests that render the real `App` component tree (routes, context, guards)
  inside a `MemoryRouter`, and drive it through user-facing interactions (typing, clicking) rather
  than calling internal functions directly. This is the primary place login/routing/auth logic is
  verified. Run via `npm run test`.
- **Playwright** (`e2e/`) — full-browser end-to-end tests that exercise the app the way a real
  user would, through an actual dev server. These validate things RTL/jsdom can't (real
  navigation, real rendering), at the cost of being slower. Run via `npm run test:e2e`.

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
