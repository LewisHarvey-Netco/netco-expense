# ADR-0001: Auth state via React Context, not an external state library

## Status
Accepted

## Context

The app needs to track a single piece of cross-cutting state — the currently logged-in user —
and make it available to the router (for redirects), route guards (for access control), and the
header (for display/logout). At the time this was introduced, the app had no other shared state
needs (see `.opencode/plans/user-login.md`).

## Decision

Use React's built-in Context API (`AuthContext` + `useAuth()` hook) to hold and expose auth
state, rather than introducing an external state management library (Redux, Zustand, Jotai, etc.)
or a server-state library (React Query, SWR).

## Rationale

- There is exactly one piece of shared state (`user`) and no server to synchronize with — no
  caching, invalidation, or background-refetch concerns that would justify a server-state library.
- Context's re-render characteristics are a non-issue at this scale (a handful of components).
- Adding a state management dependency for a single value would be unjustified complexity for a
  demo app of this size.

## Consequences

- Low overhead, no extra dependency, easy to understand for anyone new to the codebase.
- If the app grows to have multiple independent pieces of shared state (e.g. a shared expenses
  list), plain Context may start to show its limitations (e.g. every consumer re-rendering on any
  change). That tradeoff should be re-evaluated at that point rather than assumed away — this ADR
  covers today's single-context reality, not a commitment to Context forever.
- `useAuth()` throws if called outside `AuthProvider`, which is a deliberate fail-fast choice over
  silently returning `undefined`.
