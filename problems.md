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

**Discussion:** [Viva Engage thread](https://teams.microsoft.com/l/entity/683f3525-d193-4a67-8d91-22093beab1ca/?context=%7B%22internalId%22%3A%2219%3AeyJfdHlwZSI6Ikdyb3VwIiwiaWQiOiIyNTQ3MDYzMTExNjgifQ%40EngageCommunity%22%2C%22contextType%22%3A%22engageCommunity%22%2C%22subEntityId%22%3A%22%7B%5C%22deepLinkType%5C%22%3A%5C%22crossapp%5C%22%2C%5C%22path%5C%22%3A%5C%22%2Fthreads%2FeyJfdHlwZSI6IlRocmVhZCIsImlkIjoiMzk4NDM3MTk4MTc4NzEzNiJ9%5C%22%7D%22%7D)

**Status:** Open. Workaround: ensure Node.js and other project tooling are
installed on the Windows side (not just WSL) so the agent can operate on
them. Alternatively, run the agent on a Linux machine directly.

**Impact:** Any project that relies on WSL for its toolchain will require
the Windows environment to also have the same tooling installed, or the
agent won't be able to execute commands against it. This adds setup
friction and risks version drift between the Windows and WSL environments.

## 2026-08-17 — Aggressive prompt injection detection blocks legitimate commands and code

**What was attempted:** Running `npm run build` and `npm run test` via the
agent's bash tool to verify the project compiles and tests pass. Also
writing test code containing mock credentials (e.g. email/password
strings in `App.test.tsx`).

**What went wrong:** Commands were blocked with `[BLOCKED: prompt injection
detected]` — no further explanation, file path, or triggered pattern
provided. The block persisted even after the `@/` directory cleanup was
complete, making it impossible for the agent to run verification commands.
Separately, the LLM bridge redacted credential-like strings in generated
code (see next entry), further suggesting the security filters are
overly broad.

**Root cause:** The security injection detection appears to trigger on
project content containing patterns like password fields, storage keys,
or mock credentials (e.g. `src/mocks/users.json`, `AuthContext.tsx`).
However, the error message gives zero visibility into what triggered it,
making it hard to diagnose or fix. The filters seem designed to catch
prompt injection in *external* content, but they fire on the project's
own legitimate code and data. Because the developer sees no diagnostic
information about why a command was blocked, the most obvious course of
action is to simply disable the injection detection entirely — which
creates a bad incentive structure where the security feature is removed
rather than tuned to work correctly.

**Status:** Open. Worked around by having the user run commands manually.

**Discussion:** [Teams thread](https://teams.microsoft.com/l/entity/683f3525-d193-4a67-8d91-22093beab1ca/?context=%7B%22internalId%22%3A%2219%3AeyJfdHlwZSI6Ikdyb3VwIiwiaWQiOiIyNTQ3MDYzMTExNjgifQ%40EngageCommunity%22%2C%22contextType%22%3A%22engageCommunity%22%2C%22subEntityId%22%3A%22%7B%5C%22deepLinkType%5C%22%3A%5C%22crossapp%5C%22%2C%5C%22path%5C%22%3A%5C%22%2Fthreads%2FeyJfdHlwZSI6IlRocmVhZCIsImlkIjoiMzk4NDM3MTk4MTc4NzEzNiJ9%5C%22%7D%22%7D)

**Suggested fix:** The injection detection should surface which file or
pattern triggered the block, so the user can distinguish false positives
from genuine issues. At minimum, the error message should name the
suspect file or content pattern. Consider scoping the detection to
external/untrusted content (e.g. fetched URLs, user messages) rather
than the project's own source files.

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

## 2026-08-18 — Get-ChildItem with -LiteralPath fails consistently in bash tool

**What was attempted:** Running `Get-ChildItem -Force -LiteralPath "." | Select-Object Name, Mode`
(via the bash tool) to list directory contents in a way that handles paths with spaces and
special characters safely.

**What went wrong:** The command fails consistently. The same pattern works when using `ls *`
(which is on the bash allowlist), but `Get-ChildItem` is not — the `bash` tool's permission
rules allow `ls *` but do not include `Get-ChildItem` or other PowerShell cmdlets by name.
Using `tree /f /a` also fails for the same reason.

**Root cause:** The bash permission allowlist in `opencode.json` includes `ls *` and `tree *`
as allowed patterns, but these are Unix-native commands or external executables, not PowerShell
cmdlets. On Windows with PowerShell 5.1 as the shell, `ls` works only as an alias for
`Get-ChildItem`, and the allowlist matching may not resolve aliases. Meanwhile, running
`Get-ChildItem` directly is not covered by any allowlist pattern.

**Status:** Open. Worked around by using the Read tool on directories and the Glob tool for
file pattern matching, which are the recommended approach anyway per the tool usage policy.

**Suggested fix:** Either (a) add `Get-ChildItem *` and other commonly-needed PowerShell cmdlets
to the bash allowlist, or (b) clarify in AGENTS.md or the tooling docs that agents should prefer
the Read/Glob tools over shell-based directory listing on Windows, since the bash allowlist is
tuned for Unix commands and PowerShell cmdlets are not reliably covered.

## 2026-08-20 — Docker Desktop may require commercial license

**What was attempted:** Following opencode setup instructions that reference
Docker Desktop.

**What went wrong:** Docker Desktop's free tier is limited to organizations
with fewer than 250 employees AND less than $10M annual revenue. Netcompany
exceeds both thresholds, which means Docker Desktop use likely requires a
paid commercial license. Using it without a license would be a compliance
issue.

**Root cause:** The opencode setup documentation recommends Docker Desktop
without noting the commercial licensing requirements for large organizations.

**Status:** Open.

**Suggested fix:** Either (a) procure a Docker Desktop commercial license,
(b) switch to an alternative container runtime with no commercial licensing
restrictions (e.g., Docker Compose V2 standalone, podman-desktop, or
colima), or (c) update the setup docs to clarify the licensing requirement
so users are aware before installing.

## 2026-08-20 — Feniks startup fails with Docker container not found, requires full termination

**What was attempted:** Starting Feniks normally to begin a session.

**What went wrong:** Feniks occasionally complains about not finding Docker
containers on startup. The error persists through normal restart attempts
and the only reliable fix is to fully terminate Feniks from the taskbar
(close the process completely) before relaunching.

**Root cause:** Unknown. Likely a stale Docker context or orphaned process
state that Feniks doesn't clean up on normal exit.

**Status:** Open. Worked around by force-closing Feniks from the taskbar
when the error appears, then relaunching.

**Suggested fix:** Feniks should detect and clean up stale Docker state on
startup, or gracefully handle the missing container case without requiring
a full process kill.

## 2026-08-18 — No good way to reference small code snippets without overloading context

**What was attempted:** Referencing a specific function, type, or small code
section in conversation (e.g. "look at `roleHome()` in `types.ts`") to
ground a discussion or decision, without dumping the entire file into
context.

**What went wrong:** The available tools are all-or-nothing: `Read` loads
an entire file (or a large chunk), `Grep` returns matching lines but not
surrounding context, and `Glob` only finds filenames. There's no "show me
lines X–Y of this file" or "show me the definition of this function"
primitive. This means referencing even a 5-line function requires feeding
the agent the whole file, which wastes context window and makes
conversations harder to follow.

**Root cause:** The tool set is designed for exploration (find files,
search content, read files) rather than surgical code reference. The
`Read` tool supports `offset` and `limit`, but the agent has to know the
exact line numbers beforehand — which defeats the purpose when the goal
is to find and reference a specific snippet.

**Status:** Open. Worked around by reading whole files and accepting the
context cost, or using `Grep` to find line numbers then `Read` with
offset/limit — which requires two steps and is error-prone.

**Suggested fix:** Consider adding a tool or mode that lets the agent
reference a specific symbol, function, or line range without loading the
entire file. Even a "find definition" tool (like IDE go-to-definition)
would dramatically reduce context waste when discussing specific code.
