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

**Status:** Worked around.

**Developer action:** When invoking the agent to fix a build/test/lint failure, explicitly
instruct it to present the issue and propose a fix without applying it. For example:
"The build is failing. Diagnose the issue and propose a fix, but don't apply it yet —
let me review and approve first." For large refactors or architectural changes, use Plan
mode to discuss options before switching to Build mode to implement.

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


