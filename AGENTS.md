# AGENTS.md

## Repo Purpose

Demo expense app built to experiment with Feniks AI capabilities. Start from scratch — no existing codebase conventions to follow.

## Project Structure

**Agent read/write permissions:**
- `src/`: main application code, agent should work here
- `scripts/`: build/deploy scripts, agent may read but not modify
- `node_modules/`: **DO NOT read or analyze, ever** (bloats context, no useful information)
- `.env`: **DO NOT read, contains secrets** (blocked by security policy)
- `dist/`: **DO NOT read, generated output** (ignored by git, bloats context)
- `test-results/`: **DO NOT read, test artifacts only** (regenerated on every test run)

The agent should rely on `.gitignore` for general guidance, but these explicit rules take precedence. When exploring the codebase, stick to `src/`, `docs/`, and config files. Avoid entire directory reads unless explicitly needed for a task.

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
    - **Note:** `toHaveTextContent` matcher was removed in Playwright 1.62+. Use `toHaveText()` (exact match) or `toContainText()` (substring match) instead.
  - **Storybook** — Visual component development & testing. Run `npm run storybook`. Stories live in `.stories.tsx` files alongside components.
    - **Note on vitest + Storybook:** When adding new stories that import previously-unused modules, you may see "Failed to fetch dynamically imported module" errors on first run. This is a Vite dependency optimization race condition. Workaround: re-run the tests. If the error persists, clear `node_modules/.cache/storybook` and re-run. See `problems.md` for full details on CJS/ESM pre-bundling requirements (`optimizeDeps.include` in `vitest.config.ts`).
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
- **Windows shell note:** On Windows, use Read and Glob tools instead of PowerShell cmdlets (`Get-ChildItem`, `Test-Path`, `Remove-Item`). The bash permission policy is tuned for Unix commands. For file inspection, use the Read tool on directories and Glob for pattern matching. For content search, use the Grep tool instead of bash `grep`. For complex queries, use `node -e` instead of multi-statement PowerShell pipelines.
  - **Important:** The bash permission matcher evaluates entire command strings as-is; pipes, redirections, and command chaining (e.g., `cmd1 | cmd2`, `cmd && cmd2`, `2>&1 > file`) may cause the whole command to fail the permission match even if the base command is allowed. **Avoid combining allowed commands with pipes or redirections.** When you need to filter or truncate output, run the command alone and use the Grep tool to search the auto-saved output file instead. Example: instead of `npm run test -- file.tsx | head -30`, run `npm run test -- file.tsx` and then use the Grep tool to search the output.
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

This repo maintains a `problems/` directory (`problems/open-problems.md` and
`problems/closed-problems.md`, see `problems/README.md` for the split),
tracking friction and issues in the human↔agent workflow itself
(permissions, tooling gaps, environment quirks — not application bugs).

- Whenever a session hits a workflow problem — a blocked command, a
  confusing permission denial, a tool that doesn't behave as expected,
  an ambiguous or missing instruction — document it in
  `problems/open-problems.md` using the existing entry format (date, what
  was attempted, what went wrong, root cause if known, status).
- Keep the problems log up to date at all times: add new entries to
  `open-problems.md` as issues arise, and move an entry to
  `closed-problems.md` once it's worked around or resolved.
- Do not delete old entries even after they're resolved — mark them
  resolved instead, so the log stays a historical record.
