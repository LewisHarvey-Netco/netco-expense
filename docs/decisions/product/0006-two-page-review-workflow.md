# ADR-0006: Two-page review workflow with role-protected routes

## Status
Accepted

## Context

The Finance Review feature requires two distinct user experiences: (1) viewing all expenses in a table with filtering, and (2) reviewing a single expense in detail and making a decision. A decision was needed on how to structure these pages, how to protect them, and how to navigate between them.

## Decision

Implement **two separate routes** under the `/review` path:
- `/review` — All Expenses page (table + filters)
- `/review/:id` — Expense Detail page (single expense + review form)

Both routes are protected by `<ProtectedRoute role="finance">`. Navigation between them is via clickable table rows (list → detail) and a Header link (direct to list).

The routes follow the existing routing pattern in `src/App.tsx`: classic React Router v7 `<Routes>`/`<Route>` JSX, no data-router/loader API.

## Rationale

- **Separate concerns:** The list view (browsing, filtering) and detail view (reviewing, deciding) have different layouts, interactions, and state. Keeping them as separate pages avoids a monolithic component.
- **URL-driven navigation:** Each page has its own URL, enabling bookmarking, browser history, and direct linking to specific expenses.
- **Existing pattern reuse:** The app already uses `ProtectedRoute` for role-based access and classic React Router for routing. This decision extends that pattern rather than introducing a new one.
- **Scalability:** If sub-routes are needed later (e.g., `/review/:id/conversation`, `/review/:id/flags`), the nested route structure is already in place.

## Consequences

- **Two page components:** `ReviewPage.tsx` (list) and `ExpenseDetailPage.tsx` (detail) are independent, route-level components. They share no state except what's passed via URL params or props.
- **No nested routes today:** The detail page is a sibling route (`/review/:id`), not a child of `/review`. This is simpler and matches the existing routing style. If nested routes are needed later, this can be refactored.
- **Access control is per-route:** Each route is independently protected. A finance user can navigate to either route directly (via URL or link). There is no "parent" route that gates access to both.
- **Mock data lookup:** The detail page loads an expense by ID from the mock dataset. If the ID is invalid or missing, the page shows an error or redirects. This is a frontend-only concern; with a real API, a 404 response would handle this naturally.
