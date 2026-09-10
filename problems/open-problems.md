# Open Problems Log

Running log of ongoing friction/issues encountered in the human↔agent workflow
with this Feniks AI / opencode setup — permission quirks, tooling gaps,
environment inconsistencies, or anything else that slowed down or blocked
a session. This is NOT for application bugs (those belong in normal issue
tracking) — it's specifically for problems with the *setup* and *workflow*
itself.

Each entry should include: date, what was attempted, what went wrong,
root cause (if known), and current status (open / worked around).

---

# Developer Workflow Adjustments

Issues the developer can address without changes to Feniks AI.

## 2026-09-02 — Edit tool reports "Could not find oldString" but the edit was applied

**What was attempted:** A sequence of `edit` calls on `src/pages/ExpenseDetailPage.test.tsx`
and `src/components/expenses/ExpenseDetailCard.stories.tsx` (adding a new `describe` block,
then adding a `const` to it; adding a Storybook `decorators` array).

**What went wrong:** Several `edit` calls returned `Could not find oldString in the file` even
though the `oldString` was present in the file (and, on re-reading, the intended change WAS in
the file).

**Root cause:** Unknown. Possibly a race between applying the edit and re-reading the file for
the match/confirmation check, or stale in-memory file state when edits are made in quick
succession on the same file.

**Status:** Worked around.

**Developer action:** After every `edit` call (especially on a file just edited), verify the
change by re-reading the affected region or grepping for the expected text. Do not trust
the tool's success/failure message at face value — confirm the on-disk state before proceeding.

**Requires fix:** The edit tool should re-read the file from disk immediately before reporting
success/failure, ensuring the reported status always matches the on-disk state.

---

# Feniks AI / Tooling Fixes Needed

Issues that require changes to Feniks AI or opencode configuration.

## 2026-08-17 — Plan mode's bash permissions too restrictive for read-only inspection

**What was attempted:** During a plan-mode interview, tried to run `node --version` /
`npm --version` to check the installed Node version before deciding on setup.

**What went wrong:** The command was denied. The plan agent's bash permission override
is much smaller than the top-level allowlist, restricting commands to only read-only
git/file inspection (`git status/diff/log`, `cat`, `head`, `tail`, `grep`, `ls`, etc.)
without allowing clear read-only version/inspection commands like `node --version`.

**Root cause:** The `agent.plan.permission.bash` allowlist is stricter than necessary.
It restricts planning mode to be read-only (by design) but then blocks even read-only
queries like `node --version` that don't mutate state.

**Status:** Worked around by asking the user.

**Impact:** Planning mode cannot verify environment details independently, forcing
reliance on user input for basic setup information.

**Feniks fix needed:** Add a small set of clearly read-only version/inspection commands
to `agent.plan.permission.bash` (`node --version`, `npm --version`, `node -v`, `npm -v`,
`node -e`, etc.) so planning sessions can verify environment details independently.

## 2026-08-17 — OpenCode for Feniks unavailable on WSL for Linux-based projects

**What was attempted:** Using OpenCode for Feniks on a Windows machine to work on
projects that are Linux-based (common via WSL).

**What went wrong:** OpenCode for Feniks is not available for WSL, meaning agent sessions
run in the Windows environment (PowerShell) rather than the Linux WSL environment where
the actual project tooling and dependencies live. This creates a mismatch.

**Root cause:** OpenCode for Feniks currently ships as a Windows-only application and
cannot be installed or run inside WSL.

**Discussion:** [Viva Engage thread](https://engage.cloud.microsoft/main/org/netcompany.com/threads/eyJfdHlwZSI6IlRocmVhZCIsImlkIjoiNDAwMzI1OTg5NzkyOTcyOCJ9?trk_copy_link=V2)

**Status:** Open.

**Impact:** Any project that relies on WSL for its toolchain requires the Windows environment
to also have the same tooling installed, or the agent won't be able to execute commands
against it. This adds setup friction and risks version drift.

**Feniks fix needed:** Either provide an OpenCode for Feniks build for WSL or improve
the Windows build to detect and work directly with WSL environments.

## 2026-08-17 — Aggressive prompt injection detection with zero diagnostic info

**What was attempted:** Running `npm run build` and `npm run test` via the bash tool to verify
the project compiles and tests pass.

**What went wrong:** Commands were blocked with `[BLOCKED: prompt injection detected]` with
no further explanation, file path, pattern, or diagnostic information provided.

**Root cause:** The security injection detection appears to trigger on project content containing
patterns like password fields, storage keys, or mock credentials (e.g. `src/mocks/users.json`,
`AuthContext.tsx`). However, the error message provides zero visibility into what triggered it.

**Status:** Open. Worked around by having the user run commands manually.

**Discussion:** [Teams thread](https://teams.microsoft.com/l/entity/683f3525-d193-4a67-8d91-22093beab1ca/?context=%7B%22internalId%22%3A%2219%3AeyJfdHlwZSI6Ikdyb3VwIiwiaWQiOiIyNTQ3MDYzMTExNjgifQ%40EngageCommunity%22%2C%22contextType%22%3A%22engageCommunity%22%2C%22subEntityId%22%3A%22%7B%5C%22deepLinkType%5C%22%3A%5C%22crossapp%5C%22%2C%5C%22path%5C%22%3A%5C%22%2Fthreads%2FeyJfdHlwZSI6IlRocmVhZCIsImlkIjoiMzk4NDM3MTk4MTc4NzEzNiJ9%5C%22%7D%22%7D)

**Impact:** When a command is blocked, the developer cannot diagnose why or fix it. The lack
of diagnostics creates a bad incentive structure: the obvious solution is to disable the
injection detection entirely, which removes the security feature rather than tuning it.

**Feniks fix needed:**
1. When a command is blocked, output which file or content pattern triggered it
2. Provide a way to view and adjust the injection detection rules
3. Consider scoping detection to external/untrusted content (fetched URLs, user messages)
   rather than the project's own source files

## 2026-08-18 — LLM bridge masks credentials in code output (corrupting generated code)

**What was attempted:** Writing test code containing test fixtures and mock credentials
(e.g. email/password strings like `'alice@netcompany.com'`, `'password123'`).

**What went wrong:** The LLM bridge redacted credential-like strings in the agent's output,
replacing them with asterisks. For example, `'alice@netcompany.com'` became `'alic*****.com'`
and `{ name: /sign in/i }` became `{ name*** }`. This corrupted the generated code,
causing parse errors and test failures.

**Root cause:** The LLM bridge has a security filter that detects password/credential patterns
and masks them before they reach the user. This is intended to prevent credential leakage,
but it incorrectly triggers on test fixtures, mock data, and demo credentials that are part
of the legitimate codebase.

**Status:** Open. Worked around by manually fixing the corrupted strings after generation.

**Impact:** The agent cannot write test fixtures containing realistic email/password patterns,
mock data files with credential-like fields, or any code containing strings that look like
credentials. This severely limits the ability to generate realistic tests.

**Feniks fix needed:** The masking filter should be context-aware:
1. Do not redact strings in test files (*.test.tsx, *.spec.ts), mock data files (src/mocks/),
   or files already tracked by git
2. Provide a whitelist or disable option for known demo credentials
3. At minimum, provide diagnostic output showing what was masked so the user can fix it

## 2026-08-17 — Agent applies workarounds without consulting the user

**What was attempted:** Standard build workflow — agent runs verification commands,
encounters errors, and fixes them.

**What went wrong:** The agent independently decided to refactor the router architecture
(moving `<BrowserRouter>` from `App.tsx` to `main.tsx`) and rewrite test file structure
without informing the user or asking for approval. While the fix was correct, the user
was not consulted before structural changes were made.

**Root cause:** No explicit workflow rule in place requiring the agent to ask before
applying workarounds or making architectural changes. The agent's default behavior is
to solve problems autonomously.

**Status:** Open.

**Impact:** The user loses control over architectural decisions and can be surprised
by major refactors applied without consent.

**Feniks fix needed:** Add a workflow rule: when the agent encounters an error or blocker
during verification (build, test, lint), it should present the issue to the user and
propose a fix before applying it. Only apply the fix after the user confirms.

## 2026-08-20 — Feniks startup fails with Docker container not found, requires full termination

**What was attempted:** Starting Feniks normally to begin a session.

**What went wrong:** Feniks occasionally complains about not finding Docker containers
on startup. The error persists through normal restart attempts and the only reliable fix
is to fully terminate Feniks from the taskbar (close the process completely) before relaunching.

**Root cause:** Unknown. Likely a stale Docker context or orphaned process state that
Feniks doesn't clean up on normal exit.

**Status:** Open.

**Workaround:** Force-close Feniks from the taskbar when the error appears, then relaunch.

**Impact:** Sessions are interrupted and have to be completely restarted.

**Feniks fix needed:** Feniks should detect and clean up stale Docker state on startup,
or gracefully handle the missing container case without requiring a full process kill.

## 2026-08-25 — `/code-review` referenced by the implement skill but no such skill/command exists

**What was attempted:** Following the `implement` skill's workflow for ticket
07 (Expense Detail Page): "Once done, use /code-review to review the work."
Searched for a code-review skill or command: not in the session's
`available_skills` list (only `customize-opencode`, `grill-me`, `implement`,
`mattpocock-skills-write-a-prd`, `to-tickets`), not in
`.opencode/` in the project, and not in `~/.config/opencode/`.

**What went wrong:** The `implement` skill instructs the agent to run
`/code-review` as the final step, but no such skill or custom command is
installed anywhere the agent can load it.

**Root cause:** The `implement` skill references a `/code-review` step that
was never installed/configured in this environment. The skill and the environment
are out of sync.

**Status:** Worked around.

**Developer action:** When the `implement` skill finishes, perform a manual review
of the diff against the ticket, DESIGN-GUIDELINES, `docs/architecture.md`, ADRs,
and lint output. The review should verify:
1. All ticket acceptance criteria are met
2. Code follows the patterns in `docs/architecture.md`
3. Components have Storybook stories (if new)
4. Tests cover the implementation (unit + component + E2E as needed)
5. Lint passes (`npm run lint`)
6. TypeScript is strict (`npm run build` succeeds)

**Requires fix:** Either add a `/code-review` skill to the environment or update
the `implement` skill to describe the manual review fallback.

## 2026-09-01 — Storybook vitest project: transient "Failed to fetch dynamically imported module" on first run after adding a story

**What was attempted:** Running the full test suite (`npm run test`) after
adding `src/components/Header.stories.tsx` (ticket 10). The new story
imports `react-router-dom` (MemoryRouter) and `@/context/AuthContext` —
modules the other stories don't import, so the Storybook Vite server's
dep graph changed.

**What went wrong:** On the first full run, all 3 new Header stories
failed with `TypeError: Failed to fetch dynamically imported module:
http://localhost:63315/node_modules/.cache/storybook/.../sb-vitest/deps/
@storybook_addon-docs_n_@storybook_react-dom-shim.js` while the 9
pre-existing story files passed. Re-running the storybook project alone
(`npm run test -- --project=storybook`) and then the full suite again
passed 100% (23 files / 151 tests) with no code changes in between.

**Root cause (likely):** Vite re-optimized dependencies mid-run because
the new story introduced new modules to the browser project's dep graph;
the chromium browser fetched a dep-shim chunk while it was still being
written. The error names the docs-addon shim (not the new imports), which
is consistent with a cache/optimization race rather than a problem with
the story itself.

**Status:** Resolved (transient). Workaround: if a story fails with
"Failed to fetch dynamically imported module" under `node_modules/.cache/
storybook/.../sb-vitest/deps/`, re-run before debugging the story; if it
persists, clear `node_modules/.cache/storybook` and re-run.

---

# Non-AI Related Problems

Upstream tool issues or generic programming problems that would occur regardless of whether an AI agent is involved.

## 2026-08-24 — shadcn CLI doesn't resolve `@` alias on Windows

**What was attempted:** `npx shadcn@latest add select checkbox` to add shadcn/ui components
using the `@` path alias defined in `components.json`.

**What went wrong:** The CLI created files at a literal `@/components/ui/` directory in the
project root instead of resolving the `@` alias to `src/components/ui/`. The CLI output showed
the broken path: `@\components\ui\select.tsx`.

**Root cause:** The shadcn CLI on Windows doesn't resolve the `@` alias from `components.json`
against the Vite alias config—it treats `@` as a literal directory name.

**Status:** Worked around (workaround applied).

**Solution:** In `components.json`, use an explicit relative path instead of the `@` alias:

```json
{
  "componentsDir": "./src/components/ui"
}
```

instead of:

```json
{
  "componentsDir": "@/components/ui"
}
```

This ensures the shadcn CLI writes components to the correct location on all platforms.

**Requires fix:** shadcn CLI team needs to fix Windows path alias resolution.
