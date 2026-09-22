# Routing

How Netco Expense routes between its screens. The full architectural context lives in
`docs/architecture.md`; this is a focused reference on routing alone.

## Setup

The app uses **React Router v7** with the classic JSX API (`<BrowserRouter>` / `<Routes>` /
`<Route>`). It does **not** use the v7 data-router / loader API, and there is no code-splitting
or lazy loading — the app is small enough for a single eagerly-loaded bundle.

The composition root (`src/main.tsx`) wraps the app in, outermost to innermost:

1. `<BrowserRouter>`
2. `<RepositoryProvider>` (expense data access)
3. `<AuthProvider>` (logged-in user)
4. `<App>` (the route table)

All routing logic lives in `src/App.tsx`.

## Route table

| Path | Component | Access |
|---|---|---|
| `/login` | `LoginPage` | Public |
| `/expenses` | `ExpensesPage` | `consultant` role only |
| `/expenses/:id` | `ExpenseDetailPage` (role-aware) | `consultant` role only |
| `/review` | `ReviewPage` | `finance` role only |
| `/review/:id` | `ExpenseDetailPage` (role-aware) | `finance` role only |
| `/` | `RootRedirect` (inline) | Redirects to role home if logged in, else `/login` |
| `*` (catch-all) | `NotFoundPage` | Public — 404 page with a "Go home" button |

## Root redirect

`/` is not a page — it's an inline `RootRedirect` component. It reads the current user from
`useAuth()` and sends them somewhere with `<Navigate ... replace>`:

- **Logged in** → their role's home (`roleHome(user.role)`).
- **Not logged in** → `/login`.

`roleHome()` (in `src/types.ts`) maps a role to its default home: `consultant` → `/expenses`,
`finance` → `/review`.

## Route protection

Access control is centralized in a single reusable guard, `src/components/ProtectedRoute.tsx`.
It wraps a route's element and takes an optional `allowedRoles?: Role[]`. On every render it
reads `user` from `useAuth()` and decides:

- **No user** → redirect to `/login`.
- **User present but role not in `allowedRoles`** → redirect to that user's *own* role home
  (not `/login` — they're authenticated, just not authorized for this page).
- **Otherwise** → render the wrapped `children`.

New protected pages should be added as a `<Route>` wrapped in `<ProtectedRoute>`, never with
ad-hoc auth checks inside the page component.

## Role-aware detail page

`ExpenseDetailPage` is one page serving two routes: `/expenses/:id` (consultant) and
`/review/:id` (finance). It determines the user's role via `useAuth()` and renders
conditionally — finance sees the review workflow (approve / request changes), consultants see
their own expense (editable when in a non-terminal status). Both share the same
`ExpenseDetailCard` and a single load path, avoiding state duplication across separate pages.
See `docs/decisions/architecture/0012-role-aware-expense-detail-page.md`.

## Catch-all 404

Any URL not in the route table renders `NotFoundPage` instead of silently redirecting to `/`.
This is deliberate: a silent redirect makes a mistyped/missing route indistinguishable from
normal navigation, whereas a 404 page makes the problem visible. `NotFoundPage` is public (not
wrapped in `ProtectedRoute`) — a 404 shouldn't require login. Its "Go home" button navigates to
`/`, which then applies the root redirect rule. See
`docs/decisions/architecture/0009-catch-all-404-page.md`.

## Key principle: no "return to originally requested URL"

After login, or when a guard rejects access, the user always lands on their role's default home
(`roleHome()`). There is no `from`/`location.state` mechanism to send a user back to the URL
they originally requested. This is an intentional simplification, not an oversight.
