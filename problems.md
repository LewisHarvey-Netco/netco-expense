# Problems Log

Running log of friction/issues encountered in the human↔agent workflow
with this Feniks AI / opencode setup — permission quirks, tooling gaps,
environment inconsistencies, or anything else that slowed down or blocked
a session. This is NOT for application bugs (those belong in normal issue
tracking) — it's specifically for problems with the *setup* and *workflow*
itself.

Each entry should include: date, what was attempted, what went wrong,
root cause (if known), and current status (open / worked around /
resolved).

## Organization

Problems are divided into three categories:

1. **Developer Workflow Adjustments** — issues that the developer can address by adjusting their workflow, configuration, or setup practices. These do not require changes to Feniks AI itself.

2. **Feniks AI / Tooling Fixes Needed** — issues that require changes to Feniks AI or opencode configuration. These cannot be resolved by the developer alone and need fixes from the Feniks AI team.

3. **Non-AI Related Problems** — upstream tool issues (shadcn, Playwright, etc.) or generic programming problems that would occur regardless of whether an AI agent is involved. These are included for completeness but require fixes from tool maintainers or represent general best practices.

---

# Developer Workflow Adjustments

Issues the developer can address without changes to Feniks AI.

## 2026-08-24 — Read tool bypasses .gitignore via absolute path

**What was attempted:** Relying on `.gitignore` to prevent the agent from
reading sensitive or irrelevant files (e.g., `node_modules/`, `.env`,
`dist/`).

**What went wrong:** The read tool can access files by absolute path even
when they are listed in `.gitignore`. The `.gitignore` file has no effect
on the agent's file read permissions.

**Root cause:** `.gitignore` only controls git tracking, not tool-level
file access. The read tool operates on the filesystem directly and does
not consult `.gitignore`.

**Status:** Fixed.

**Solution:** Added explicit read/write exclusions to `AGENTS.md` under Project Structure:

```
Agent read/write permissions:
- src/: main application code, agent should work here
- scripts/: build/deploy scripts, agent may read but not modify
- node_modules/: DO NOT read or analyze, ever (bloats context, no useful information)
- .env: DO NOT read, contains secrets (blocked by security policy)
- dist/: DO NOT read, generated output (ignored by git, bloats context)
- test-results/: DO NOT read, test artifacts only (regenerated on every test run)
```



## 2026-09-02 — Piping an allowed command breaks the bash permission match

**What was attempted:** Running
`npm run test -- src/pages/ExpenseDetailPage.test.tsx 2>&1 | Select-Object -Last 30`
to run a single test file with truncated output.

**What went wrong:** Denied. The bare `npm run test -- <file>` matches the
`npm run *` allow rule, but appending `2>&1 | Select-Object -Last 30` makes
the whole command string fail to match any rule.

**Root cause:** The bash permission matcher does whole-string pattern
matching; pipes and redirections change the string so it no longer matches
the intended allow rule (`npm run *`).

**Status:** Worked around.

**Developer action:** Avoid piping allowed commands or adding redirections. The bash tool
auto-saves output to a file when it exceeds the limit, so use the Grep tool on the
saved output file to extract relevant lines instead of piping within the command itself.

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

## 2026-08-17 — Bash permission policy blocking PowerShell cmdlets

**What was attempted:** Common Windows inspection tasks: checking file existence
(`Test-Path`), listing directories (`Get-ChildItem`), and running multi-statement
PowerShell one-liners with pipes and variables.

**What went wrong:** All were denied. The bash allowlist is tuned for Unix command names
(`ls`, `cat`, `grep`, `rm`, etc.) and does not recognize their PowerShell cmdlet equivalents
(`Get-ChildItem`, `Test-Path`, `Remove-Item`). Multi-statement one-liners with pipes and
variables are also denied even when constituent commands are allowed.

**Root cause:** The bash permission allowlist in `opencode.json` lists Unix command names;
on Windows/PowerShell the equivalent cmdlets are not covered. The permission matcher evaluates
the entire command string as a whole and does not decompose statements before matching. This
reflects OpenCode's Unix-centric heritage—Feniks forked it for Windows but did not fully adapt
the permission model.

**Status:** Resolved (workflow documented).

**Solution:** Rather than modifying permission rules (which could introduce security gaps),
added explicit guidance to AGENTS.md:

> **Windows shell note:** On Windows, use Read and Glob tools instead of PowerShell cmdlets.
> The bash permission policy is tuned for Unix commands. For file inspection, use the Read
> tool on directories and Glob for pattern matching. For complex queries, use `node -e`
> instead of multi-statement PowerShell pipelines.

This eliminates wasted attempts on denied commands and guides the agent to use the correct
tools from the start. Case study section "Guarding Against Context Bloat" documents the
principle: documenting tool constraints prevents per-session corrections.

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

**Status:** Resolved (workaround applied).

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

## 2026-08-24 — Storybook vitest project fails on aria-query `elementRoles` import (pre-existing)

**What was attempted:** Running the full test suite (`npm run test`) after
implementing ticket 05 (filter logic + FilterPanel). The suite has two
projects: jsdom (unit/component tests) and storybook (runs every
`.stories.tsx` in headless chromium via `@storybook/addon-vitest`).

**What went wrong:** All 7 story files fail (including the 6 that existed
before this session's changes — Button, Card, Input, Alert, Badge,
ExpenseTable) with the same infrastructure error:

```
Error: Failed to import test file
  .../@storybook/addon-vitest/dist/vitest-plugin/setup-file-with-project-annotations.js
Caused by: SyntaxError: The requested module
  '/node_modules/aria-query/lib/index.js' does not provide an export named 'elementRoles'
```

The jsdom project passes fully (60/60 tests).

**Root cause (corrected):** NOT a version mismatch. The installed
`aria-query@5.3.0` does export `elementRoles` (verified in its CJS build).
The real cause: the storybook project runs in a real browser (chromium via
`@vitest/browser-playwright`). `@testing-library/dom` (imported by the
Storybook setup file) does ESM named imports from CJS-only packages
(`aria-query`, `lz-string`). Vite's dep scanner only scans app entry points,
not test/setup files, so those CJS deps were never pre-bundled — Vite served
the raw CJS files to the browser, whose native ESM loader can't read CJS
`exports.x` as named exports. Hence "does not provide an export named
'elementRoles'" (and, once that was fixed, the same error for `lz-string`).
Verified pre-existing and unrelated to this session's code: the 6 story files
that existed before ticket 05 failed identically, and `git diff
package-lock.json` showed the only lockfile change was `lucide-react`.

**Status:** Resolved.

**Solution:** Add the CJS deps (and the ESM package that imports them) to
`optimizeDeps.include` in `vitest.config.ts` so Vite pre-bundles them into
proper ESM for the browser:

```ts
optimizeDeps: {
  include: ['@testing-library/dom', 'aria-query', 'lz-string']
}
```

After this, the full suite passes: 15/15 test files, 87 tests (63 jsdom +
24 storybook/chromium).

**Note:** If a new CJS-only dep is later pulled in by the Storybook setup or
a test file, the same "does not provide an export named X" error will recur
in the storybook project — add that package to `optimizeDeps.include` too.

**Requires fix:** This is a Vite + Storybook integration issue; may require updates to dep scanning logic or documentation.
