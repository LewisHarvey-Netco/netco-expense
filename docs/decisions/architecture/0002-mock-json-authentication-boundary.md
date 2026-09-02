# ADR-0002: Mock JSON authentication as an explicit, temporary boundary

## Status
Accepted

## Context

The app needs a login flow to demonstrate role-based access (consultant vs. finance), but no
backend exists yet in this repository, and building one was out of scope for the initial feature
(see `.opencode/plans/user-login.md`). Without some decision here, it would be ambiguous whether
credential-checking logic belongs in a "real" auth boundary or a throwaway stub.

## Decision

Hardcode two users with plaintext passwords in `src/mocks/users.json`, and perform credential
matching entirely client-side inside `AuthContext.login()`. Track removal of this approach as a
**Blocking Go-Live** item in `TODO.md`.

## Rationale

- A frontend-only demo has no server to authenticate against; inventing one prematurely would add
  unjustified scope.
- Keeping the mock data in a clearly-named `mocks/` folder, with an explicit code comment in
  `AuthContext.tsx` pointing at `TODO.md`, makes the temporary nature of this approach obvious to
  anyone reading the code — it is not meant to look like a real security boundary.
- Centralizing credential matching inside `AuthContext.login()` (rather than scattering it) means
  there is exactly one place to change when real backend auth is introduced.

## Consequences

- **This is not a real security boundary.** Plaintext passwords are bundled into the client
  JavaScript and are trivially readable by anyone who opens dev tools. This is acceptable only
  because the app is a non-production demo.
- Because `login()`'s external interface (`{ success, error?, user? }`) doesn't leak
  implementation details, swapping the internal implementation for a real API call later should
  not require changes to `LoginPage`, `ProtectedRoute`, or any other consumer of `useAuth()`.
- Session persistence uses `sessionStorage` holding the plain `User` object (no token). `TODO.md`
  already tracks moving to token-based sessions once a backend exists — this ADR does not need to
  duplicate that plan, only record why the current approach was chosen.
