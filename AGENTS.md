# AGENTS.md

## Repo Purpose

Demo expense app built to experiment with Feniks AI capabilities. Start from scratch — no existing codebase conventions to follow.

## Project Structure

- `src/`: main application code, agent should work here
- `scripts/`: build/deploy scripts, agent may read but not modify
- `node_modules/`: DO NOT read or analyze, ever
- `.env`: DO NOT read, contains secrets
- `dist/`: generated output, ignore entirely

## Architecture

`docs/architecture.md` is the source of truth for the architectural patterns this codebase must follow (routing, auth/context, state management, forms, testing boundaries, and where new architectural boundaries like a service/API layer should go). Consult it — and follow the patterns it documents — before making any change that touches these areas; don't invent a conflicting pattern. Significant architectural decisions and their rationale are recorded in `docs/decisions/` — check there before revisiting a decision, and add a new ADR when making another one.

Keep this documentation up to date: when a change introduces, removes, or alters an architectural pattern or boundary described in `docs/architecture.md`, update that document in the same change, and add a new ADR to `docs/decisions/` if a significant new decision was made. Stale architecture docs are worse than none — don't leave them describing a pattern the code no longer follows.

## Guidance for Future Sessions

- **Stack:** Vite 8 + React 19 + TypeScript 6, npm as package manager.
- **Routing:** React Router v7 (classic JSX `<BrowserRouter>`/`<Routes>`/`<Route>`).
- **Styling:** Tailwind v4 + shadcn/ui (New York style, lucide-react icons). shadcn components live in `src/components/ui/` — add new ones via `npx shadcn@latest add <name>`, don't hand-write them.
- **Forms:** react-hook-form + zod + shadcn's `Form` component.
- **Testing:** Multi-layer strategy:
  - **Vitest + React Testing Library** — component/unit tests, colocated `.test.tsx` files. Run `npm run test`.
  - **Playwright** — E2E browser tests in `e2e/`. Run `npm run test:e2e` (headless) or `npm run test:e2e:headed` (watch in browser). For debugging, use `$env:PLAYWRIGHT_SLOW_MO=800; npm run test:e2e:headed` (PowerShell) to slow down operations (in milliseconds).
  - **Storybook** — Visual component development & testing. Run `npm run storybook`. Stories live in `.stories.tsx` files alongside components.
- **Linting:** oxlint (Vite's default). Run `npm run lint`.
- **Commands:**
  - `npm install` — install dependencies
  - `npm run dev` — start dev server
  - `npm run build` — TypeScript check + Vite production build
  - `npm run lint` — run oxlint
  - `npm run test` — run Vitest tests
  - `npm run test:ui` — run Vitest with UI dashboard
  - `npm run storybook` — start Storybook component development server
  - `npm run test:e2e` — run Playwright E2E tests (headless)
  - `npm run test:e2e:headed` — run Playwright E2E tests (visible browser)
  - `npm run preview` — preview production build
- **Node:** No version pinned. Recommend Node ≥20.19 (Vite 7+ minimum). Current tested version: v24.19.0.
- **Folder convention:** `src/{pages,components,context,mocks,lib}`. Pages are route-level components in `src/pages/`, shared components in `src/components/`, shadcn UI in `src/components/ui/`, contexts in `src/context/`, utilities in `src/lib/`, mock data in `src/mocks/`.
- Keep this file updated as conventions evolve.

## Design Guidelines

See `DESIGN-GUIDELINES.md` for the Netcompany brand palette, typography, layout rules, and AI implementation guidance. All UI work must follow these guidelines. In short:

- **Colours:** Use only the defined Netcompany palette (`green`, `green-10` through `green-90`, `dark-green`, `white`, `coral`). No arbitrary colours.
- **Coral:** One prominent use per page max. Accent only.
- **Typography:** Studio 6 (fallback Arial). Regular default, Demibold/Bold for hierarchy only.
- **Style:** Clean, technical, restrained. No gradients, heavy shadows, or generic SaaS look.

## Styling Rules

**Always** follow `DESIGN-GUIDELINES.md`. When styling:

- Use only the defined CSS variables (`--primary`, `--foreground`, etc.) — never hardcode hex values or arbitrary colours.
- Extend existing shadcn component variants (`default`, `secondary`, `outline`, etc.) instead of overriding with inline classes.
- If a variant doesn't fit, modify the component's `cva` config in `src/components/ui/` — don't patch it inline.
- Keep styling clean and reusable. Never bolt on inline classes just to make something "look right" quickly.

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
| `playwright.config.ts` | Playwright E2E test runner: Chromium, screenshots on failure, auto-starts dev server | [Playwright Config](https://playwright.dev/docs/test-configuration) |

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
