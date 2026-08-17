# Plan: Scaffold Barebones Vite + React + TS "Hello World"

## Goal

Set up the initial "hello world" skeleton of the Netco Expense app using Vite,
React, and TypeScript, scaffolded via npm. This is a pure scaffolding step —
no expense-tracking features yet — that establishes the stack and gets a
build/lint pipeline working, then documents the chosen conventions in
`AGENTS.md` and `README.md`.

## Current State

- Repo root (`C:\Users\lehar\code-experiments\netco-expense`) contains only:
  - `README.md` — placeholder, "Tech Stack: Coming soon", "Getting Started:
    Coming soon"
  - `AGENTS.md` — states repo is empty beyond README, instructs future
    sessions to choose a stack and document conventions/commands once chosen
  - `.git/`
  - `.opencode/` (skills, plans, tool-output — not part of the app)
- No `package.json`, no `node_modules`, no source files exist yet.
- Node/npm versions on this machine were not verified during planning (see
  Open Questions/Risks below) — plan-mode's restricted bash allowlist
  couldn't run `node --version`. Verify at execution time.

## Decisions Made (via interview)

| Topic | Decision |
|---|---|
| Framework/template | React + TypeScript (Vite's `react-ts` template) |
| Package manager | npm |
| Project location | Repo root (not a subdirectory) |
| `package.json` name | `netco-expense` |
| Linting | Keep Vite's default ESLint config as scaffolded; no Prettier added |
| App.tsx content | Replace Vite's demo (logos/counter) with a minimal "Netco Expense" placeholder |
| Default assets | Remove `src/assets/react.svg` and its import; strip demo styles from `App.css`; keep `index.css` basic resets; keep `public/vite.svg` + favicon link as-is |
| `index.html` title | Change to `Netco Expense` |
| Docs | Update both `AGENTS.md` and `README.md` with stack + verified commands |
| Node version | No pinning (no `engines` field, no `.nvmrc`) — defer to execution time; README notes a recommended minimum |
| Scaffold method | Run `npm create vite@latest . -- --template react-ts` (official scaffolder), not hand-written files |
| Non-empty directory | Pass whatever non-interactive force flag the current `create-vite` version requires so it scaffolds into `.` without prompting |
| `.gitignore` | Use Vite's generated default as-is, no additions |
| Verification | `npm install` + `npm run build` + `npm run lint` (no dev server / manual browser check) |
| Git commit | Do NOT commit — leave changes staged/uncommitted for user review |

## Proposed Changes

1. **Scaffold the Vite project into repo root**
   - Run: `npm create vite@latest . -- --template react-ts` from
     `C:\Users\lehar\code-experiments\netco-expense`.
   - Since the directory already contains `README.md`, `AGENTS.md`, `.git/`,
     `.opencode/`, the scaffolder will likely refuse to run non-interactively
     without a force flag. Check the current `create-vite` version's flag
     (commonly `--force`, possibly needs to be combined with confirming via
     `--yes` or piped input) and use it so the command completes
     non-interactively.
   - After scaffolding, verify via `git status` / directory listing that
     `README.md`, `AGENTS.md`, `.git/`, and `.opencode/` were **not**
     overwritten or deleted — `create-vite` should only add new files
     (`package.json`, `vite.config.ts`, `tsconfig*.json`, `index.html`,
     `src/`, `public/`, `.gitignore`, `eslint.config.js`, etc.).
   - Confirm `package.json`'s `"name"` field ends up as `netco-expense`
     (the scaffolder derives it from the target directory name, which
     matches, so this should be automatic — verify and correct if not).

2. **Clean up default demo content**
   - `src/App.tsx`: replace the generated counter/logo demo with a minimal
     placeholder, e.g.:
     ```tsx
     function App() {
       return (
         <div>
           <h1>Netco Expense</h1>
           <p>Hello world — app scaffold ready.</p>
         </div>
       )
     }

     export default App
     ```
   - Remove the `import reactLogo from './assets/react.svg'` line and the
     `src/assets/react.svg` file itself.
   - `src/App.css`: strip out the demo styling (logo animations, card
     styles) tied to the removed logos/counter. Leave it minimal or empty —
     don't delete the file since `App.tsx` may still import it.
   - `src/index.css`: leave the basic CSS reset/defaults as scaffolded.
   - Leave `public/vite.svg` and the `<link rel="icon" ... href="/vite.svg">`
     tag in `index.html` untouched (out of scope for this barebones step).

3. **Update `index.html` title**
   - Change `<title>Vite + React + TS</title>` to `<title>Netco Expense</title>`.

4. **Verify build/lint tooling works**
   - `npm install`
   - `npm run build` (runs `tsc -b && vite build` per the template's default
     script) — must complete with no TypeScript or build errors.
   - `npm run lint` — must complete with no ESLint errors (warnings are
     acceptable if the default config produces any, but ideally zero).
   - Do **not** run `npm run dev` / start the dev server as part of
     verification — no interactive browser check is expected from the
     executing agent.

5. **Update `AGENTS.md`**
   - Replace the "Guidance for Future Sessions" placeholder content with the
     verified stack and commands, e.g.:
     - Stack: Vite + React + TypeScript, npm as package manager.
     - Commands: `npm install`, `npm run dev`, `npm run build`,
       `npm run lint`, `npm run preview` (whatever scripts `create-vite`
       actually generates — confirm exact script names from the generated
       `package.json` before writing them into the doc).
     - Note: Node version was not pinned; recommend Node ≥20.19 (Vite 7's
       documented minimum) or whatever the installed/tested version turns
       out to be once verified.
     - Keep instruction to keep this file updated as conventions evolve.

6. **Update `README.md`**
   - Fill in `## Tech Stack` with: Vite, React, TypeScript, npm.
   - Fill in `## Getting Started` with the verified install/run steps:
     ```
     npm install
     npm run dev
     ```
     and mention `npm run build` / `npm run lint` as available scripts.

7. **Do not commit**
   - Leave all changes in the working tree uncommitted. Do not run
     `git add` or `git commit`. The user will review and commit manually.

## Risks / Open Questions

- **Node/npm version unverified.** Plan-mode's restricted bash allowlist
  prevented running `node --version` / `npm --version` during planning.
  The executor (in build mode) should check this first; if Node is below
  Vite 7's minimum (20.19+ / 22.12+), either upgrade Node or fall back to
  an older Vite version — flag to the user if this happens, since it wasn't
  anticipated in this plan.
- **Exact `create-vite` force-flag syntax may have changed.** The flag name
  needed to scaffold into a non-empty directory non-interactively varies
  across `create-vite` versions. The executor should check
  `npm create vite@latest -- --help` if the plain command errors out, rather
  than assuming `--force` is correct.
- **Non-empty directory scaffold could still prompt.** Even with a force
  flag, some `create-vite` versions ask a follow-up question about
  overwriting specific files. The executor should be ready to pipe a
  confirmation (e.g. via `--yes` or answering the prompt) or investigate if
  `npm create vite@latest .` behaves unexpectedly.
- **ESLint config generated by the current Vite template is unknown until
  scaffolded.** The plan assumes it will pass with zero/near-zero errors
  out of the box (true for the standard `react-ts` template as of recent
  Vite versions) — if it doesn't, the executor should report back rather
  than silently modifying lint rules, since "keep Vite's default ESLint
  config" was an explicit decision.
- Plan-mode's restricted bash permissions (which blocked `node --version`
  during planning) are now tracked as a process issue in `problems.md` at
  the repo root, per the separate `problems-log-setup.md` plan — not
  duplicated here.
