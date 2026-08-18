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

---

## 2026-08-17 — Plan mode's bash permissions block basic read-only checks

**What was attempted:** During a plan-mode interview about scaffolding a
Vite app, tried to run `node --version` / `npm --version` to check the
installed Node version before deciding whether to pin an engines field.

**What went wrong:** The command was denied. Same happened for
`Get-ChildItem` (PowerShell dir listing) even though `ls *` is allowed —
the plan agent's bash permission override doesn't recognize PowerShell
cmdlet aliases the same way, and commands like `node *` aren't in its
allowlist at all.

**Root cause:** `~/.config/opencode/opencode.json` defines a broad
top-level `permission.bash` allowlist (allows `node *`, `npm run *`,
etc.), but the `agent.plan.permission.bash` block *overrides* it
entirely with a much smaller allowlist scoped to read-only git/file
inspection commands only (`git status/diff/log/show/blame/branch/
ls-files`, `cat`, `head`, `tail`, `grep`, `rg`, `ls`, `tree`, `pwd`,
`wc`, `find`, `fd`, `jq`, `diff`, `file`, `stat`, `echo`). This is by
design (plan mode = read-only), but it's stricter than necessary for
*inspection-only* commands like `node --version` that don't mutate
anything.

**Status:** Worked around by asking the user directly instead of running
the command. Not fixed — fixing it means editing
`agent.plan.permission.bash` in `opencode.json`, which is itself outside
plan mode's write permissions (and a separate, deliberate task, likely
via the `customize-opencode` skill in build mode).

**Suggested fix:** Add a small set of clearly read-only version/inspection
commands (`node --version`, `npm --version`, `node -v`, `npm -v`, etc.) to
`agent.plan.permission.bash` so planning sessions can verify environment
details without needing to ask the user or defer to execution time.

## 2026-08-17 — OpenCode for Feniks unavailable on WSL for Linux-based projects

**What was attempted:** Using OpenCode for Feniks on a Windows machine to
work on projects that are Linux-based (common in the team's workflow,
typically via WSL).

**What went wrong:** OpenCode for Feniks is not available for WSL, meaning
agent sessions run in the Windows environment (PowerShell) rather than the
Linux WSL environment where the actual project tooling and dependencies
live. This creates a mismatch: the agent operates on Windows while many
projects expect a Linux toolchain (npm, node, bash scripts, Linux-native
tools, etc.).

**Root cause:** OpenCode for Feniks currently ships as a Windows-only
application and cannot be installed or run inside WSL.

**Status:** Open. Workaround: ensure Node.js and other project tooling are
installed on the Windows side (not just WSL) so the agent can operate on
them. Alternatively, run the agent on a Linux machine directly.

**Impact:** Any project that relies on WSL for its toolchain will require
the Windows environment to also have the same tooling installed, or the
agent won't be able to execute commands against it. This adds setup
friction and risks version drift between the Windows and WSL environments.

## 2026-08-17 — False positive prompt injection detection blocks build/test commands

**What was attempted:** Running `npm run build` and `npm run test` via the
agent's bash tool to verify the project compiles and tests pass.

**What went wrong:** Commands were blocked with `[BLOCKED: prompt injection
detected]` — no further explanation, file path, or triggered pattern
provided. The block persisted even after the `@/` directory cleanup was
complete, making it impossible for the agent to run verification commands.

**Root cause:** The security injection detection appears to trigger on
project content containing patterns like password fields, storage keys,
or mock credentials (e.g. `src/mocks/users.json`, `AuthContext.tsx`).
However, the error message gives zero visibility into what triggered it,
making it hard to diagnose or fix.

**Status:** Open. Worked around by having the user run commands manually.

**Suggested fix:** The injection detection should surface which file or
pattern triggered the block, so the user can distinguish false positives
from genuine issues. At minimum, the error message should name the
suspect file or content pattern.

## 2026-08-17 — Agent applies workarounds without consulting the user

**What was attempted:** Standard build workflow — agent runs verification
commands, encounters errors, and fixes them.

**What went wrong:** The agent independently decided to refactor the
router architecture (moving `<BrowserRouter>` from `App.tsx` to
`main.tsx`) and rewrite test file structure without informing the user
or asking for approval. While the fix was correct, the user was not
consulted before structural changes were made.

**Root cause:** No explicit workflow rule in place requiring the agent to
ask before applying workarounds or making architectural changes. The
agent's default behavior is to solve problems autonomously.

**Status:** Open.

**Suggested fix:** Add a workflow rule: when the agent encounters an
error or blocker during verification (build, test, lint), it should
present the issue to the user and propose a fix before applying it.
Only apply the fix after the user confirms. This keeps the user in the
loop and prevents surprise refactors.

## 2026-08-18 — LLM bridge masks passwords and credentials in code output

**What was attempted:** Writing test code containing email/password
strings (e.g., `'alice@netcompany.com'`, `'password123'`) in
`src/App.test.tsx`.

**What went wrong:** The LLM bridge is redacting credential-like strings
in the agent's output, replacing them with asterisks. For example,
`'alice@netcompany.com'` became `'alic************.com'` and
`{ name: /sign in/i }` became `{ name************ }`. This corrupted
the generated code, causing parse errors and test failures.

**Root cause:** The LLM bridge has a security filter that detects
password/credential patterns and masks them before they reach the
agent. This is intended to prevent credential leakage, but it
incorrectly triggers on test fixtures, mock data, and demo credentials
that are part of the codebase.

**Status:** Open. Worked around by manually fixing the corrupted strings
after the agent generates them.

**Suggested fix:** The masking should be aware of context — it should
not redact strings in test files, mock data, or code that's already
part of the repository. Alternatively, provide a way to whitelist
known demo credentials or disable masking for specific file patterns
like `*.test.tsx`, `*.spec.ts`, and `src/mocks/`.
