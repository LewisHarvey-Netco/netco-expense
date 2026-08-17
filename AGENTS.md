# AGENTS.md

## Repo Purpose

Demo expense app built to experiment with Feniks AI capabilities. Start from scratch — no existing codebase conventions to follow.

## Guidance for Future Sessions

- **Stack:** Vite 8 + React 19 + TypeScript 6, npm as package manager.
- **Linting:** oxlint (Vite's default). Run `npm run lint`.
- **Commands:**
  - `npm install` — install dependencies
  - `npm run dev` — start dev server
  - `npm run build` — TypeScript check + Vite production build
  - `npm run lint` — run oxlint
  - `npm run preview` — preview production build
- **Node:** No version pinned. Recommend Node ≥20.19 (Vite 7+ minimum). Current tested version: v24.19.0.
- Keep this file updated as conventions evolve.

## Problems Log

This repo maintains a `problems.md` file at the root, tracking friction
and issues in the human↔agent workflow itself (permissions, tooling gaps,
environment quirks — not application bugs).

- Whenever a session hits a workflow problem — a blocked command, a
  confusing permission denial, a tool that doesn't behave as expected,
  an ambiguous or missing instruction — document it in `problems.md`
  using the existing entry format (date, what was attempted, what went
  wrong, root cause if known, status).
- Keep `problems.md` up to date at all times: add new entries as issues
  arise, and update the status field when something is worked around or
  resolved.
- Do not delete old entries even after they're resolved — mark them
  resolved instead, so the log stays a historical record.
