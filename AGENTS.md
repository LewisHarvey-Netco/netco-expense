# AGENTS.md

## Repo Purpose

Demo expense app built to experiment with Feniks AI capabilities. Start from scratch — no existing codebase conventions to follow.

## Guidance for Future Sessions

- **Stack:** Vite 8 + React 19 + TypeScript 6, npm as package manager.
- **Routing:** React Router v7 (classic JSX `<BrowserRouter>`/`<Routes>`/`<Route>`).
- **Styling:** Tailwind v4 + shadcn/ui (New York style, lucide-react icons). shadcn components live in `src/components/ui/` — add new ones via `npx shadcn@latest add <name>`, don't hand-write them.
- **Forms:** react-hook-form + zod + shadcn's `Form` component.
- **Testing:** Vitest + React Testing Library, colocated `.test.tsx` files. Run `npm run test`.
- **Linting:** oxlint (Vite's default). Run `npm run lint`.
- **Commands:**
  - `npm install` — install dependencies
  - `npm run dev` — start dev server
  - `npm run build` — TypeScript check + Vite production build
  - `npm run lint` — run oxlint
  - `npm run test` — run Vitest tests
  - `npm run preview` — preview production build
- **Node:** No version pinned. Recommend Node ≥20.19 (Vite 7+ minimum). Current tested version: v24.19.0.
- **Folder convention:** `src/{pages,components,context,mocks,lib}`. Pages are route-level components in `src/pages/`, shared components in `src/components/`, shadcn UI in `src/components/ui/`, contexts in `src/context/`, utilities in `src/lib/`, mock data in `src/mocks/`.
- Keep this file updated as conventions evolve.

## TODO Prioritization

`TODO.md` is organized into three tiers:

- **Blocking Go-Live** — Must be done before release. Agent should prioritize these above all else.
- **Should-Do** — Important, but not blocking. Address after go-live blockers are resolved.
- **Nice-to-Have** — Low priority polish. Only touch if there's nothing else to do.

When the agent completes or adds a TODO, place it in the correct tier. Ask the user before moving items between tiers.

## Configuration Files

| File | Description | Docs |
|------|-------------|------|
| `vite.config.ts` | Vite dev server, plugins, and `@` path alias | [Vite Config](https://vite.dev/guide/) |
| `vitest.config.ts` | Vitest test runner: jsdom environment, setup files, globals | [Vitest Config](https://vitest.dev/config/) |
| `tsconfig.json` | Project references pointing to app and node configs | [TS Project Refs](https://www.typescriptlang.org/docs/handbook/project-references.html) |
| `tsconfig.app.json` | TypeScript for app source: JSX, path aliases, strict checks | [TS Compiler Options](https://www.typescriptlang.org/tsconfig/) |
| `tsconfig.node.json` | TypeScript for config files: Node module resolution | [TS Compiler Options](https://www.typescriptlang.org/tsconfig/) |
| `.oxlintrc.json` | oxlint rules: react hooks, component export warnings | [oxlint Docs](https://oxc.rs/docs/guide/usage/lint/rules.html) |
| `components.json` | shadcn/ui CLI: style, path aliases, icon library | [shadcn Docs](https://ui.shadcn.com/docs/cli) |

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
